import { z } from "zod";

export const quickBookingSchema = z.object({
  fullName: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres"),
  whatsapp: z
    .string()
    .trim()
    .regex(/^(\+)?\d{10}$/, "Ingresa un número de WhatsApp válido"),
  email: z.email("Formato de correo electrónico inválido").trim(),
  numberPassengers: z
    .number({ error: "Debe ser un número" })
    .min(1, "Debe apartar al menos 1 lugar"),
});

export const quickBookingBodySchema = quickBookingSchema.extend({
  tourId: z.uuid().trim(),
});

export const quickBookingResultSchema = quickBookingSchema.extend({
  bookingId: z.uuid(),
  token: z.string(),
  availableSeats: z.number().positive(),
});

export type QuickBookingInput = z.input<typeof quickBookingBodySchema>;
export type QuickBookingFormValues = z.infer<typeof quickBookingSchema>;
export type QuickBookingOutput = z.infer<typeof quickBookingResultSchema>;
