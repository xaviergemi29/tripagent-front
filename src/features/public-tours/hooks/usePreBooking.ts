import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient, type ApiError } from "@/lib/api-client";
import type { PreBookingInput, PreBookingOutput } from "../pre-booking.schema";

const createPreBookingApi = (body: PreBookingInput): Promise<PreBookingOutput> =>
  apiClient.post<never, PreBookingOutput>("/public/pre-booking", body);

/**
 * Pre-reserva pública desde el folleto. Al terminar refresca la página (Server Component)
 * para que la ocupación mostrada incluya los lugares recién apartados.
 * Los errores se muestran en el modal según su `code` (409 `CAPACITY_EXCEEDED`, `BOOKINGS_CLOSED`,
 * `ALREADY_BOOKED`) o su estado (404: el tour ya no está publicado).
 */
export function usePreBooking() {
  const router = useRouter();

  return useMutation<PreBookingOutput, ApiError, PreBookingInput>({
    mutationFn: createPreBookingApi,
    onSuccess: () => router.refresh(),
    onError: (error) => {
      // Otro cliente pudo haber tomado los últimos lugares o el tour cerró: el folleto de fondo
      // (contador, insignia y botón) se actualiza con la disponibilidad real.
      if (error.status === 409 || error.status === 404) router.refresh();
    },
  });
}
