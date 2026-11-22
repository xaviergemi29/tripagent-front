import { z } from "zod";
import {
  BIRTH_DATE_REQUIRED_ERROR,
  FUTURE_BIRTH_DATE_ERROR,
  getTodayInMexico,
} from "@/shared/utils/tour-date.util";
import { PASSENGER_TYPE, PASSENGER_TYPES } from "@/shared/constants/domain.constants";
import { phoneCountrySchema, refinePhone } from "@/shared/schemas/phone.schema";
import { toE164, type PhoneCountry } from "@/shared/utils/phone.util";

/** `true` si ambos números (nacional + país) son el mismo teléfono completo. */
const isSameFullPhone = (
  a: string | undefined,
  aCountry: PhoneCountry,
  b: string | undefined,
  bCountry: PhoneCountry,
): boolean => {
  const left = toE164(a, aCountry);
  return left !== null && left === toE164(b, bCountry);
};

// Teléfonos internacionales (2026-11-16): cada número se captura como número nacional + país
// (PhoneField), se valida con `refinePhone` y se envía en E.164 con `toPublicRegisterInput`.
const basePassengerSchema = z.object({
  fullName: z.string().min(3, "El nombre completo es obligatorio").trim(),
  emergencyContactName: z.string().min(3, "Nombre de emergencia requerido").trim(),
  emergencyContactPhone: z.string().trim(),
  emergencyContactCountry: phoneCountrySchema,
  boardingPoint: z.string().min(1, "Debes seleccionar en qué punto subirás al autobús"),
  // Obligatoria (seguro carretero, igual que "Editar viajero") y no futura; hasta el 2026-11-17 se
  // aceptaba vacía aunque el campo del acompañante dijera "*". Misma regla en la API.
  birthDate: z
    .string(BIRTH_DATE_REQUIRED_ERROR)
    .trim()
    .min(1, BIRTH_DATE_REQUIRED_ERROR)
    .pipe(
      z.iso
        .date("Formato YYYY-MM-DD")
        .refine((date) => date <= getTodayInMexico(), FUTURE_BIRTH_DATE_ERROR),
    ),
});

export const mainClientSchema = basePassengerSchema
  .extend({
    whatsappPhone: z.string().trim(),
    whatsappCountry: phoneCountrySchema,
    email: z.email("Correo electrónico inválido").trim(),
  })
  .superRefine((data, ctx) => {
    refinePhone(
      ctx,
      data.whatsappPhone,
      data.whatsappCountry,
      ["whatsappPhone"],
      "Ingresa tu WhatsApp",
    );
    refinePhone(
      ctx,
      data.emergencyContactPhone,
      data.emergencyContactCountry,
      ["emergencyContactPhone"],
      "Ingresa el teléfono de emergencia",
    );
    if (
      isSameFullPhone(
        data.whatsappPhone,
        data.whatsappCountry,
        data.emergencyContactPhone,
        data.emergencyContactCountry,
      )
    ) {
      ctx.addIssue({
        code: "custom",
        message: "El contacto de emergencia debe ser un número distinto al tuyo",
        path: ["emergencyContactPhone"],
      });
    }
  });

export const companionSchema = basePassengerSchema
  .extend({
    whatsappPhone: z.string().trim().optional(),
    whatsappCountry: phoneCountrySchema,
    email: z.email("Correo inválido").optional().or(z.literal("")),
    passengerType: z.enum(PASSENGER_TYPES),
  })
  .superRefine((data, ctx) => {
    const isAdult = data.passengerType === PASSENGER_TYPE.ADULT;
    // Adultos: WhatsApp obligatorio (igual que la API). Menores: opcional, pero válido si se escribe.
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
      "Ingresa el teléfono de emergencia",
    );
    if (isAdult && (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))) {
      ctx.addIssue({
        code: "custom",
        message: "Correo electrónico inválido o faltante",
        path: ["email"],
      });
    }
    if (
      isSameFullPhone(
        data.whatsappPhone,
        data.whatsappCountry,
        data.emergencyContactPhone,
        data.emergencyContactCountry,
      )
    ) {
      ctx.addIssue({
        code: "custom",
        message: isAdult
          ? "El contacto de emergencia debe ser distinto al WhatsApp del acompañante"
          : "El contacto de emergencia debe ser distinto al WhatsApp del menor",
        path: ["emergencyContactPhone"],
      });
    }
  });

export const bookingFormSchema = z.object({
  token: z.string().min(1, "Token de seguridad faltante"),
  mainClient: mainClientSchema,
  hasCompanions: z.boolean(),
  companions: z.array(companionSchema),
  // Casilla obligatoria combinada (LFPDPPP; PM, 2026-11-14 y 2026-11-22): declaración de mayoría de
  // edad y de autorización de los acompañantes (o patria potestad/tutela de los menores) + políticas
  // y aviso de privacidad. La API exige `true` y guarda la fecha de aceptación.
  privacyNoticeAccepted: z
    .boolean()
    .refine(
      (accepted) => accepted,
      "Para completar tu registro marca la casilla de declaración y aceptación del aviso de privacidad.",
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

/**
 * Formulario → cuerpo de `POST /bookings/public/register`: cada teléfono capturado (nacional + país)
 * se envía en E.164. Un WhatsApp opcional vacío se queda vacío.
 */
export function toPublicRegisterInput(form: BookingInput): BookingInput {
  const full = (value: string | undefined, country: PhoneCountry): string | undefined =>
    value?.trim() ? (toE164(value, country) ?? value) : value;
  return {
    ...form,
    mainClient: {
      ...form.mainClient,
      whatsappPhone: full(form.mainClient.whatsappPhone, form.mainClient.whatsappCountry) ?? "",
      emergencyContactPhone:
        full(form.mainClient.emergencyContactPhone, form.mainClient.emergencyContactCountry) ?? "",
    },
    companions: form.companions.map((companion) => ({
      ...companion,
      whatsappPhone: full(companion.whatsappPhone, companion.whatsappCountry),
      emergencyContactPhone:
        full(companion.emergencyContactPhone, companion.emergencyContactCountry) ?? "",
    })),
  };
}
export type BookingOutput = z.output<typeof bookingOutputSchema>;
