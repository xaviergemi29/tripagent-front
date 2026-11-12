import { z } from "zod";

export const travelerSchema = z.object({
  id: z.uuid().optional(),
  fullName: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres"),
  whatsappPhone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Debe ser un teléfono a 10 dígitos")
    .optional(),
  email: z.email("Correo electrónico inválido").trim(),
  emergencyContactName: z.string().trim().min(3, "Nombre de emergencia requerido"),
  emergencyContactPhone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Teléfono de emergencia a 10 dígitos"),

  medicalNotes: z.string().trim().optional(),
  customFields: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.iso.datetime().optional(),
  birthDate: z.union([z.iso.date("Formato YYYY-MM-DD"), z.literal("")]),
  tripCount: z.number().optional(),
  nextTourName: z.string().nullable().optional(),
  nextTourDate: z.string().nullable().optional(),
  hasNationalTrips: z.boolean().optional(),
  hasInternationalTrips: z.boolean().optional(),
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
  destinationType: z.enum(["NATIONAL", "INTERNATIONAL"]).optional(),
});

export const travelerHistoryOutputSchema = z.object({
  history: z.array(travelerHistoryItemSchema),
  metrics: travelerMetricsSchema.optional(),
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

export const editTravelerSchema = z
  .object({
    passengerType: z.enum(["ADULT", "CHILD"]),
    fullName: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    birthDate: z.string().min(1, "La fecha de nacimiento es obligatoria para el seguro carretero"),
    whatsappPhone: z.string().optional(),
    email: z.string().optional(),
    emergencyContactName: z.string().min(3, "El nombre de contacto de emergencia es obligatorio"),
    emergencyContactPhone: z
      .string()
      .regex(/^\d{10}$/, "El teléfono de emergencia debe contener 10 dígitos numéricos"),
    medicalNotes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.passengerType === "ADULT") {
      if (!data.whatsappPhone || !/^\d{10}$/.test(data.whatsappPhone.trim())) {
        ctx.addIssue({
          code: "custom",
          path: ["whatsappPhone"],
          message: "El WhatsApp es obligatorio y debe tener 10 dígitos para adultos",
        });
      }
      if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
        ctx.addIssue({
          code: "custom",
          path: ["email"],
          message: "El correo electrónico es obligatorio y debe ser válido",
        });
      }
    } else {
      if (
        data.whatsappPhone &&
        data.whatsappPhone.trim() !== "" &&
        !/^\d{10}$/.test(data.whatsappPhone.trim())
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["whatsappPhone"],
          message: "Si ingresas teléfono para el menor, debe contener 10 dígitos",
        });
      }
    }
  });

export type EditTravelerFormInput = z.infer<typeof editTravelerSchema>;
export type TravelerHistoryOutput = z.infer<typeof travelerHistoryOutputSchema>;
export type TravelerInput = z.input<typeof travelerSchema>;
export type TravelerOutput = z.output<typeof travelerSchema>;
