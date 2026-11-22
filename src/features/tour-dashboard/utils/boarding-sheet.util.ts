import type { SeatInfo } from "../hooks/useTourSeats";
import type { TourManifestOutput } from "../schemas/tour-manifest.schema";
import type { LayoutMap } from "@/features/vehicles/schemas/vehicle.schema";
import { parseVehicleLayout } from "@/features/vehicles/utils/vehicle-layout.util";

/** Nombre con el que la API anonimiza a un viajero eliminado (regla 25): no se abrevia. */
const ANONYMIZED_TRAVELER_NAME = "Pasajero Eliminado";

/** Punto de abordaje con su código corto (P1…Pn, en el orden del manifiesto). */
export interface SheetBoardingPoint {
  code: string;
  location: string;
  time: string;
}

export type SheetSeatStatus = "FREE" | "OCCUPIED" | "STAFF";

/** Un asiento del croquis ya resuelto para imprimir. Nunca lleva datos financieros. */
export interface SheetSeat {
  label: string;
  /** Asiento de staff del croquis o bloqueado para staff → "STAFF". */
  status: SheetSeatStatus;
  /** Nombre completo; `null` si está ocupado por una reserva que el manifiesto no incluye. */
  fullName: string | null;
  /** "Ana T." */
  shortName: string | null;
  isTitular: boolean;
  point: SheetBoardingPoint | null;
}

export interface SheetUnseatedPassenger {
  id: string;
  fullName: string;
  isTitular: boolean;
  point: SheetBoardingPoint;
}

export interface BoardingSheet {
  points: SheetBoardingPoint[];
  /** Todos los asientos del croquis, por etiqueta (para dibujar el croquis). */
  seatsByLabel: Map<string, SheetSeat>;
  /** Solo asientos de pasajero del croquis, en orden natural (para la tabla). */
  passengerSeatRows: SheetSeat[];
  /** Pasajeros del manifiesto sin asiento en el croquis. */
  unseated: SheetUnseatedPassenger[];
}

const collator = new Intl.Collator("es", { numeric: true, sensitivity: "base" });

/** Orden natural de etiquetas: "2" antes de "10"; "07" y "7" quedan juntos. */
export const compareSeatLabels = (a: string, b: string): number =>
  collator.compare(a, b) || a.localeCompare(b);

/**
 * "Ana Torres Ruiz" → "Ana T." (primer nombre + inicial del primer apellido). Con un solo nombre
 * o con el nombre anonimizado se deja tal cual. Con 4 o más palabras se asume nombre compuesto
 * ("María José Torres Ruiz" → "María T.").
 */
export const toShortName = (fullName: string): string => {
  const name = fullName.trim().replace(/\s+/g, " ");
  if (name === ANONYMIZED_TRAVELER_NAME) return name;
  const parts = name.split(" ");
  if (parts.length < 2) return name;
  const surname = parts.length >= 4 ? parts[2] : parts[1];
  return `${parts[0]} ${surname.charAt(0).toUpperCase()}.`;
};

interface BuildBoardingSheetInput {
  manifest: TourManifestOutput;
  /** `null` si el tour no tiene vehículo asignado. */
  layoutMap: LayoutMap | null;
  /** Asientos asignados y bloqueados (`useTourSeats`). */
  seats: SeatInfo[];
}

/**
 * Arma la lista de abordaje: P1…Pn en el orden del manifiesto, un asiento resuelto por cada celda
 * del croquis y los pasajeros sin asiento. Un asiento asignado cuyo pasajero no está en el
 * manifiesto (reserva sin pago, excluida de él) queda "Ocupado" sin nombre.
 */
export const buildBoardingSheet = ({
  manifest,
  layoutMap,
  seats,
}: BuildBoardingSheetInput): BoardingSheet => {
  const points: SheetBoardingPoint[] = manifest.boardingPoints.map((point, index) => ({
    code: `P${index + 1}`,
    location: point.location,
    time: point.time,
  }));

  const passengers = manifest.boardingPoints.flatMap((point, index) =>
    point.passengers.map((passenger) => ({ passenger, point: points[index] })),
  );
  const passengerBySeat = new Map(
    passengers.flatMap((entry) =>
      entry.passenger.seatLabel ? [[entry.passenger.seatLabel, entry] as const] : [],
    ),
  );
  const seatInfoByLabel = new Map(seats.map((seat) => [seat.seatLabel, seat]));

  const seatsByLabel = new Map<string, SheetSeat>();
  const passengerKindLabels: string[] = [];

  for (const layoutSeat of layoutMap ? parseVehicleLayout(layoutMap).seats : []) {
    const { label } = layoutSeat;
    const info = seatInfoByLabel.get(label);
    const entry = passengerBySeat.get(label);
    const isStaff = layoutSeat.kind === "STAFF" || info?.status === "BLOCKED";

    if (layoutSeat.kind === "PASSENGER") passengerKindLabels.push(label);

    seatsByLabel.set(label, {
      label,
      status: isStaff ? "STAFF" : entry || info?.status === "ASSIGNED" ? "OCCUPIED" : "FREE",
      fullName: !isStaff && entry ? entry.passenger.fullName : null,
      shortName: !isStaff && entry ? toShortName(entry.passenger.fullName) : null,
      isTitular: !isStaff && entry ? entry.passenger.isTitular : false,
      point: !isStaff && entry ? entry.point : null,
    });
  }

  const passengerSeatRows = [...passengerKindLabels].sort(compareSeatLabels).flatMap((label) => {
    const seat = seatsByLabel.get(label);
    return seat ? [seat] : [];
  });

  const unseated = passengers
    .filter(({ passenger }) => !passenger.seatLabel || !seatsByLabel.has(passenger.seatLabel))
    .map(({ passenger, point }) => ({
      id: passenger.id,
      fullName: passenger.fullName,
      isTitular: passenger.isTitular,
      point,
    }));

  return { points, seatsByLabel, passengerSeatRows, unseated };
};
