import { apiClient, ApiError } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookingInput, BookingOutput } from "../schemas/booking.schema";
import { BOOKING_KEYS } from "@/shared/api/query-keys";

// ============================================================================
// 1. CAPA DE RED (Axios API Client)
// ============================================================================
const createBookingApi = async (bookingData: BookingInput): Promise<BookingOutput> => {
  return apiClient.post<never, BookingOutput>(`/bookings/public/register`, bookingData);
};

// ============================================================================
// 2. HOOKS DE MUTACIONES (registro público del Magic Link; las acciones del operador viven en
//    tour-dashboard/hooks/useBookingActions)
// ============================================================================
export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBookingApi,
    onSuccess: () => {
      toast.success("Registro creado exitosamente");
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.all });
    },
    onError: (error: ApiError) => {
      toast.error("Error al crear la reserva", {
        description: error.message || "No se pudo guardar la información",
      });
    },
  });
};
