import { apiClient, ApiError } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookingInput, BookingOutput } from "../schemas/booking.schema";
import {
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
// 2. INTERFACES INTERNAS (Patrón de "Usa TS puro para contratos internos")
// ============================================================================
export interface CancelPassengerPayload {
  bookingId: string;
  travelerId: string;
  penaltyAmount: number;
}

// ============================================================================
// 3. CAPA DE RED (Axios API Client)
// ============================================================================
const createBookingApi = async (bookingData: BookingInput): Promise<BookingOutput> => {
  return apiClient.post<never, BookingOutput>(`/bookings/public/register`, bookingData);
};

const cancelPassengerApi = async ({
  bookingId,
  travelerId,
  penaltyAmount,
}: CancelPassengerPayload): Promise<any> => {
  return apiClient.patch<never, any>(
    `/bookingPassengers/${bookingId}/passengers/${travelerId}/cancel`,
    {
      penaltyAmount,
    },
  );
};

const createQuickBookingApi = async (
  newQuickBooking: QuickBookingInput,
): Promise<QuickBookingOutput> => {
  const { tourId, ...rest } = newQuickBooking;
  return await apiClient.post<never, QuickBookingOutput>(`/bookings/${tourId}/quick-booking`, rest);
};

// ============================================================================
// 4. HOOKS DE MUTACIONES
// ============================================================================

export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBookingApi,
    onSuccess: (data, variables) => {
      toast.success("Registro creado exitosamente");
      console.log("data", data);
      console.log("variables", variables);
      // queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.all });
      // if (variables?.tourId) {
      //     queryClient.invalidateQueries({ queryKey: ["tour-dashboard", variables.tourId] });
      // }
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.all });
    },
    onError: (error: ApiError) => {
      toast.error("Error al crear la reserva", {
        description: error.message || "No se pudo guardar la información",
      });
    },
  });
};

export const useCancelPassenger = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelPassengerApi,
    onSuccess: () => {
      toast.success("Viajero cancelado exitosamente");
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["tour-dashboard"] });
    },
    onError: (error: ApiError) => {
      toast.error("Error al cancelar el pasajero", {
        description: error.message || "No se pudo cancelar el pasajero",
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
