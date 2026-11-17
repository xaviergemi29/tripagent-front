import { z } from "zod";
import {
  BOOKING_STATUSES,
  CURRENCIES,
  DESTINATION_TYPES,
  PASSENGER_STATUSES,
  TOUR_TEMPORAL_STATUSES,
  PASSENGER_TYPE,
  PASSENGER_TYPES,
} from "@/shared/constants/domain.constants";
import { phoneCountrySchema, refinePhone } from "@/shared/schemas/phone.schema";

/** Teléfono guardado: E.164 ("+522281234567") o los 10 dígitos de un registro anterior. */
const storedPhoneSchema = z
  .string()
  .trim()
  .regex(/^\+?\d{8,15}$/, "Teléfono inválido");

export const travelerSchema = z.object({
  id: z.uuid().optional(),
  fullName: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres"),
  whatsappPhone: storedPhoneSchema.optional(),
  /** País del WhatsApp (ISO alfa-2); `null` = lada inferida, sin confirmar. */
  whatsappCountry: z.string().nullable().optional(),
  email: z.email("Correo electrónico inválido").trim(),
  emergencyContactName: z.string().trim().min(3, "Nombre de emergencia requerido"),
  emergencyContactPhone: storedPhoneSchema,
  emergencyContactCountry: z.string().nullable().optional(),

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
  lifetimeValueByCurrency: z.partialRecord(z.enum(CURRENCIES), z.number()).optional(),
  isHabitualCompanion: z.boolean(),
});

export const travelerHistoryItemSchema = z.object({
  metrics: travelerMetricsSchema,
  isCancelled: z.boolean(),
  id: z.uuid(""),
  isTitular: z.boolean(),
  passengerStatus: z.enum(PASSENGER_STATUSES),
  bookingStatus: z.enum(BOOKING_STATUSES),
  amountPaid: z.number(),
  currency: z.enum(CURRENCIES).optional(),
  tourTitle: z.string(),
  departureDateTime: z.string(),
  returnDate: z.string().nullable().optional(),
  temporalStatus: z.enum(TOUR_TEMPORAL_STATUSES),
  destinationType: z.enum(DESTINATION_TYPES).optional(),
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
    passengerType: z.enum(PASSENGER_TYPES),
    fullName: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    birthDate: z.string().min(1, "La fecha de nacimiento es obligatoria para el seguro carretero"),
    // Número nacional + país (PhoneField); se envían en E.164 con `toE164`.
    whatsappPhone: z.string().optional(),
    whatsappCountry: phoneCountrySchema,
    email: z.string().optional(),
    emergencyContactName: z.string().min(3, "El nombre de contacto de emergencia es obligatorio"),
    emergencyContactPhone: z.string(),
    emergencyContactCountry: phoneCountrySchema,
    medicalNotes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const isAdult = data.passengerType === PASSENGER_TYPE.ADULT;
    refinePhone(
      ctx,
      data.whatsappPhone,
      data.whatsappCountry,
      ["whatsappPhone"],
      isAdult ? "El WhatsApp es obligatorio para adultos" : undefined,
    );
    refinePhone(
      ctx,
      data.emergencyContactPhone,
      data.emergencyContactCountry,
      ["emergencyContactPhone"],
      "El teléfono de emergencia es obligatorio",
    );
    if (isAdult && (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "El correo electrónico es obligatorio y debe ser válido",
      });
    }
  });

export type EditTravelerFormInput = z.infer<typeof editTravelerSchema>;
export type TravelerHistoryOutput = z.infer<typeof travelerHistoryOutputSchema>;
export type TravelerInput = z.input<typeof travelerSchema>;
export type TravelerOutput = z.output<typeof travelerSchema>;
