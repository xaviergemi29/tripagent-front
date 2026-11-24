import { z } from "zod";
import { PASSENGER_TYPE, PASSENGER_TYPES } from "@/shared/constants/domain.constants";

/**
 * Pase de lista de abordaje (RB-MAN-002). Dos fuentes con la misma forma: el Centro de Control
 * (`GET /tours/:tourId/boarding`, cada pasajero con su `travelerId`) y el enlace de staff
 * (`GET /public/staff-share/:token/boarding`, con una `boardingKey` opaca, sin ids internos).
 * Tolerante: un dato raro de presentación no tumba la lista.
 */
export const boardingRoomSchema = z.object({
  hotelName: z.string().catch(""),
  roomNumber: z.string().nullable().catch(null),
  /** Heredado de la API: no se usa para mostrar (el nombre sale de las camas). */
  roomType: z.string().nullable().catch(null),
  matrimonialBeds: z.number().int().min(0).catch(0),
  singleBeds: z.number().int().min(0).catch(0),
  /** Posición entre las habitaciones del hotel con las mismas camas. */
  typeIndex: z.number().catch(1),
});

export const boardingPointSchema = z.object({
  code: z.string(),
  location: z.string().catch(""),
  time: z.string().catch(""),
});

const boardingPassengerBaseSchema = z.object({
  fullName: z.string().catch("Pasajero"),
  holderName: z.string().catch(""),
  isTitular: z.boolean().catch(false),
  passengerType: z.enum(PASSENGER_TYPES).catch(PASSENGER_TYPE.ADULT),
  seatLabel: z.string().nullable().catch(null),
  boardingPointCode: z.string().nullable().catch(null),
  rooms: z.array(boardingRoomSchema).catch([]),
  /** ISO; `null` = aún no aborda. */
  boardedAt: z.string().nullable().catch(null),
  /** Niño o menor de 18 (lo calcula la API). */
  isMinor: z.boolean().catch(false),
});

export const tourBoardingPassengerSchema = boardingPassengerBaseSchema.extend({
  travelerId: z.string(),
});

export const staffBoardingPassengerSchema = boardingPassengerBaseSchema.extend({
  boardingKey: z.string(),
});

const boardingListBase = {
  /** Lo decide la API: tour PRÓXIMO o EN CURSO (y, en el enlace, agencia fuera de Solo Lectura). */
  canMarkBoarding: z.boolean().catch(false),
  /** Algún pasajero es menor: aviso del Art. 58, fr. X Ter, LGT. */
  hasMinors: z.boolean().catch(false),
  temporalStatus: z.string().catch(""),
  boardingPoints: z.array(boardingPointSchema).catch([]),
};

export const tourBoardingOutputSchema = z.object({
  ...boardingListBase,
  passengers: z.array(tourBoardingPassengerSchema).catch([]),
});

export const staffBoardingOutputSchema = z.object({
  ...boardingListBase,
  passengers: z.array(staffBoardingPassengerSchema).catch([]),
});

export const setBoardingInputSchema = z.object({ boarded: z.boolean() });

export type BoardingRoomOutput = z.infer<typeof boardingRoomSchema>;
export type BoardingPointOutput = z.infer<typeof boardingPointSchema>;
export type TourBoardingOutput = z.infer<typeof tourBoardingOutputSchema>;
export type StaffBoardingOutput = z.infer<typeof staffBoardingOutputSchema>;
export type SetBoardingInput = z.infer<typeof setBoardingInputSchema>;

/** Renglón común de la lista: `id` es el `travelerId` (panel) o la `boardingKey` (enlace). */
export interface BoardingListItem extends z.infer<typeof boardingPassengerBaseSchema> {
  id: string;
}
