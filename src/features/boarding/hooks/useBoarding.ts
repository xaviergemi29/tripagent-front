import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, type ApiError } from "@/lib/api-client";
import { BOARDING_KEYS } from "@/shared/api/query-keys";
import type { StaffBoardingOutput, TourBoardingOutput } from "../schemas/boarding.schema";
import { applyBoardingChange, BOARDING_REFETCH_MS } from "../utils/boarding.util";

/**
 * Pase de lista de abordaje (RB-MAN-002). La lista se vuelve a pedir cada 15 s con la pestaña
 * visible y al volver a ella, para ver lo que marca la otra persona (operador o coordinador).
 */
const LIVE_QUERY_OPTIONS = {
  refetchInterval: BOARDING_REFETCH_MS,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
} as const;

/** Centro de Control: lista del tour (con sesión). */
export function useTourBoarding(tourId: string, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: BOARDING_KEYS.byTour(tourId),
    queryFn: () => apiClient.get<never, TourBoardingOutput>(`/tours/${tourId}/boarding`),
    enabled: enabled && Boolean(tourId),
    ...LIVE_QUERY_OPTIONS,
  });
}

/** Enlace de staff: lista del enlace (sin sesión). Arranca con lo que trajo el servidor. */
export function useStaffBoarding(token: string, initialData: StaffBoardingOutput) {
  return useQuery({
    queryKey: BOARDING_KEYS.byStaffToken(token),
    queryFn: () =>
      apiClient.get<never, StaffBoardingOutput>(
        `/public/staff-share/${encodeURIComponent(token)}/boarding`,
      ),
    initialData,
    // El dato del servidor es de esta misma carga: fresco durante un ciclo (no se pide al montar).
    staleTime: BOARDING_REFETCH_MS,
    ...LIVE_QUERY_OPTIONS,
  });
}

interface BoardingVariables {
  id: string;
  boarded: boolean;
}

/**
 * Marca optimista: la lista cambia al instante (puntos de abordaje con mala señal) y, si la API
 * falla, se revierte con un aviso. Al responder se toma la hora del servidor solo para ese renglón
 * (sin volver a pedir toda la lista, así marcar varios seguidos no parpadea).
 */
function useBoardingMutation<
  T extends { passengers: P[] },
  P extends { boardedAt: string | null },
>({
  queryKey,
  request,
  matches,
}: {
  queryKey: QueryKey;
  request: (variables: BoardingVariables) => Promise<{ boardedAt: string | null }>;
  matches: (passenger: P, id: string) => boolean;
}) {
  const queryClient = useQueryClient();
  return useMutation<{ boardedAt: string | null }, ApiError, BoardingVariables, { previous?: T }>({
    mutationFn: request,
    onMutate: async ({ id, boarded }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<T>(queryKey);
      queryClient.setQueryData<T>(queryKey, (current) =>
        current
          ? {
              ...current,
              passengers: applyBoardingChange(current.passengers, (p) => matches(p, id), boarded),
            }
          : current,
      );
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error("No se guardó el abordaje", { description: error.message });
    },
    onSuccess: (result, { id }) => {
      queryClient.setQueryData<T>(queryKey, (current) =>
        current
          ? {
              ...current,
              passengers: current.passengers.map((p) =>
                matches(p, id) ? { ...p, boardedAt: result.boardedAt } : p,
              ),
            }
          : current,
      );
    },
  });
}

export function useSetTourBoarding(tourId: string) {
  return useBoardingMutation<TourBoardingOutput, TourBoardingOutput["passengers"][number]>({
    queryKey: BOARDING_KEYS.byTour(tourId),
    request: ({ id, boarded }) =>
      apiClient.patch<never, { travelerId: string; boardedAt: string | null }>(
        `/tours/${tourId}/passengers/${id}/boarding`,
        { boarded },
      ),
    matches: (passenger, id) => passenger.travelerId === id,
  });
}

export function useSetStaffBoarding(token: string) {
  return useBoardingMutation<StaffBoardingOutput, StaffBoardingOutput["passengers"][number]>({
    queryKey: BOARDING_KEYS.byStaffToken(token),
    request: ({ id, boarded }) =>
      apiClient.patch<never, { boardingKey: string; boardedAt: string | null }>(
        `/public/staff-share/${encodeURIComponent(token)}/boarding/${encodeURIComponent(id)}`,
        { boarded },
      ),
    matches: (passenger, id) => passenger.boardingKey === id,
  });
}
