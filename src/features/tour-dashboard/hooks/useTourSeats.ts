import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, type ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { TOUR_DASHBOARD_KEYS, TOUR_SEAT_KEYS } from "@/shared/api/query-keys";

// 1. Interfaces estrictas
export type SeatStatus = "AVAILABLE" | "ASSIGNED" | "BLOCKED";

export interface UpdateSeatInput {
  seatLabel: string;
  status: SeatStatus;
  passengerId?: string | null;
  /** Solo para la actualización optimista (el asiento muestra el nombre real); no se envía. */
  passengerName?: string;
}

export interface SeatInfo {
  seatLabel: string;
  status: SeatStatus;
  passenger: {
    id: string;
    fullName: string;
  } | null;
  /** Solo en la caché: asiento pintado de forma optimista que la API aún no confirma. */
  isPending?: boolean;
}

/** Clave de la mutación de asientos, para saber si hay un guardado en curso (`useIsSavingSeat`). */
const seatMutationKey = (tourId: string) => [...TOUR_SEAT_KEYS.byTour(tourId), "update"] as const;

/** `true` mientras se guarda algún asiento del tour (asignar, mover, liberar o bloquear). */
export const useIsSavingSeat = (tourId: string): boolean =>
  useIsMutating({ mutationKey: seatMutationKey(tourId) }) > 0;

const fetchSeatsTourApi = async (tourId: string): Promise<SeatInfo[]> => {
  return apiClient.get<never, SeatInfo[]>(`/seats/${tourId}/seats`);
};

export const useTourSeats = (tourId: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: TOUR_SEAT_KEYS.byTour(tourId),
    queryFn: () => fetchSeatsTourApi(tourId),
    enabled: options.enabled ?? true,
    staleTime: 1000 * 15, // Frescura de 15 segundos para evitar parpadeos, pero mantenerlo reactivo
  });
};

export const useUpdateSeat = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: seatMutationKey(tourId),
    // `passengerName` solo sirve a la actualización optimista: no se envía a la API.
    mutationFn: ({ seatLabel, status, passengerId }: UpdateSeatInput) =>
      apiClient.patch(`/seats/${tourId}/seats/${seatLabel}`, { seatLabel, status, passengerId }),
    onMutate: async (newSeat) => {
      // 1. Cancelar queries en vuelo para que no sobrescriban nuestra actualización optimista
      await queryClient.cancelQueries({ queryKey: TOUR_SEAT_KEYS.byTour(tourId) });

      // 2. Guardar el estado anterior para el rollback
      const previousSeats = queryClient.getQueryData<SeatInfo[]>(TOUR_SEAT_KEYS.byTour(tourId));

      // 3. Mutar la caché manualmente de forma optimista
      queryClient.setQueryData<SeatInfo[]>(TOUR_SEAT_KEYS.byTour(tourId), (old = []) => {
        // Remover al pasajero de cualquier otro asiento (si está cambiando de lugar)
        const filtered = old.filter(
          (s) =>
            !(newSeat.passengerId && s.passenger?.id === newSeat.passengerId) &&
            s.seatLabel !== newSeat.seatLabel,
        );

        // Si la acción no fue liberar el asiento, lo agregamos con su nuevo estado
        if (newSeat.status !== "AVAILABLE") {
          filtered.push({
            seatLabel: newSeat.seatLabel,
            status: newSeat.status,
            passenger: newSeat.passengerId
              ? { id: newSeat.passengerId, fullName: newSeat.passengerName ?? "Asignando..." }
              : null,
            isPending: true,
          });
        }
        return filtered;
      });

      return { previousSeats };
    },
    onError: (err: ApiError, _, context) => {
      queryClient.setQueryData(TOUR_SEAT_KEYS.byTour(tourId), context?.previousSeats);
      // El mensaje de la API explica el rechazo (p. ej. anticipo no cubierto o tope de staff).
      toast.error("El asiento volvió a su estado anterior.", { description: err.message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TOUR_SEAT_KEYS.byTour(tourId) });
      queryClient.invalidateQueries({ queryKey: TOUR_DASHBOARD_KEYS.detail(tourId) });
    },
  });
};
