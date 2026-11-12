import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient, type ApiError } from "@/lib/api-client";
import type { PreBookingInput, PreBookingOutput } from "../pre-booking.schema";

const createPreBookingApi = (body: PreBookingInput): Promise<PreBookingOutput> =>
  apiClient.post<never, PreBookingOutput>("/public/pre-booking", body);

/**
 * Pre-reserva pública desde el folleto. Al terminar refresca la página (Server Component)
 * para que la ocupación mostrada incluya los lugares recién apartados.
 * Los errores (409 sin cupo, WhatsApp repetido, tour ya salido) se muestran en el modal.
 */
export function usePreBooking() {
  const router = useRouter();

  return useMutation<PreBookingOutput, ApiError, PreBookingInput>({
    mutationFn: createPreBookingApi,
    onSuccess: () => router.refresh(),
    onError: (error) => {
      // Otro cliente pudo haber tomado los últimos lugares: actualizamos la disponibilidad.
      if (error.status === 409) router.refresh();
    },
  });
}
