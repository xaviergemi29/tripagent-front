import type { TitularRowOutput } from "@/features/tour-dashboard/schemas/tour-dashboard.schema";
import { LODGING_SLOT_INDEX } from "@/shared/constants/domain.constants";
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
import {
  describeBeds,
  getBedName,
  getBedOfSlot,
  getBedsKey,
  getRoomKindName,
  getSlotLabel,
  removeBedFromBeds,
} from "@/shared/utils/lodging-beds.util";

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

/** "Doble · 2 individuales #2": n = orden por `position` entre las habitaciones con las mismas camas. */
export function getRoomTitles(rooms: LodgingRoomOutput[]): Record<string, string> {
  const counters: Record<string, number> = {};
  const titles: Record<string, string> = {};
  for (const room of sortRooms(rooms)) {
    const key = getBedsKey(room);
    counters[key] = (counters[key] ?? 0) + 1;
    titles[room.id] = `${getRoomKindName(room)} #${counters[key]}`;
  }
  return titles;
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
  /** "Doble · 2 individuales #1 · Cama individual 2". */
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
        label: `${titles[room.id]} · ${getSlotLabel(room, bed.slotIndex)}`,
      })),
  );
}

/** Camas de la habitación: "1 cama matrimonial + 2 camas individuales · 3 personas". */
export const getRoomDescription = (room: LodgingRoomOutput): string => describeBeds(room);

/** "Doble · 2 individuales #1 · Hab. 102" (sin número de cuarto, solo el título). */
export const getRoomDisplayName = (title: string, roomNumber: string | null): string =>
  roomNumber ? `${title} · Hab. ${roomNumber}` : title;

export function buildBedDeletionTarget(
  room: LodgingRoomOutput,
  title: string,
  slotIndex: number,
  passengers: LodgingPassengerOutput[],
): TargetBedDeletion {
  const bed = getBedOfSlot(room, slotIndex);
  const firstSlot = bed?.firstSlot ?? slotIndex;
  const size = bed?.size ?? 1;
  const assignedPassengers = room.slots
    .filter((slot) => slot.slotIndex >= firstSlot && slot.slotIndex < firstSlot + size)
    .sort((a, b) => a.slotIndex - b.slotIndex)
    .map((slot) => ({
      id: slot.bookingPassengerId,
      // Un pasajero que ya no viene en la lista conserva un nombre genérico.
      fullName:
        passengers.find((item) => item.bookingPassengerId === slot.bookingPassengerId)?.fullName ??
        "Pasajero",
    }));
  return {
    roomId: room.id,
    roomName: getRoomDisplayName(title, room.roomNumber),
    slotIndex,
    bedName: bed ? getBedName(bed) : "cama",
    slotsCount: size,
    assignedPassengers,
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
 * Espejo de `DELETE .../beds/:slotIndex`: elimina la cama completa que contiene el lugar (una
 * matrimonial son 2 lugares), quita a sus ocupantes y recorre los lugares siguientes.
 */
export function removeBedFromRoom(room: LodgingRoomOutput, slotIndex: number): LodgingRoomOutput {
  const bed = getBedOfSlot(room, slotIndex);
  if (!bed) return room;
  const beds = removeBedFromBeds(room, slotIndex);
  const lastSlot = bed.firstSlot + bed.size - 1;
  return {
    ...room,
    ...beds,
    capacity: room.capacity - bed.size,
    slots: room.slots
      .filter((slot) => slot.slotIndex < bed.firstSlot || slot.slotIndex > lastSlot)
      .map((slot) =>
        slot.slotIndex > lastSlot ? { ...slot, slotIndex: slot.slotIndex - bed.size } : slot,
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

export interface FreeMatrimonialBed {
  roomId: string;
  /** Los dos lugares de la cama matrimonial. */
  slotIndexes: [number, number];
}

/** Primera cama matrimonial con sus dos lugares libres, en cualquier habitación (destino de la pareja). */
export function findFreeMatrimonialBed(rooms: LodgingRoomOutput[]): FreeMatrimonialBed | undefined {
  for (const room of sortRooms(rooms)) {
    const taken = new Set(room.slots.map((slot) => slot.slotIndex));
    for (let bed = 1; bed <= room.matrimonialBeds; bed += 1) {
      const first = bed * 2 - 1;
      if (!taken.has(first) && !taken.has(first + 1)) {
        return { roomId: room.id, slotIndexes: [first, first + 1] };
      }
    }
  }
  return undefined;
}

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

export type RoomFilter = "ALL" | "WITH_MATRIMONIAL" | "ONLY_SINGLES" | "FREE_BEDS";

export function filterRooms(rooms: LodgingRoomOutput[], filter: RoomFilter): LodgingRoomOutput[] {
  switch (filter) {
    case "WITH_MATRIMONIAL":
      return rooms.filter((room) => room.matrimonialBeds > 0);
    case "ONLY_SINGLES":
      return rooms.filter((room) => room.matrimonialBeds === 0);
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
      `• ${label} (${getRoomDescription(room)}):`,
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
