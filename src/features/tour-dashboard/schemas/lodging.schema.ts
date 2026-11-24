import { z } from "zod";
import {
  LODGING_BED_LIMITS,
  LODGING_LIMITS,
  LODGING_ROOM_NUMBER_MAX,
  LODGING_SLOT_INDEX,
} from "@/shared/constants/domain.constants";
import {
  exceedsRegisterLimits,
  groupRoomsByBeds,
  isValidBeds,
} from "@/shared/utils/lodging-beds.util";

/**
 * Hospedaje del tour. Replica `POST /lodging/:tourId/rooms` de la API: nombre 1..120 recortado,
 * 1..20 configuraciones de camas `{ matrimonialBeds, singleBeds, quantity }` (cantidad 1..50) y
 * máximo 200 habitaciones por envío.
 */
const bedsFields = {
  matrimonialBeds: z.number().int().min(0).max(LODGING_BED_LIMITS.matrimonialMax),
  singleBeds: z.number().int().min(0).max(LODGING_BED_LIMITS.singleMax),
};

export const registerLodgingRoomsInputSchema = z.object({
  hotelName: z.string().trim().min(1).max(LODGING_LIMITS.hotelNameMax),
  rooms: z
    .array(
      z.object({
        ...bedsFields,
        quantity: z.number().int().min(1).max(LODGING_LIMITS.quantityMax),
      }),
    )
    .min(1)
    .max(LODGING_LIMITS.roomConfigsMax),
});
export type RegisterLodgingRoomsInput = z.infer<typeof registerLodgingRoomsInputSchema>;

/** Formulario del modal: una fila por habitación, con sus camas. */
export const registerLodgingRoomsFormSchema = z
  .object({
    hotelName: z
      .string()
      .trim()
      .min(1, "Escribe el nombre del hotel")
      .max(LODGING_LIMITS.hotelNameMax, "Máximo 120 caracteres"),
    rooms: z.array(z.object(bedsFields)).min(1).max(LODGING_LIMITS.totalRoomsMax),
  })
  .refine(({ rooms }) => rooms.every(isValidBeds) && !exceedsRegisterLimits(rooms), {
    path: ["rooms"],
    message: "Elige al menos una cama en cada habitación",
  });
export type RegisterLodgingRoomsFormInput = z.infer<typeof registerLodgingRoomsFormSchema>;

/** Del formulario al cuerpo de la API: habitaciones idénticas agrupadas y nombre recortado. */
export function toRegisterLodgingRoomsInput(
  form: RegisterLodgingRoomsFormInput,
): RegisterLodgingRoomsInput {
  return { hotelName: form.hotelName.trim(), rooms: groupRoomsByBeds(form.rooms) };
}

/** Cama ocupada: `slotIndex` (1..capacidad) y la fila de `booking_passengers` que la ocupa. */
export const lodgingSlotOutputSchema = z.object({
  slotIndex: z.number().int(),
  bookingPassengerId: z.string(),
});

export const lodgingRoomOutputSchema = z
  .object({
    id: z.string(),
    /** Heredado de la API: nunca se usa para mostrar (el nombre sale de las camas). */
    roomType: z.string().nullable().catch(null),
    matrimonialBeds: z.number().int().min(0).catch(0),
    singleBeds: z.number().int().min(0).catch(0),
    capacity: z.number(),
    position: z.number(),
    /** Número que da la recepción del hotel; `null` hasta que el operador lo captura. */
    roomNumber: z.string().nullable(),
    slots: z.array(lodgingSlotOutputSchema),
  })
  // Datos anteriores sin camas: se toman como individuales (1 lugar cada una).
  .transform((room) =>
    room.matrimonialBeds + room.singleBeds === 0 ? { ...room, singleBeds: room.capacity } : room,
  );

export const lodgingHotelOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  rooms: z.array(lodgingRoomOutputSchema),
});

/** Pasajero activo del tour (con o sin cama); la cama sale de `slots` de cada habitación. */
export const lodgingPassengerOutputSchema = z.object({
  bookingPassengerId: z.string(),
  bookingId: z.string(),
  fullName: z.string(),
  seatLabel: z.string().nullable(),
  isTitular: z.boolean(),
  groupLabel: z.string(),
});
export type LodgingSlotOutput = z.infer<typeof lodgingSlotOutputSchema>;
export type LodgingRoomOutput = z.infer<typeof lodgingRoomOutputSchema>;
export type LodgingHotelOutput = z.infer<typeof lodgingHotelOutputSchema>;
export type LodgingPassengerOutput = z.infer<typeof lodgingPassengerOutputSchema>;

/** `GET /lodging/:tourId`. */
export const lodgingOutputSchema = z.object({
  hotels: z.array(lodgingHotelOutputSchema),
  passengers: z.array(lodgingPassengerOutputSchema),
  totalRooms: z.number(),
  totalCapacity: z.number(),
});
export type LodgingOutput = z.infer<typeof lodgingOutputSchema>;

/** `POST /lodging/:tourId/rooms`. */
export const registerLodgingRoomsOutputSchema = z.object({
  hotel: lodgingHotelOutputSchema,
  createdRooms: z.number(),
  createdCapacity: z.number(),
});
export type RegisterLodgingRoomsOutput = z.infer<typeof registerLodgingRoomsOutputSchema>;

/** `PATCH /lodging/:tourId/rooms/:roomId`: número de cuarto (vacío → `null`) y/o estado. */
export const updateLodgingRoomInputSchema = z.object({
  roomNumber: z
    .string()
    .trim()
    .max(LODGING_ROOM_NUMBER_MAX)
    .transform((value) => value || null)
    .nullable()
    .optional(),
});
export type UpdateLodgingRoomInput = z.input<typeof updateLodgingRoomInputSchema>;

/** `POST /lodging/:tourId/rooms/:roomId/assignments`: 1..6 lugares por envío. */
export const assignLodgingRoomInputSchema = z.object({
  assignments: z
    .array(
      z.object({
        slotIndex: z.number().int().min(LODGING_SLOT_INDEX.first).max(LODGING_SLOT_INDEX.max),
        bookingPassengerId: z.string().min(1),
      }),
    )
    .min(1)
    .max(LODGING_SLOT_INDEX.max),
});
export type AssignLodgingRoomInput = z.infer<typeof assignLodgingRoomInputSchema>;

/** Respuesta de PATCH, assignments y DELETE de una cama: la habitación actualizada. */
export const lodgingRoomResultOutputSchema = z.object({ room: lodgingRoomOutputSchema });
export type LodgingRoomResultOutput = z.infer<typeof lodgingRoomResultOutputSchema>;

/** `DELETE /lodging/:tourId/rooms/:roomId`: las asignaciones se borran; el hotel se conserva. */
export const deleteLodgingRoomOutputSchema = z.object({
  deletedRoomId: z.string(),
  releasedPassengers: z.number().int(),
});
export type DeleteLodgingRoomOutput = z.infer<typeof deleteLodgingRoomOutputSchema>;

/** `DELETE …/beds/:slotIndex`: la habitación ya sin la cama completa y cuántos pasajeros quedaron sin cama. */
export const deleteLodgingBedOutputSchema = z.object({
  room: lodgingRoomOutputSchema,
  releasedPassenger: z.boolean().catch(false),
  releasedPassengers: z.number().int().catch(0),
});
export type DeleteLodgingBedOutput = z.infer<typeof deleteLodgingBedOutputSchema>;

/** Cama completa que el operador va a eliminar (estado del diálogo de confirmación). */
export interface TargetBedDeletion {
  roomId: string;
  /** "Doble · 2 individuales #1 · Hab. 102". */
  roomName: string;
  /** Lugar que se tocó; la API elimina la cama que lo contiene. */
  slotIndex: number;
  /** "cama matrimonial 1". */
  bedName: string;
  /** Lugares que desaparecen (2 en matrimonial, 1 en individual). */
  slotsCount: number;
  /** Pasajeros que quedan sin cama. */
  assignedPassengers: { id: string; fullName: string }[];
}

/** Habitación que el operador va a eliminar. */
export interface TargetRoomDeletion {
  roomId: string;
  roomName: string;
  totalBeds: number;
  assignedPassengersCount: number;
}
