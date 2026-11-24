import { z } from "zod";
import { phoneCountrySchema, refinePhone } from "@/shared/schemas/phone.schema";

export const ADULT_DECLARATION_LABEL =
  "Declaro ser mayor de 18 años y aceptar los términos como titular responsable de esta reserva";
export const ADULT_DECLARATION_ERROR =
  "Debes declarar que eres mayor de 18 años y titular responsable de la reserva";

/**
 * Formulario "Iniciar Reserva" del folleto. Replica las reglas de
 * `publicPreBookingBodySchema` de la API; el tope de lugares es solo una ayuda de UX
 * (la API valida el cupo real de forma atómica y responde 409 si ya no alcanza).
 */
export const createPreBookingFormSchema = (availableSeats: number) =>
  z
    .object({
      fullName: z.string().trim().min(3, "Escribe tu nombre (mínimo 3 caracteres)").max(150),
      // Número nacional + país (PhoneField); se envía en E.164 con `toE164`.
      whatsapp: z.string().trim(),
      whatsappCountry: phoneCountrySchema,
      numberPassengers: z
        .number({ error: "Indica cuántos lugares necesitas" })
        .int("Indica un número entero de lugares")
        .min(1, "Aparta al menos 1 lugar")
        .max(
          Math.max(1, availableSeats),
          availableSeats === 1 ? "Solo queda 1 lugar" : `Solo quedan ${availableSeats} lugares`,
        ),
      // Quien aparta declara ser el titular responsable y mayor de edad (feedback del PM,
      // 2026-11-23). La API exige `true` (400 sin ella).
      adultDeclarationAccepted: z.boolean().refine((accepted) => accepted, {
        error: ADULT_DECLARATION_ERROR,
      }),
    })
    .superRefine((data, ctx) =>
      refinePhone(ctx, data.whatsapp, data.whatsappCountry, ["whatsapp"], "Ingresa tu WhatsApp"),
    );

export type PreBookingFormInput = z.infer<ReturnType<typeof createPreBookingFormSchema>>;

/** Cuerpo de `POST /public/pre-booking`: `whatsapp` ya en E.164. */
export type PreBookingInput = PreBookingFormInput & { tourId: string };

export interface PreBookingOutput {
  success: boolean;
  message: string;
}
