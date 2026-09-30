import { z } from "zod";

export const travelerSchema = z.object({
  id: z.uuid().optional(),
  fullName: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres"),
  whatsappPhone: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{1,14}$/, "Debe ser un teléfono de WhatsApp válido (E.164)"),
  email: z.email("Correo electrónico inválido").trim(),
  emergencyContactName: z.string().trim().min(3, "Nombre de emergencia requerido"),
  emergencyContactPhone: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{1,14}$/, "Teléfono de emergencia inválido (E.164)"),

  medicalNotes: z.string().trim().optional(),
  customFields: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.iso.datetime().optional(),
  birthDate: z.union([z.iso.date("Formato YYYY-MM-DD"), z.literal("")]),
});

export const travelerMetricsSchema = z.object({
  totalTrips: z.number(),
  lifetimeValue: z.number(),
  isHabitualCompanion: z.boolean(),
});

export const travelerHistoryItemSchema = z.object({
  metrics: travelerMetricsSchema,
  isCancelled: z.boolean(),
  id: z.uuid(""),
  isTitular: z.boolean(),
  passengerStatus: z.enum(["CANCELLED", "ACTIVE"]),
  bookingStatus: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "NO_SHOW"]),
  amountPaid: z.number(),
  tourTitle: z.string(),
  departureDateTime: z.string(),
});

export const travelerHistorySchema = z.object({
  history: z.array(travelerHistoryItemSchema),
  id: z.string(),
  email: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string(),
  agencyId: z.string(),
  fullName: z.string(),
  whatsappPhone: z.string(),
  emergencyContactName: z.string(),
  emergencyContactPhone: z.string(),
  medicalNotes: z.string(),
  birthDate: z.string(),
  customFields: z.record(z.string(), z.unknown()).nullable(),
});

export type TravelerHistoryOutput = z.infer<typeof travelerHistorySchema>;
export type TravelerInput = z.input<typeof travelerSchema>;
export type TravelerOutput = z.output<typeof travelerSchema>;
