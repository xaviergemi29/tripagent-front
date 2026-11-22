import { z } from "zod";
import { PASSENGER_TYPE, PASSENGER_TYPES } from "@/shared/constants/domain.constants";
import {
  layoutMapSchema,
  vehicleCapacityOutputSchema,
} from "@/features/vehicles/schemas/vehicle.schema";

/** Estatus del derecho a asiento que calcula la API (no son montos: solo "anticipo cubierto o no"). */
export const STAFF_SEAT_RIGHT_STATUSES = ["CONFIRMED", "PENDING_DEPOSIT"] as const;
export type StaffSeatRightStatus = (typeof STAFF_SEAT_RIGHT_STATUSES)[number];
export const STAFF_SEAT_RIGHT_STATUS = {
  CONFIRMED: "CONFIRMED",
  PENDING_DEPOSIT: "PENDING_DEPOSIT",
} as const satisfies Record<string, StaffSeatRightStatus>;

/**
 * Respuesta (ya sin el sobre `data`) de `GET /public/staff-share/:token`. Tolerante: un dato raro de
 * presentación no tumba la vista. Los campos que la API no promete (teléfonos, montos, correos)
 * quedan fuera del schema, así que Zod los descarta aunque llegaran.
 */
export const staffSharePointSchema = z.object({
  code: z.string(),
  location: z.string().catch(""),
  time: z.string().catch(""),
});

export const staffSharePassengerSchema = z.object({
  seatLabel: z.string().nullable().catch(null),
  fullName: z.string().catch("Pasajero"),
  passengerType: z.enum(PASSENGER_TYPES).catch(PASSENGER_TYPE.ADULT),
  isTitular: z.boolean().catch(false),
  boardingPointCode: z.string().nullable().catch(null),
  seatRightStatus: z.enum(STAFF_SEAT_RIGHT_STATUSES).catch(STAFF_SEAT_RIGHT_STATUS.PENDING_DEPOSIT),
});

export const staffShareOutputSchema = z.object({
  tour: z.object({
    title: z.string(),
    departureDate: z.string(),
    returnDate: z.string().nullable().catch(null),
    temporalStatus: z.string().catch(""),
  }),
  agency: z.object({
    name: z.string(),
    logoPath: z.string().nullable().catch(null),
  }),
  expiresAt: z.string().catch(""),
  // Un croquis ilegible se trata como "sin vehículo": la lista sigue funcionando.
  vehicle: z
    .object({
      name: z.string().catch(""),
      layoutMap: layoutMapSchema,
      capacity: vehicleCapacityOutputSchema.optional().catch(undefined),
    })
    .nullable()
    .catch(null),
  blockedSeats: z.array(z.string()).catch([]),
  boardingPoints: z.array(staffSharePointSchema).catch([]),
  passengers: z.array(staffSharePassengerSchema).catch([]),
});

export type StaffShareOutput = z.infer<typeof staffShareOutputSchema>;
export type StaffSharePointOutput = z.infer<typeof staffSharePointSchema>;
export type StaffSharePassengerOutput = z.infer<typeof staffSharePassengerSchema>;

/** Respuesta de `POST /tours/:id/staff-share` (crea o regenera). */
export type StaffShareGenerateOutput = { token: string; expiresAt: string };
