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

/**
 * Habitación de prueba. Sin camas indicadas es 1 matrimonial; con camas, la capacidad sale de
 * ellas (2 por matrimonial + 1 por individual) salvo que se indique.
 */
export const makeRoom = (
  id: string,
  overrides: Partial<LodgingRoomOutput> = {},
): LodgingRoomOutput => {
  const hasBeds = overrides.matrimonialBeds !== undefined || overrides.singleBeds !== undefined;
  const matrimonialBeds = overrides.matrimonialBeds ?? (hasBeds ? 0 : 1);
  const singleBeds = overrides.singleBeds ?? 0;
  return {
    id,
    roomType: null,
    matrimonialBeds,
    singleBeds,
    capacity: matrimonialBeds * 2 + singleBeds,
    position: 1,
    roomNumber: null,
    slots: [],
    ...overrides,
  };
};

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
  makeRoom("r2", { singleBeds: 2, position: 2, roomNumber: "102" }),
  makeRoom("r3", { singleBeds: 2, position: 3 }),
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
