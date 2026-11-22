import { z } from "zod";
import { CURRENCIES, DEFAULT_CURRENCY } from "@/shared/constants/domain.constants";

export const manifestPassengerSchema = z.object({
  id: z.string().min(1),
  bookingId: z.string().min(1),
  fullName: z.string(),
  isTitular: z.boolean(),
  seatLabel: z.string().nullable().optional().catch(null),

  boardingPoint: z
    .string()
    .nullable()
    .optional()
    .catch(null)
    .transform((val) => val || "Por asignar"),

  emergencyContact: z
    .object({
      name: z.string(),
      phone: z.string(),
    })
    .nullable()
    .catch(null),
  balance: z.coerce.number().nonnegative(),
  groupSize: z.number().int().positive().catch(1),
});

export const manifestBoardingPointSchema = z.object({
  id: z.string().catch("sin-id"),
  location: z.string().catch("Sin punto especificado"),
  time: z.string().catch("--:--"),
  passengers: z.array(manifestPassengerSchema),
});

export const tourManifestOutputSchema = z.object({
  tourId: z.string(),
  tourTitle: z.string(),
  departureDateTime: z.string(),
  currency: z.enum(CURRENCIES).catch(DEFAULT_CURRENCY),
  boardingPoints: z.array(manifestBoardingPointSchema),
});

export type ManifestPassenger = z.infer<typeof manifestPassengerSchema>;
export type ManifestBoardingPoint = z.infer<typeof manifestBoardingPointSchema>;
export type TourManifestOutput = z.infer<typeof tourManifestOutputSchema>;

export const MANIFEST_FORMAT_ERROR =
  "El manifiesto llegó con un formato inesperado. Recarga la página o contacta a soporte.";
