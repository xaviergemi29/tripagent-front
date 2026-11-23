import type {
  LodgingHotelOutput,
  LodgingOutput,
  LodgingPassengerOutput,
  LodgingRoomOutput,
} from "../../schemas/lodging.schema";

export const makePassenger = (
  id: string,
  fullName: string,
  overrides: Partial<LodgingPassengerOutput> = {},
): LodgingPassengerOutput => ({
  bookingPassengerId: id,
  bookingId: `b-${id}`,
  fullName,
  seatLabel: null,
  isTitular: false,
  groupLabel: fullName,
  ...overrides,
});

export const makeRoom = (
  id: string,
  overrides: Partial<LodgingRoomOutput> = {},
): LodgingRoomOutput => ({
  id,
  roomType: "MATRIMONIAL",
  capacity: 2,
  position: 1,
  roomNumber: null,
  status: "CONSULTED",
  slots: [],
  ...overrides,
});

export const makeHotel = (
  rooms: LodgingRoomOutput[],
  overrides: Partial<LodgingHotelOutput> = {},
): LodgingHotelOutput => ({
  id: "h1",
  name: "Hotel Sierra",
  createdAt: "2026-11-22T10:00:00Z",
  rooms,
  ...overrides,
});

/** Familia Pérez (2 pasajeros, una reserva) y Marta sola; sin camas asignadas. */
export const PASSENGERS: LodgingPassengerOutput[] = [
  makePassenger("p1", "Ana Pérez", {
    bookingId: "b1",
    groupLabel: "Familia Pérez",
    isTitular: true,
    seatLabel: "4A",
  }),
  makePassenger("p2", "Luis Pérez", { bookingId: "b1", groupLabel: "Familia Pérez" }),
  makePassenger("p3", "Marta Ruiz", { bookingId: "b2", groupLabel: "Marta Ruiz" }),
];

export const ROOMS: LodgingRoomOutput[] = [
  makeRoom("r1", { position: 1 }),
  makeRoom("r2", { roomType: "DOUBLE_INDIVIDUAL", position: 2, roomNumber: "102" }),
  makeRoom("r3", { roomType: "DOUBLE_INDIVIDUAL", position: 3, status: "CONFIRMED" }),
];

export const makeLodging = (
  rooms: LodgingRoomOutput[] = ROOMS,
  passengers: LodgingPassengerOutput[] = PASSENGERS,
): LodgingOutput => ({
  hotels: [makeHotel(rooms)],
  passengers,
  totalRooms: rooms.length,
  totalCapacity: rooms.reduce((sum, room) => sum + room.capacity, 0),
});
