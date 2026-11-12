import { z } from "zod";

/**
 * Formulario "Iniciar Reserva" del folleto. Replica las reglas de
 * `publicPreBookingBodySchema` de la API; el tope de lugares es solo una ayuda de UX
 * (la API valida el cupo real de forma atómica y responde 409 si ya no alcanza).
 */
export const createPreBookingFormSchema = (availableSeats: number) =>
  z.object({
    fullName: z.string().trim().min(3, "Escribe tu nombre (mínimo 3 caracteres)").max(150),
    whatsapp: z
      .string()
      .trim()
      .regex(/^\d{10}$/, "Ingresa tu WhatsApp a 10 dígitos"),
    numberPassengers: z
      .number({ error: "Indica cuántos lugares necesitas" })
      .int("Indica un número entero de lugares")
      .min(1, "Aparta al menos 1 lugar")
      .max(
        Math.max(1, availableSeats),
        availableSeats === 1 ? "Solo queda 1 lugar" : `Solo quedan ${availableSeats} lugares`,
      ),
  });

export type PreBookingFormInput = z.infer<ReturnType<typeof createPreBookingFormSchema>>;

export type PreBookingInput = PreBookingFormInput & { tourId: string };

export interface PreBookingOutput {
  success: boolean;
  message: string;
}
