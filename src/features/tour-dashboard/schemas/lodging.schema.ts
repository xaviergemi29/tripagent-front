import { z } from "zod";
import {
  LODGING_LIMITS,
  LODGING_ROOM_NUMBER_MAX,
  LODGING_ROOM_STATUSES,
  LODGING_ROOM_TYPES,
  LODGING_SLOT_INDEX,
} from "@/shared/constants/domain.constants";

/**
 * Hospedaje del tour. Replica `POST /lodging/:tourId/rooms` de la API: nombre 1..120 recortado,
 * 1..5 tipos sin repetir (cantidad entera 1..50) y máximo 200 habitaciones por envío.
 */
export const lodgingRoomTypeSchema = z.enum(LODGING_ROOM_TYPES);

export const registerLodgingRoomsInputSchema = z.object({
  hotelName: z.string().trim().min(1).max(LODGING_LIMITS.hotelNameMax),
  rooms: z
    .array(
      z.object({
        roomType: lodgingRoomTypeSchema,
        quantity: z.number().int().min(1).max(LODGING_LIMITS.quantityMax),
      }),
    )
    .min(1)
    .max(LODGING_ROOM_TYPES.length),
});
export type RegisterLodgingRoomsInput = z.infer<typeof registerLodgingRoomsInputSchema>;

/** Formulario del modal: una cantidad por tipo (0 = no se registra). */
export const registerLodgingRoomsFormSchema = z
  .object({
    hotelName: z
      .string()
      .trim()
      .min(1, "Escribe el nombre del hotel")
      .max(LODGING_LIMITS.hotelNameMax, "Máximo 120 caracteres"),
    quantities: z.object({
      MATRIMONIAL: z.number().int().min(0).max(LODGING_LIMITS.quantityMax),
      DOUBLE_INDIVIDUAL: z.number().int().min(0).max(LODGING_LIMITS.quantityMax),
      TRIPLE: z.number().int().min(0).max(LODGING_LIMITS.quantityMax),
      QUADRUPLE: z.number().int().min(0).max(LODGING_LIMITS.quantityMax),
      SINGLE: z.number().int().min(0).max(LODGING_LIMITS.quantityMax),
    }),
  })
  .refine(
    ({ quantities }) => {
      const total = Object.values(quantities).reduce((sum, value) => sum + value, 0);
      return total >= 1 && total <= LODGING_LIMITS.totalRoomsMax;
    },
    { path: ["quantities"], message: "Agrega entre 1 y 200 habitaciones" },
  );
export type RegisterLodgingRoomsFormInput = z.infer<typeof registerLodgingRoomsFormSchema>;

/** Del formulario al cuerpo de la API: solo los tipos con cantidad > 0 y el nombre recortado. */
export function toRegisterLodgingRoomsInput(
  form: RegisterLodgingRoomsFormInput,
): RegisterLodgingRoomsInput {
  return {
    hotelName: form.hotelName.trim(),
    rooms: LODGING_ROOM_TYPES.filter((roomType) => form.quantities[roomType] > 0).map(
      (roomType) => ({ roomType, quantity: form.quantities[roomType] }),
    ),
  };
}

export const lodgingRoomStatusSchema = z.enum(LODGING_ROOM_STATUSES);

/** Cama ocupada: `slotIndex` (1..capacidad) y la fila de `booking_passengers` que la ocupa. */
export const lodgingSlotOutputSchema = z.object({
  slotIndex: z.number().int(),
  bookingPassengerId: z.string(),
});

export const lodgingRoomOutputSchema = z.object({
  id: z.string(),
  roomType: lodgingRoomTypeSchema,
  capacity: z.number(),
  position: z.number(),
  /** Número que da la recepción del hotel; `null` hasta que el operador lo captura. */
  roomNumber: z.string().nullable(),
  status: lodgingRoomStatusSchema,
  slots: z.array(lodgingSlotOutputSchema),
});

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
  status: lodgingRoomStatusSchema.optional(),
});
export type UpdateLodgingRoomInput = z.input<typeof updateLodgingRoomInputSchema>;

/** `POST /lodging/:tourId/rooms/:roomId/assignments`: 1..4 camas por envío. */
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

/** `DELETE /lodging/:tourId/rooms/:roomId/beds/:slotIndex`: la habitación ya con una cama menos. */
export const deleteLodgingBedOutputSchema = z.object({
  room: lodgingRoomOutputSchema,
  releasedPassenger: z.boolean(),
});
export type DeleteLodgingBedOutput = z.infer<typeof deleteLodgingBedOutputSchema>;

/** Cama que el operador va a eliminar (estado del diálogo de confirmación). */
export interface TargetBedDeletion {
  roomId: string;
  /** "Doble Individual #1 · Hab. 102". */
  roomName: string;
  slotIndex: number;
  /** "Cama B". */
  bedLabel: string;
  assignedPassenger: { id: string; fullName: string } | null;
}

/** Habitación que el operador va a eliminar. */
export interface TargetRoomDeletion {
  roomId: string;
  roomName: string;
  totalBeds: number;
  assignedPassengersCount: number;
}
