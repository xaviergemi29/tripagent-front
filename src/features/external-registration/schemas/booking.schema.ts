import { z } from "zod";
import { PASSENGER_TYPE, PASSENGER_TYPES } from "@/shared/constants/domain.constants";

const mexicanPhoneRegex = /^(\+)?\d{10}$/;

const basePassengerSchema = z.object({
  fullName: z.string().min(3, "El nombre completo es obligatorio").trim(),
  emergencyContactName: z.string().min(3, "Nombre de emergencia requerido").trim(),
  emergencyContactPhone: z.string().regex(mexicanPhoneRegex, "Debe ser un número a 10 dígitos"),
  medicalNotes: z.string().trim().optional(),
  boardingPoint: z.string().min(1, "Debes seleccionar en qué punto subirás al autobús"),
  birthDate: z.union([z.iso.date("Formato YYYY-MM-DD"), z.literal("")]).optional(),
});

export const mainClientSchema = basePassengerSchema
  .extend({
    whatsappPhone: z.string().regex(mexicanPhoneRegex, "Debe ser un WhatsApp válido a 10 dígitos"),
    email: z.email("Correo electrónico inválido").trim(),
  })
  .superRefine((data, ctx) => {
    if (data.whatsappPhone === data.emergencyContactPhone) {
      ctx.addIssue({
        code: "custom",
        message: "El contacto de emergencia debe ser un número distinto al tuyo",
        path: ["emergencyContactPhone"],
      });
    }
  });

export const companionSchema = basePassengerSchema
  .extend({
    whatsappPhone: z
      .string()
      .regex(mexicanPhoneRegex, "WhatsApp inválido")
      .optional()
      .or(z.literal("")),
    email: z.email("Correo inválido").optional().or(z.literal("")),
    passengerType: z.enum(PASSENGER_TYPES),
  })
  .superRefine((data, ctx) => {
    if (data.passengerType === PASSENGER_TYPE.ADULT) {
      if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        ctx.addIssue({
          code: "custom",
          message: "Correo electrónico inválido o faltante",
          path: ["email"],
        });
      }
      if (data.whatsappPhone && data.whatsappPhone === data.emergencyContactPhone) {
        ctx.addIssue({
          code: "custom",
          message: "El contacto de emergencia debe ser distinto al WhatsApp del acompañante",
          path: ["emergencyContactPhone"],
        });
      }
    } else if (data.passengerType === PASSENGER_TYPE.CHILD) {
      if (data.whatsappPhone && data.whatsappPhone === data.emergencyContactPhone) {
        ctx.addIssue({
          code: "custom",
          message: "El contacto de emergencia debe ser distinto al WhatsApp del menor",
          path: ["emergencyContactPhone"],
        });
      }
    }
  });

export const bookingFormSchema = z.object({
  token: z.string().min(1, "Token de seguridad faltante"),
  mainClient: mainClientSchema,
  hasCompanions: z.boolean(),
  companionMethod: z.enum(["MANUAL", "SHARE_LINK"]),
  companions: z.array(companionSchema),
  // Casilla obligatoria "Acepto el aviso de privacidad" (decisión del PM, 2026-11-14; LFPDPPP:
  // el registro incluye notas médicas). La API exige `true` y guarda la fecha de aceptación.
  privacyNoticeAccepted: z
    .boolean()
    .refine(
      (accepted) => accepted,
      "Es necesario aceptar las políticas y el aviso de privacidad para completar tu registro.",
    ),
});

export const bookingOutputSchema = z.object({
  bookingId: z.string(),
  titularName: z.string().optional(),
  companionNames: z.array(z.string()).optional(),
  acceptsBankTransfer: z.boolean(),
  bankDetails: z.string().nullable(),
  bankName: z.string().optional(),
  clabeNumber: z.string().optional(),
  accountHolder: z.string().optional(),
  depositAmount: z.number().nullable().optional(),
  totalAmount: z.number().nonnegative().optional(),
  acceptsCreditCard: z.boolean(),
  paymentLink: z.string().nullable(),
  acceptsCash: z.boolean(),
  cashInstructions: z.string().nullable(),
  totalPassengersRegistered: z.number(),
  agencyPhone: z.string(),
  agencyName: z.string(),
  message: z.string(),
});

export type BookingInput = z.input<typeof bookingFormSchema>;
export type BookingOutput = z.output<typeof bookingOutputSchema>;
