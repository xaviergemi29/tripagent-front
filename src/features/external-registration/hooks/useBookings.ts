import { apiClient, ApiError } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookingInput, BookingOutput } from "../schemas/booking.schema";
import {
  CancelFullBookingInput,
  QuickBookingInput,
  QuickBookingOutput,
} from "@/features/tour-dashboard/schemas/quick-booking.schema";

// ============================================================================
// 1. QUERY KEY FACTORY (Patrón de Arquitectura Limpia)
// ============================================================================
export const BOOKING_KEYS = {
  all: ["bookings"] as const,
  lists: (search?: string) => [...BOOKING_KEYS.all, { search }] as const,
  detail: (id: string) => [...BOOKING_KEYS.all, "detail", id] as const,
};

// ============================================================================
// 2. CAPA DE RED (Axios API Client)
// ============================================================================
const createBookingApi = async (bookingData: BookingInput): Promise<BookingOutput> => {
  return apiClient.post<never, BookingOutput>(`/bookings/public/register`, bookingData);
};

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
// 3. HOOKS DE MUTACIONES
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

export function useQuickReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createQuickBookingApi,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tour-dashboard", variables.tourId] });
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
    mutationFn: cancelFullBookingApi,
    onSuccess: () => {
      toast.success("Reserva cancelada por completo");
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["tour-dashboard"] });
    },
    onError: (error: ApiError) => toast.error("Error", { description: error.message }),
  });
};
