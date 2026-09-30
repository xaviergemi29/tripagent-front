import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

// 1. Interfaces estrictas
export type SeatStatus = "AVAILABLE" | "ASSIGNED" | "BLOCKED";

export interface UpdateSeatPayload {
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

const fetchSeatsTourApi = async (tourId: string) => {
  return apiClient.get<SeatInfo[], never>(`/seats/${tourId}/seats`);
};

export const useTourSeats = (tourId: string) => {
  return useQuery({
    queryKey: ["tours", tourId, "seats"],
    queryFn: () => fetchSeatsTourApi(tourId),
    staleTime: 1000 * 15, // Frescura de 15 segundos para evitar parpadeos, pero mantenerlo reactivo
  });
};

export const useUpdateSeat = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSeatPayload) =>
      apiClient.patch(`/seats/${tourId}/seats/${payload.seatLabel}`, payload),
    onMutate: async (newSeat) => {
      // 1. Cancelar queries en vuelo para que no sobrescriban nuestra actualización optimista
      await queryClient.cancelQueries({ queryKey: ["tours", tourId, "seats"] });

      // 2. Guardar el estado anterior para el rollback
      const previousSeats = queryClient.getQueryData<SeatInfo[]>(["tours", tourId, "seats"]);

      // 3. Mutar la caché manualmente de forma optimista
      queryClient.setQueryData<SeatInfo[]>(["tours", tourId, "seats"], (old = []) => {
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
    onError: (err, newSeat, context) => {
      // 4. Rollback en caso de error
      queryClient.setQueryData(["tours", tourId, "seats"], context?.previousSeats);
      toast.error("Error de sincronización. El asiento volvió a su estado anterior.");
    },
    onSettled: () => {
      // 5. Re-sincronizar con la verdad absoluta del servidor de fondo
      queryClient.invalidateQueries({ queryKey: ["tours", tourId, "seats"] });
    },
  });
};
