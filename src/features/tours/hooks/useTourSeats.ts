import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { TOUR_DASHBOARD_KEYS } from "@/features/tour-dashboard/hooks/useTourDashboard";

// 1. Interfaces estrictas
export type SeatStatus = "AVAILABLE" | "ASSIGNED" | "BLOCKED";

export interface UpdateSeatInput {
  seatLabel: string;
  status: SeatStatus;
  passengerId?: string | null;
}

export interface SeatInfo {
  seatLabel: string;
  status: SeatStatus;
  passenger: {
    id: string;
    fullName: string;
  } | null;
}

// Clave de asientos de un tour. Cuelga de ["tours"], así que invalidar TOUR_KEYS.all también la refresca.
export const TOUR_SEAT_KEYS = {
  byTour: (tourId: string) => ["tours", tourId, "seats"] as const,
};

const fetchSeatsTourApi = async (tourId: string): Promise<SeatInfo[]> => {
  return apiClient.get<never, SeatInfo[]>(`/seats/${tourId}/seats`);
};

export const useTourSeats = (tourId: string) => {
  return useQuery({
    queryKey: TOUR_SEAT_KEYS.byTour(tourId),
    queryFn: () => fetchSeatsTourApi(tourId),
    staleTime: 1000 * 15, // Frescura de 15 segundos para evitar parpadeos, pero mantenerlo reactivo
  });
};

export const useUpdateSeat = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSeatInput) =>
      apiClient.patch(`/seats/${tourId}/seats/${payload.seatLabel}`, payload),
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
              ? // En un caso real podrías buscar el nombre en tu lista global, aquí mockeamos para la UI inmediata
                { id: newSeat.passengerId, fullName: "Asignando..." }
              : null,
          });
        }
        return filtered;
      });

      return { previousSeats };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(TOUR_SEAT_KEYS.byTour(tourId), context?.previousSeats);
      toast.error("Error de sincronización. El asiento volvió a su estado anterior.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TOUR_SEAT_KEYS.byTour(tourId) });
      queryClient.invalidateQueries({ queryKey: TOUR_DASHBOARD_KEYS.detail(tourId) });
    },
  });
};
