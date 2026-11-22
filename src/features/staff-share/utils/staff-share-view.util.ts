import { parseVehicleLayout } from "@/features/vehicles/utils/vehicle-layout.util";
import {
  compareSeatLabels,
  toShortName,
} from "@/features/tour-dashboard/utils/boarding-sheet.util";
import { matchesSearch } from "@/shared/utils/search.util";
import type {
  StaffSharePassengerOutput,
  StaffSharePointOutput,
  StaffShareOutput,
} from "../schemas/staff-share.schema";

export type StaffSeatStatus = "FREE" | "OCCUPIED" | "STAFF";

export interface StaffShareRow {
  passenger: StaffSharePassengerOutput;
  shortName: string;
  point: StaffSharePointOutput | null;
}

export interface StaffShareSeat {
  label: string;
  status: StaffSeatStatus;
  row: StaffShareRow | null;
}

export interface StaffShareView {
  seatsByLabel: Map<string, StaffShareSeat>;
  /** Pasajeros con asiento, en orden natural de etiqueta. */
  seatedRows: StaffShareRow[];
  /** Pasajeros sin asiento asignado (al final de la lista). */
  unseatedRows: StaffShareRow[];
}

/**
 * Resuelve los datos del enlace para staff en lo que dibujan el croquis y la lista: asiento por
 * etiqueta (libre / ocupado / staff), filas con el punto de abordaje ya resuelto y el nombre corto.
 * Los asientos de staff del croquis y los bloqueados se tratan igual ("Staff").
 */
export const buildStaffShareView = (data: StaffShareOutput): StaffShareView => {
  const pointByCode = new Map(data.boardingPoints.map((point) => [point.code, point]));
  const rows: StaffShareRow[] = data.passengers.map((passenger) => ({
    passenger,
    shortName: toShortName(passenger.fullName),
    point: passenger.boardingPointCode
      ? (pointByCode.get(passenger.boardingPointCode) ?? null)
      : null,
  }));

  const rowBySeat = new Map(
    rows.flatMap((row) =>
      row.passenger.seatLabel ? [[row.passenger.seatLabel, row] as const] : [],
    ),
  );
  const blocked = new Set(data.blockedSeats);

  const seatsByLabel = new Map<string, StaffShareSeat>();
  for (const layoutSeat of data.vehicle ? parseVehicleLayout(data.vehicle.layoutMap).seats : []) {
    const { label } = layoutSeat;
    const isStaff = layoutSeat.kind === "STAFF" || blocked.has(label);
    const row = isStaff ? null : (rowBySeat.get(label) ?? null);
    seatsByLabel.set(label, {
      label,
      status: isStaff ? "STAFF" : row ? "OCCUPIED" : "FREE",
      row,
    });
  }

  const byNaturalSeat = (a: StaffShareRow, b: StaffShareRow) =>
    compareSeatLabels(a.passenger.seatLabel ?? "", b.passenger.seatLabel ?? "");

  return {
    seatsByLabel,
    seatedRows: rows.filter((row) => row.passenger.seatLabel).sort(byNaturalSeat),
    unseatedRows: rows.filter((row) => !row.passenger.seatLabel),
  };
};

export interface StaffShareFilters {
  /** Código del punto ("P1") o `null` para todos. */
  pointCode: string | null;
  query: string;
}

/** ¿El pasajero cumple el filtro por punto de abordaje y la búsqueda por nombre? */
export const rowMatchesFilters = (row: StaffShareRow, filters: StaffShareFilters): boolean =>
  (filters.pointCode === null || row.passenger.boardingPointCode === filters.pointCode) &&
  matchesSearch(filters.query, { texts: [row.passenger.fullName] });
