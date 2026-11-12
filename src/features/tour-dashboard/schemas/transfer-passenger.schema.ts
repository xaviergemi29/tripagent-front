import { z } from "zod";
import { PASSENGER_ROLE } from "@/shared/constants/domain.constants";
import { passengerRoleSchema } from "./tour-dashboard.schema";

const PHONE_REGEX = /^\d{10}$/;

/**
 * Formulario de "Transferir lugar" (titular o acompañante).
 * Replica `transferPassengerBodySchema` de la API:
 * - Adulto: WhatsApp (10 dígitos) y correo obligatorios.
 * - Menor: WhatsApp opcional y sin correo. El titular nunca puede ser menor.
 */
export const transferPassengerSchema = z
  .object({
    role: passengerRoleSchema,
    isMinor: z.boolean(),
    fullName: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres").max(255),
    whatsapp: z.string().trim(),
    email: z.string().trim(),
    inheritTitularBoardingPoint: z.boolean(),
    medicalNotes: z.string().trim(),
    emergencyContactName: z.string().trim(),
    emergencyContactPhone: z.string().trim(),
  })
  .superRefine((data, ctx) => {
    if (data.role === PASSENGER_ROLE.TITULAR && data.isMinor) {
      ctx.addIssue({
        code: "custom",
        path: ["isMinor"],
        message: "El titular debe ser un adulto (es el responsable financiero)",
      });
    }
    if (data.whatsapp && !PHONE_REGEX.test(data.whatsapp)) {
      ctx.addIssue({ code: "custom", path: ["whatsapp"], message: "Deben ser 10 dígitos" });
    }
    if (!data.isMinor) {
      if (!data.whatsapp) {
        ctx.addIssue({
          code: "custom",
          path: ["whatsapp"],
          message: "El WhatsApp es obligatorio para adultos",
        });
      }
      if (!z.email().safeParse(data.email).success) {
        ctx.addIssue({
          code: "custom",
          path: ["email"],
          message: "El correo electrónico es obligatorio para adultos",
        });
      }
    }
    if (data.emergencyContactPhone && !PHONE_REGEX.test(data.emergencyContactPhone)) {
      ctx.addIssue({
        code: "custom",
        path: ["emergencyContactPhone"],
        message: "Deben ser 10 dígitos",
      });
    }
  });

/** Cuerpo de `PATCH /bookings/:bookingId/transfer` (los campos vacíos no se envían). */
export const transferPassengerInputSchema = z.object({
  passengerId: z.uuid(),
  role: passengerRoleSchema,
  fullName: z.string(),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  isMinor: z.boolean(),
  inheritTitularBoardingPoint: z.boolean(),
  medicalNotes: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

/** Respuesta (ya desenvuelta por el interceptor): la reserva actualizada. */
export const transferPassengerOutputSchema = z.object({
  id: z.uuid(),
  tourId: z.uuid(),
  travelerId: z.uuid(),
  status: z.string(),
  paymentStatus: z.string(),
  totalPrice: z.number(),
  amountPaid: z.number(),
  updatedAt: z.string(),
  magicToken: z.string().nullable(),
  tokenRegenerated: z.boolean(),
  transferredPassenger: z.object({
    previousTravelerId: z.uuid(),
    newTravelerId: z.uuid(),
    role: passengerRoleSchema,
  }),
});

export type TransferPassengerFormInput = z.infer<typeof transferPassengerSchema>;
export type TransferPassengerInput = z.infer<typeof transferPassengerInputSchema>;
export type TransferPassengerOutput = z.infer<typeof transferPassengerOutputSchema>;
