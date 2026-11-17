import { z } from "zod";
import { phoneCountrySchema, refinePhone } from "@/shared/schemas/phone.schema";

const quickBookingFields = z.object({
  fullName: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres"),
  // Número nacional tal como se escribe + país (PhoneField). Se envía en E.164 (`toE164`).
  whatsapp: z.string().trim(),
  whatsappCountry: phoneCountrySchema,
  email: z.email("Formato de correo electrónico inválido").trim(),
  numberPassengers: z
    .number({ error: "Debe ser un número" })
    .min(1, "Debe apartar al menos 1 lugar"),
});

export const quickBookingSchema = quickBookingFields.superRefine((data, ctx) =>
  refinePhone(
    ctx,
    data.whatsapp,
    data.whatsappCountry,
    ["whatsapp"],
    "Ingresa un número de WhatsApp",
  ),
);

/** Cuerpo de `POST /bookings/:tourId/quick-booking`: `whatsapp` ya en E.164. */
export const quickBookingInputSchema = quickBookingFields.extend({
  tourId: z.uuid().trim(),
});

export const quickBookingOutputSchema = quickBookingFields.extend({
  bookingId: z.uuid(),
  token: z.string(),
  availableSeats: z.number().positive(),
});

export const cancelFullBookingInputSchema = z.object({
  bookingId: z.uuid(),
  penaltyAmount: z.number().positive("El monto no debe ser negativo"),
});

export type QuickBookingInput = z.input<typeof quickBookingInputSchema>;
export type QuickBookingFormInput = z.infer<typeof quickBookingSchema>;
export type QuickBookingOutput = z.infer<typeof quickBookingOutputSchema>;
export type CancelFullBookingInput = z.infer<typeof cancelFullBookingInputSchema>;
