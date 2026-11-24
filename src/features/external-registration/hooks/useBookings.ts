import { apiClient, ApiError } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookingInput, BookingOutput } from "../schemas/booking.schema";
import { BOOKING_KEYS } from "@/shared/api/query-keys";

/** Código con el que Fastify responde una validación de Zod fallida (400). */
const VALIDATION_ERROR_CODE = "FST_ERR_VALIDATION";

// ============================================================================
// 1. CAPA DE RED (Axios API Client)
// ============================================================================
const createBookingApi = async (bookingData: BookingInput): Promise<BookingOutput> => {
  return apiClient.post<never, BookingOutput>(`/bookings/public/register`, bookingData);
};

/**
 * Mensaje para el viajero. Un 400 de validación de la API trae los errores de Zod en inglés y con
 * rutas internas (`body/mainClient/…`), que no sirven en pantalla: se sustituye por un aviso claro.
 */
export const describeRegisterError = (error: ApiError): string => {
  if (error.code === VALIDATION_ERROR_CODE) {
    return "Algún dato no cumple el formato esperado. Revisa tu información y la de tus acompañantes e inténtalo de nuevo.";
  }
  return error.message || "No se pudo guardar la información";
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
      toast.error("Error al crear la reserva", { description: describeRegisterError(error) });
    },
  });
};
