import { LODGING_BED_LIMITS, LODGING_LIMITS } from "@/shared/constants/domain.constants";

/**
 * Único módulo de camas del hospedaje. Una habitación es un conjunto de camas: matrimoniales
 * (2 lugares) e individuales (1 lugar). Los lugares (`slotIndex` 1..capacidad) se numeran primero
 * por las matrimoniales (la cama i ocupa los lugares 2i−1 y 2i) y después por las individuales.
 * La API es la fuente de verdad: aquí solo se valida el formulario y se muestra.
 */
export interface RoomBeds {
  matrimonialBeds: number;
  singleBeds: number;
}

export type BedKind = "MATRIMONIAL" | "SINGLE";

const MATRIMONIAL_SIZE = 2;

/** Lugares: matrimonial = 2, individual = 1. */
export const getBedsCapacity = ({ matrimonialBeds, singleBeds }: RoomBeds): number =>
  matrimonialBeds * MATRIMONIAL_SIZE + singleBeds;

const isCount = (value: number, max: number): boolean =>
  Number.isInteger(value) && value >= 0 && value <= max;

/** Dentro de los límites de la API: al menos una cama, matrimoniales 0..2, individuales 0..4, ≤ 6 lugares. */
export const isValidBeds = (beds: RoomBeds): boolean =>
  isCount(beds.matrimonialBeds, LODGING_BED_LIMITS.matrimonialMax) &&
  isCount(beds.singleBeds, LODGING_BED_LIMITS.singleMax) &&
  beds.matrimonialBeds + beds.singleBeds >= 1 &&
  getBedsCapacity(beds) <= LODGING_BED_LIMITS.capacityMax;

/** ¿Cabe una cama más de esa clase sin pasar de los límites? */
export function canAddBed(beds: RoomBeds, kind: BedKind): boolean {
  return kind === "MATRIMONIAL"
    ? beds.matrimonialBeds < LODGING_BED_LIMITS.matrimonialMax &&
        getBedsCapacity(beds) + MATRIMONIAL_SIZE <= LODGING_BED_LIMITS.capacityMax
    : beds.singleBeds < LODGING_BED_LIMITS.singleMax &&
        getBedsCapacity(beds) + 1 <= LODGING_BED_LIMITS.capacityMax;
}

const plural = (count: number, singular: string, pluralForm: string): string =>
  `${count} ${count === 1 ? singular : pluralForm}`;

export const formatPeople = (capacity: number): string => plural(capacity, "persona", "personas");

const ROOM_KIND_NAMES: Record<string, string> = {
  "0/1": "Individual",
  "1/0": "Matrimonial",
  "0/2": "Doble · 2 individuales",
  "2/0": "Doble · 2 matrimoniales",
  "1/1": "Triple · 1 matrimonial + 1 individual",
  "0/3": "Triple · 3 individuales",
  "1/2": "Cuádruple · 1 matrimonial + 2 individuales",
  "0/4": "Cuádruple · 4 individuales",
};

/** Clave de configuración ("1/2"): agrupa habitaciones idénticas y numera "#n". */
export const getBedsKey = ({ matrimonialBeds, singleBeds }: RoomBeds): string =>
  `${matrimonialBeds}/${singleBeds}`;

/** Nombre de la habitación según sus camas ("Doble · 2 individuales"). */
export function getRoomKindName(beds: RoomBeds): string {
  const known = ROOM_KIND_NAMES[getBedsKey(beds)];
  if (known) return known;
  const { matrimonialBeds, singleBeds } = beds;
  return `${formatPeople(getBedsCapacity(beds))} · ${matrimonialBeds} ${
    matrimonialBeds === 1 ? "matrimonial" : "matrimoniales"
  } + ${singleBeds} ${singleBeds === 1 ? "individual" : "individuales"}`;
}

/** Nombre con la capacidad ("Doble · 2 individuales · 2 personas"); el genérico ya la trae. */
export function getRoomKindLabel(beds: RoomBeds): string {
  const name = getRoomKindName(beds);
  return getBedsKey(beds) in ROOM_KIND_NAMES
    ? `${name} · ${formatPeople(getBedsCapacity(beds))}`
    : name;
}

/** "1 cama matrimonial + 2 camas individuales · 3 personas". */
export function describeBeds(beds: RoomBeds): string {
  const parts = [
    beds.matrimonialBeds > 0
      ? plural(beds.matrimonialBeds, "cama matrimonial", "camas matrimoniales")
      : null,
    beds.singleBeds > 0 ? plural(beds.singleBeds, "cama individual", "camas individuales") : null,
  ].filter(Boolean);
  return `${parts.join(" + ")} · ${formatPeople(getBedsCapacity(beds))}`;
}

export interface BedOfSlot {
  kind: BedKind;
  /** Posición entre las camas de su clase (1..n). */
  number: number;
  /** Primer lugar de la cama y cuántos lugares ocupa. */
  firstSlot: number;
  size: number;
}

/** Cama que contiene el lugar `slotIndex`; `null` si está fuera de la capacidad. */
export function getBedOfSlot(beds: RoomBeds, slotIndex: number): BedOfSlot | null {
  if (!Number.isInteger(slotIndex) || slotIndex < 1 || slotIndex > getBedsCapacity(beds)) {
    return null;
  }
  const matrimonialSlots = beds.matrimonialBeds * MATRIMONIAL_SIZE;
  if (slotIndex <= matrimonialSlots) {
    const number = Math.ceil(slotIndex / MATRIMONIAL_SIZE);
    return {
      kind: "MATRIMONIAL",
      number,
      firstSlot: (number - 1) * MATRIMONIAL_SIZE + 1,
      size: MATRIMONIAL_SIZE,
    };
  }
  return { kind: "SINGLE", number: slotIndex - matrimonialSlots, firstSlot: slotIndex, size: 1 };
}

/** Etiqueta del lugar: "Cama matrimonial 1 · lado A" / "Cama individual 2". */
export function getSlotLabel(beds: RoomBeds, slotIndex: number): string {
  const bed = getBedOfSlot(beds, slotIndex);
  if (!bed) return `Lugar ${slotIndex}`;
  if (bed.kind === "SINGLE") return `Cama individual ${bed.number}`;
  return `Cama matrimonial ${bed.number} · lado ${slotIndex === bed.firstSlot ? "A" : "B"}`;
}

/** Nombre de la cama completa: "cama matrimonial 1" / "cama individual 2". */
export function getBedName(bed: BedOfSlot): string {
  return `cama ${bed.kind === "MATRIMONIAL" ? "matrimonial" : "individual"} ${bed.number}`;
}

/** Camas que quedan al eliminar la cama que contiene `slotIndex` (la API baja una cama completa). */
export function removeBedFromBeds(beds: RoomBeds, slotIndex: number): RoomBeds {
  const bed = getBedOfSlot(beds, slotIndex);
  if (!bed) return beds;
  return bed.kind === "MATRIMONIAL"
    ? { ...beds, matrimonialBeds: beds.matrimonialBeds - 1 }
    : { ...beds, singleBeds: beds.singleBeds - 1 };
}

export interface RoomBedsGroup extends RoomBeds {
  quantity: number;
}

/** Habitaciones idénticas agrupadas, en el orden de la primera aparición (cuerpo de la API). */
export function groupRoomsByBeds(rooms: readonly RoomBeds[]): RoomBedsGroup[] {
  const groups = new Map<string, RoomBedsGroup>();
  for (const room of rooms) {
    if (!isValidBeds(room)) continue;
    const key = getBedsKey(room);
    const group = groups.get(key);
    if (group) group.quantity += 1;
    else {
      groups.set(key, {
        matrimonialBeds: room.matrimonialBeds,
        singleBeds: room.singleBeds,
        quantity: 1,
      });
    }
  }
  return [...groups.values()];
}

/** Lugares totales de las habitaciones válidas. */
export const getRegisterableCapacity = (rooms: readonly RoomBeds[]): number =>
  rooms.reduce((sum, room) => sum + (isValidBeds(room) ? getBedsCapacity(room) : 0), 0);

/** ¿Pasa los máximos por envío de la API (50 por configuración, 200 habitaciones)? */
export function exceedsRegisterLimits(rooms: readonly RoomBeds[]): boolean {
  if (rooms.length > LODGING_LIMITS.totalRoomsMax) return true;
  const groups = groupRoomsByBeds(rooms);
  return (
    groups.length > LODGING_LIMITS.roomConfigsMax ||
    groups.some(({ quantity }) => quantity > LODGING_LIMITS.quantityMax)
  );
}
