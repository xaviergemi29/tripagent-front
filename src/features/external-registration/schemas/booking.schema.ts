import { z } from "zod";

const mexicanPhoneRegex = /^(\+)?\d{10}$/;

const basePassengerSchema = z.object({
  fullName: z.string().min(3, "El nombre completo es obligatorio").trim(),
  emergencyContactName: z.string().min(3, "Nombre de emergencia requerido").trim(),
  emergencyContactPhone: z.string().regex(mexicanPhoneRegex, "Debe ser un número a 10 dígitos"),
  medicalNotes: z.string().trim().optional(),
  boardingPoint: z.string().min(1, "Debes seleccionar en qué punto subirás al autobús"),
});

export const mainClientSchema = basePassengerSchema.extend({
  whatsappPhone: z.string().regex(mexicanPhoneRegex, "Debe ser un WhatsApp válido a 10 dígitos"),
  email: z.email("Correo electrónico inválido").trim(),
  birthDate: z.union([z.iso.date("Formato YYYY-MM-DD"), z.literal("")]).optional(),
});

export const companionSchema = basePassengerSchema.extend({
  whatsappPhone: z
    .string()
    .regex(mexicanPhoneRegex, "WhatsApp inválido")
    .optional()
    .or(z.literal("")),
  email: z.email("Correo inválido").optional().or(z.literal("")),
  passengerType: z.enum(["ADULT", "CHILD"]),
});

export const bookingFormSchema = z.object({
  token: z.string().min(1, "Token de seguridad faltante"),
  mainClient: mainClientSchema,
  hasCompanions: z.boolean(),
  companionMethod: z.enum(["MANUAL", "SHARE_LINK"]),
  groupId: z.string().uuid().optional(),
  companions: z.array(companionSchema),
});

export const bookingResultSchema = z.object({
  bookingId: z.string(),
  acceptsBankTransfer: z.boolean(),
  bankDetails: z.string().nullable(), // Formato en texto libre si existe
  // 🚀 Nuevos campos financieros explícitos para UX de un solo toque:
  bankName: z.string().optional(),
  clabeNumber: z.string().optional(),
  accountHolder: z.string().optional(),
  depositAmount: z.number().nonnegative().optional(), // Ej: 500
  totalAmount: z.number().nonnegative().optional(), // Ej: 1000
  acceptsCreditCard: z.boolean(),
  paymentLink: z.string().nullable(),
  acceptsCash: z.boolean(),
  cashInstructions: z.string().nullable(),
  totalPassengersRegistered: z.number(),
  agencyPhone: z.string(),
  agencyName: z.string(),
  message: z.string(),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;
export type BookingInput = z.input<typeof bookingFormSchema>;
export type BookingOutput = z.output<typeof bookingResultSchema>;
