import { TOUR_TEMPORAL_STATUS } from "@/shared/constants/domain.constants";
import { LODGING_ROOM_TYPE_DICT } from "@/shared/utils/config/status-dictionaries.config";
import { matchesSearch } from "@/shared/utils/search.util";
import type { LodgingRoomType } from "@/shared/constants/domain.constants";
import type { BoardingListItem, BoardingRoomOutput } from "../schemas/boarding.schema";

export const BOARDING_FILTERS = ["missing", "boarded", "all"] as const;
export type BoardingFilter = (typeof BOARDING_FILTERS)[number];

export const BOARDING_FILTER_LABELS: Record<BoardingFilter, string> = {
  missing: "Faltan",
  boarded: "Abordados",
  all: "Todos",
};

/** Cada cuánto se vuelve a pedir la lista con la pestaña visible (dos personas pasando lista). */
export const BOARDING_REFETCH_MS = 15_000;

/** "Faltan" en un tour EN CURSO (al pie del autobús); "Todos" antes de la salida o al consultar. */
export const getDefaultBoardingFilter = (temporalStatus: string): BoardingFilter =>
  temporalStatus === TOUR_TEMPORAL_STATUS.IN_PROGRESS ? "missing" : "all";

export const countBoarded = (items: BoardingListItem[]) =>
  items.filter((item) => item.boardedAt !== null).length;

/** Filtro por estado + búsqueda por nombre del pasajero o de su titular (sin acentos). */
export const filterBoardingItems = (
  items: BoardingListItem[],
  filter: BoardingFilter,
  query: string,
): BoardingListItem[] =>
  items.filter((item) => {
    if (filter === "missing" && item.boardedAt !== null) return false;
    if (filter === "boarded" && item.boardedAt === null) return false;
    return matchesSearch(query, { texts: [item.fullName, item.holderName] });
  });

/**
 * Habitación para mostrar: "Hab. 102" con número o "Matrimonial #2" sin él. Con más de un hotel en
 * el tour se agrega el nombre del hotel.
 */
export const formatBoardingRoom = (room: BoardingRoomOutput, withHotel: boolean): string => {
  const typeName = LODGING_ROOM_TYPE_DICT[room.roomType as LodgingRoomType]?.name ?? "Habitación";
  const label = room.roomNumber ? `Hab. ${room.roomNumber}` : `${typeName} #${room.typeIndex}`;
  return withHotel && room.hotelName ? `${label} · ${room.hotelName}` : label;
};

/** ¿Hay pasajeros en más de un hotel? (para mostrar el nombre del hotel junto a la habitación). */
export const hasMultipleHotels = (items: BoardingListItem[]) =>
  new Set(items.flatMap((item) => item.rooms.map((room) => room.hotelName))).size > 1;

/** Copia optimista: marca o desmarca un renglón sin esperar a la API. */
export const applyBoardingChange = <T extends { boardedAt: string | null }>(
  passengers: T[],
  matches: (passenger: T) => boolean,
  boarded: boolean,
  now: Date = new Date(),
): T[] =>
  passengers.map((passenger) =>
    matches(passenger)
      ? { ...passenger, boardedAt: boarded ? now.toISOString() : null }
      : passenger,
  );
