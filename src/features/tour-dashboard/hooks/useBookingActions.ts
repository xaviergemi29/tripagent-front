import { apiClient, ApiError } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  CancelFullBookingInput,
  QuickBookingInput,
  QuickBookingOutput,
} from "../schemas/quick-booking.schema";
import { BOOKING_KEYS, MUTATION_KEYS } from "@/shared/api/query-keys";
import { invalidateBookingChange } from "@/shared/api/invalidate-booking-change";

/**
 * Acciones del operador sobre reservas desde el Centro de Control: apartado rápido y cancelación
 * completa. (Antes vivían en `external-registration/hooks/useBookings`, la feature del portal
 * público, y creaban un ciclo de dependencias con `tour-dashboard`.)
 */

// ============================================================================
// 1. CAPA DE RED (Axios API Client)
// ============================================================================
const createQuickBookingApi = async (
  newQuickBooking: QuickBookingInput,
): Promise<QuickBookingOutput> => {
  const { tourId, ...rest } = newQuickBooking;
  return await apiClient.post<never, QuickBookingOutput>(`/bookings/${tourId}/quick-booking`, rest);
};

const cancelFullBookingApi = async (cancellFullBooking: CancelFullBookingInput) => {
  const { bookingId, ...rest } = cancellFullBooking;
  return apiClient.patch(`/bookings/${bookingId}/cancel-full`, rest);
};

// ============================================================================
// 2. HOOKS DE MUTACIONES
// ============================================================================
export function useQuickReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createQuickBookingApi,
    onSuccess: (_, variables) => {
      invalidateBookingChange(queryClient, variables.tourId);
    },
    onError: (error: ApiError) => {
      toast.error("Error al apartar lugares", {
        description: error?.message || "Error al generar la reserva rápida",
      });
    },
  });
}

export const useCancelFullBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: MUTATION_KEYS.bookingGroupChange,
    mutationFn: cancelFullBookingApi,
    onSuccess: () => {
      toast.success("Reserva cancelada por completo");
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.all });
      invalidateBookingChange(queryClient);
    },
    onError: (error: ApiError) => toast.error("Error", { description: error.message }),
  });
};
