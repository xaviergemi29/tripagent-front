import { z } from "zod";

export const manifestPassengerSchema = z.object({
  id: z.uuid(),
  bookingId: z.uuid(),
  fullName: z.string(),
  isTitular: z.boolean(),
  seatLabel: z.string().nullable().optional(),

  boardingPoint: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val || "Por asignar"),

  medicalNotes: z.string().default(""),
  emergencyContact: z
    .object({
      name: z.string(),
      phone: z.string(),
    })
    .nullable(),
  balance: z.number().nonnegative(),
  groupSize: z.number().int().positive(),
});

export const manifestBoardingPointSchema = z.object({
  id: z.string(),
  location: z.string(),
  time: z.string(),
  passengers: z.array(manifestPassengerSchema),
});

export const tourManifestOutputSchema = z.object({
  tourId: z.string().uuid(),
  tourTitle: z.string(),
  departureDateTime: z.string(),
  boardingPoints: z.array(manifestBoardingPointSchema),
});

export type ManifestPassenger = z.infer<typeof manifestPassengerSchema>;
export type ManifestBoardingPoint = z.infer<typeof manifestBoardingPointSchema>;
export type TourManifestOutput = z.infer<typeof tourManifestOutputSchema>;
