import type { TitularRowOutput } from "@/features/tour-dashboard/schemas/tour-dashboard.schema";
import {
  LODGING_ROOM_CAPACITY,
  LODGING_ROOM_TYPE,
  LODGING_ROOM_TYPE_BY_CAPACITY,
  LODGING_SLOT_INDEX,
  type LodgingRoomType,
} from "@/shared/constants/domain.constants";
import {
  LODGING_ROOM_STATUS_DICT,
  LODGING_ROOM_TYPE_DICT,
} from "@/shared/utils/config/status-dictionaries.config";
import { matchesSearch } from "@/shared/utils/search.util";
import { formatForDateInput, formatLocalDate, parseDateOnly } from "@/shared/utils/tour-date.util";
import type {
  LodgingHotelOutput,
  LodgingOutput,
  LodgingPassengerOutput,
  LodgingRoomOutput,
  TargetBedDeletion,
  TargetRoomDeletion,
} from "../schemas/lodging.schema";

/**
 * Hospedaje en el Centro de Control. La pestaña se decide por la duración del tour; la asignación
 * de camas viene de la API (`GET /lodging/:tourId`) y aquí solo se derivan vistas de esos datos.
 */

/**
 * ¿El tour incluye al menos una noche? Sí cuando el regreso existe y es posterior a la salida
 * (las salidas de un día no pernoctan). Compara fechas sin hora, nunca `new Date("YYYY-MM-DD")`.
 */
export function tourHasLodgingNights(
  departureDateTime: string,
  returnDate: string | null | undefined,
): boolean {
  if (!returnDate) return false;
  const departure = formatForDateInput(departureDateTime);
  if (!departure) return false;
  const departureTime = parseDateOnly(departure).getTime();
  const returnTime = parseDateOnly(returnDate.slice(0, 10)).getTime();
  return Number.isFinite(returnTime) && returnTime > departureTime;
}

/**
 * Pasajeros activos registrados del tour: titulares y acompañantes de las reservas vigentes que
 * trae el dashboard (las bajas y cancelaciones no vienen en `travelers`). Sin hoteles, ninguno
 * tiene cuarto, así que este total es también el de pasajeros sin habitación.
 */
export function countActiveRegisteredPassengers(travelers: TitularRowOutput[] | undefined): number {
  if (!travelers) return 0;
  return travelers
    .filter((titular) => titular.bookingStatus !== "CANCELLED")
    .reduce((total, titular) => total + 1 + (titular.companions?.length ?? 0), 0);
}

/**
 * Pasajeros sin cama que muestra la insignia de la pestaña. Sin hoteles, todos los pasajeros
 * activos (`activeCount`, del dashboard); con hoteles, los que no tienen cama en al menos uno.
 */
export function countLodgingPendingPassengers(
  lodging: Pick<LodgingOutput, "hotels" | "passengers"> | undefined,
  activeCount: number,
): number {
  if (!lodging || lodging.hotels.length === 0) return activeCount;
  return lodging.passengers.filter((passenger) =>
    lodging.hotels.some((hotel) => !getHotelAssignedIds(hotel).has(passenger.bookingPassengerId)),
  ).length;
}

/** Ids de `booking_passengers` con cama en el hotel. */
export function getHotelAssignedIds(hotel: LodgingHotelOutput): Set<string> {
  return new Set(hotel.rooms.flatMap((room) => room.slots.map((slot) => slot.bookingPassengerId)));
}

/** Pasajeros del tour sin cama en el hotel (cada hotel se asigna por separado). */
export function getUnassignedPassengers(
  hotel: LodgingHotelOutput,
  passengers: LodgingPassengerOutput[],
): LodgingPassengerOutput[] {
  const assigned = getHotelAssignedIds(hotel);
  return passengers.filter((passenger) => !assigned.has(passenger.bookingPassengerId));
}

/** Habitaciones del hotel ordenadas por `position`. */
export const sortRooms = (rooms: LodgingRoomOutput[]): LodgingRoomOutput[] =>
  [...rooms].sort((a, b) => a.position - b.position);

/** "Doble Individual #2": n = orden por `position` entre las habitaciones del mismo tipo. */
export function getRoomTitles(rooms: LodgingRoomOutput[]): Record<string, string> {
  const counters: Partial<Record<LodgingRoomType, number>> = {};
  const titles: Record<string, string> = {};
  for (const room of sortRooms(rooms)) {
    const next = (counters[room.roomType] ?? 0) + 1;
    counters[room.roomType] = next;
    titles[room.id] = `${LODGING_ROOM_TYPE_DICT[room.roomType].name} #${next}`;
  }
  return titles;
}

/** Etiqueta de la cama: A/B en Individual y Doble Individual; "Lugar N" en el resto. */
export function getBedLabel(roomType: LodgingRoomType, slotIndex: number): string {
  if (roomType === LODGING_ROOM_TYPE.DOUBLE_INDIVIDUAL || roomType === LODGING_ROOM_TYPE.SINGLE) {
    return `Cama ${String.fromCharCode(64 + slotIndex)}`;
  }
  return `Lugar ${slotIndex}`;
}

/** Lugares 1..capacidad de la habitación, con el `bookingPassengerId` que lo ocupa (o `null`). */
export function getRoomBeds(
  room: LodgingRoomOutput,
): { slotIndex: number; bookingPassengerId: string | null }[] {
  return Array.from({ length: room.capacity }, (_, index) => {
    const slotIndex = LODGING_SLOT_INDEX.first + index;
    const slot = room.slots.find((item) => item.slotIndex === slotIndex);
    return { slotIndex, bookingPassengerId: slot?.bookingPassengerId ?? null };
  });
}

export const getRoomOccupied = (room: LodgingRoomOutput): number => room.slots.length;
export const getRoomFreeBeds = (room: LodgingRoomOutput): number =>
  Math.max(0, room.capacity - room.slots.length);

export interface FreeBed {
  roomId: string;
  slotIndex: number;
  /** "Doble Individual #1 · Cama B". */
  label: string;
}

/** Camas libres del hotel, en el orden de las habitaciones. */
export function getFreeBeds(rooms: LodgingRoomOutput[]): FreeBed[] {
  const titles = getRoomTitles(rooms);
  return sortRooms(rooms).flatMap((room) =>
    getRoomBeds(room)
      .filter((bed) => bed.bookingPassengerId === null)
      .map((bed) => ({
        roomId: room.id,
        slotIndex: bed.slotIndex,
        label: `${titles[room.id]} · ${getBedLabel(room.roomType, bed.slotIndex)}`,
      })),
  );
}

/**
 * Descripción de la habitación: la de su tipo ("2 camas individuales · 2 pers."). La API mantiene
 * el tipo acorde a la capacidad; solo con datos anteriores que no coincidan se añade "N lugares".
 */
export function getRoomDescription(room: LodgingRoomOutput): string {
  const config = LODGING_ROOM_TYPE_DICT[room.roomType];
  if (room.capacity === LODGING_ROOM_CAPACITY[room.roomType]) return config.description;
  return `${config.description} (${room.capacity} ${room.capacity === 1 ? "lugar" : "lugares"})`;
}

/** "Doble Individual #1 · Hab. 102" (sin número de cuarto, solo el título). */
export const getRoomDisplayName = (title: string, roomNumber: string | null): string =>
  roomNumber ? `${title} · Hab. ${roomNumber}` : title;

export function buildBedDeletionTarget(
  room: LodgingRoomOutput,
  title: string,
  slotIndex: number,
  passengers: LodgingPassengerOutput[],
): TargetBedDeletion {
  const slot = room.slots.find((item) => item.slotIndex === slotIndex);
  const passenger = slot
    ? passengers.find((item) => item.bookingPassengerId === slot.bookingPassengerId)
    : undefined;
  return {
    roomId: room.id,
    roomName: getRoomDisplayName(title, room.roomNumber),
    slotIndex,
    bedLabel: getBedLabel(room.roomType, slotIndex),
    // Una cama ocupada por un pasajero que ya no viene en la lista conserva un nombre genérico.
    assignedPassenger: slot
      ? {
          id: slot.bookingPassengerId,
          fullName: passenger?.fullName ?? "Pasajero",
        }
      : null,
  };
}

export const buildRoomDeletionTarget = (
  room: LodgingRoomOutput,
  title: string,
): TargetRoomDeletion => ({
  roomId: room.id,
  roomName: getRoomDisplayName(title, room.roomNumber),
  totalBeds: room.capacity,
  assignedPassengersCount: room.slots.length,
});

/**
 * Tipo de la habitación tras quedar con `capacity` lugares (espejo de la API): si coincide con la
 * capacidad del tipo actual lo conserva; si no, el que corresponde (1 Individual … 4 Cuádruple).
 */
export function resolveRoomTypeForCapacity(
  currentType: LodgingRoomType,
  capacity: number,
): LodgingRoomType {
  if (LODGING_ROOM_CAPACITY[currentType] === capacity) return currentType;
  return LODGING_ROOM_TYPE_BY_CAPACITY[capacity] ?? currentType;
}

/**
 * Espejo de `DELETE .../beds/:slotIndex`: baja la capacidad, recorre las camas siguientes y
 * cambia el tipo al de la nueva capacidad.
 */
export function removeBedFromRoom(room: LodgingRoomOutput, slotIndex: number): LodgingRoomOutput {
  const capacity = Math.max(1, room.capacity - 1);
  return {
    ...room,
    capacity,
    roomType: resolveRoomTypeForCapacity(room.roomType, capacity),
    slots: room.slots
      .filter((slot) => slot.slotIndex !== slotIndex)
      .map((slot) =>
        slot.slotIndex > slotIndex ? { ...slot, slotIndex: slot.slotIndex - 1 } : slot,
      ),
  };
}

/** Quita una habitación de la caché del hospedaje (el hotel se conserva aunque quede vacío). */
export function removeRoomFromLodging(lodging: LodgingOutput, roomId: string): LodgingOutput {
  const removed = lodging.hotels.flatMap((hotel) => hotel.rooms).find((room) => room.id === roomId);
  if (!removed) return lodging;
  return {
    ...lodging,
    hotels: lodging.hotels.map((hotel) => ({
      ...hotel,
      rooms: hotel.rooms.filter((room) => room.id !== roomId),
    })),
    totalRooms: lodging.totalRooms - 1,
    totalCapacity: lodging.totalCapacity - removed.capacity,
  };
}

/** Primera Matrimonial sin ocupantes (destino de "Asignar pareja juntos"). */
export const findEmptyMatrimonial = (rooms: LodgingRoomOutput[]): LodgingRoomOutput | undefined =>
  sortRooms(rooms).find(
    (room) => room.roomType === LODGING_ROOM_TYPE.MATRIMONIAL && room.slots.length === 0,
  );

export interface PassengerGroup {
  bookingId: string;
  groupLabel: string;
  passengers: LodgingPassengerOutput[];
}

/**
 * Agrupa por reserva: grupo = 2+ pasajeros sin cama de la misma reserva; el resto, individuales.
 * Conserva el orden de llegada.
 */
export function groupUnassignedPassengers(passengers: LodgingPassengerOutput[]): {
  groups: PassengerGroup[];
  individuals: LodgingPassengerOutput[];
} {
  const byBooking = new Map<string, LodgingPassengerOutput[]>();
  for (const passenger of passengers) {
    byBooking.set(passenger.bookingId, [...(byBooking.get(passenger.bookingId) ?? []), passenger]);
  }
  const groups: PassengerGroup[] = [];
  const individuals: LodgingPassengerOutput[] = [];
  for (const [bookingId, members] of byBooking) {
    if (members.length >= 2) {
      groups.push({ bookingId, groupLabel: members[0].groupLabel, passengers: members });
    } else {
      individuals.push(...members);
    }
  }
  return { groups, individuals };
}

/** Búsqueda por nombre o grupo (sin acentos ni mayúsculas). */
export const matchesPassengerSearch = (query: string, passenger: LodgingPassengerOutput): boolean =>
  matchesSearch(query, { texts: [passenger.fullName, passenger.groupLabel] });

export type RoomFilter = "ALL" | "MATRIMONIAL" | "DOUBLE_INDIVIDUAL" | "FREE_BEDS";

export function filterRooms(rooms: LodgingRoomOutput[], filter: RoomFilter): LodgingRoomOutput[] {
  switch (filter) {
    case "MATRIMONIAL":
      return rooms.filter((room) => room.roomType === LODGING_ROOM_TYPE.MATRIMONIAL);
    case "DOUBLE_INDIVIDUAL":
      return rooms.filter((room) => room.roomType === LODGING_ROOM_TYPE.DOUBLE_INDIVIDUAL);
    case "FREE_BEDS":
      return rooms.filter((room) => getRoomFreeBeds(room) > 0);
    default:
      return rooms;
  }
}

/** Iniciales para el avatar: primera letra de las dos primeras palabras. */
export function getInitials(fullName: string): string {
  return (
    fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("") || "?"
  );
}

/**
 * Estancia del tour: "Vie., 14 nov. – Dom., 16 nov. (2 noches)". Sin regreso posterior a la
 * salida, solo la fecha de salida. Las fechas son del tour (el hotel no guarda fechas propias).
 */
export function buildStayLabel(
  departureDateTime: string,
  returnDate: string | null | undefined,
): string {
  const departure = formatForDateInput(departureDateTime);
  if (!departure) return "";
  const departureLabel = formatLocalDate(departure);
  if (!returnDate || !tourHasLodgingNights(departureDateTime, returnDate)) return departureLabel;
  const returnDay = returnDate.slice(0, 10);
  const nights = Math.round(
    (parseDateOnly(returnDay).getTime() - parseDateOnly(departure).getTime()) / 86_400_000,
  );
  return `${departureLabel} – ${formatLocalDate(returnDay)} (${nights} ${nights === 1 ? "noche" : "noches"})`;
}

/** Texto para enviar por WhatsApp al hotel. Solo el hotel indicado. */
export function buildRoomingListText({
  tourTitle,
  hotel,
  stayLabel,
  passengers,
}: {
  tourTitle: string;
  hotel: LodgingHotelOutput;
  stayLabel: string;
  passengers: LodgingPassengerOutput[];
}): string {
  const namesById = new Map(passengers.map((item) => [item.bookingPassengerId, item.fullName]));
  const titles = getRoomTitles(hotel.rooms);
  const header = `Hotel: ${hotel.name}${stayLabel ? ` (${stayLabel})` : ""}`;
  const lines = sortRooms(hotel.rooms).flatMap((room) => {
    const names = [...room.slots]
      .sort((a, b) => a.slotIndex - b.slotIndex)
      .map((slot) => namesById.get(slot.bookingPassengerId) ?? "Pasajero");
    const label = room.roomNumber ? `Hab. ${room.roomNumber}` : titles[room.id];
    return [
      `• ${label} (${getRoomDescription(room)}) [${LODGING_ROOM_STATUS_DICT[room.status].label}]:`,
      `  - ${names.length > 0 ? names.join(", ") : "Sin asignar"}`,
    ];
  });
  return [
    `ROOMING LIST - ${tourTitle.toUpperCase()}`,
    header,
    "----------------------------------------",
    ...lines,
  ].join("\n");
}
