import type { LayoutCell, LayoutMap, SeatKind } from "../schemas/vehicle.schema";

/** Elemento del croquis ya ubicado en la cuadrícula (filas y columnas desde 1, como CSS grid). */
export type LayoutItem =
  | { type: "SEAT"; label: string; kind: SeatKind; row: number; col: number }
  | { type: "DRIVER"; row: number; col: number }
  | { type: "WC"; row: number; col: number; rowSpan: number; colSpan: number };

export interface ParsedLayout {
  rows: number;
  cols: number;
  items: LayoutItem[];
  seats: Extract<LayoutItem, { type: "SEAT" }>[];
  /** Columnas sin asientos, operador ni WC (pasillo): se dibujan más angostas. */
  aisleColumns: Set<number>;
}

const toItem = (cell: LayoutCell, row: number, col: number): LayoutItem | null => {
  if (cell === null || cell === undefined) return null;
  if (typeof cell === "string") {
    return cell === "AISLE" ? null : { type: "SEAT", label: cell, kind: "PASSENGER", row, col };
  }
  if (cell.type === "SEAT") {
    return { type: "SEAT", label: cell.label, kind: cell.kind ?? "PASSENGER", row, col };
  }
  if (cell.type === "DRIVER") return { type: "DRIVER", row, col };
  return { type: "WC", row, col, rowSpan: cell.rowSpan ?? 1, colSpan: cell.colSpan ?? 1 };
};

/**
 * Interpreta cualquier croquis (formato tipado o anterior) para dibujarlo. Es la única lógica de
 * lectura de croquis del front: los componentes no conocen modelos concretos de vehículo.
 */
export const parseVehicleLayout = (layoutMap: LayoutMap): ParsedLayout => {
  const items = layoutMap.flatMap((row, r) =>
    row.flatMap((cell, c) => {
      const item = toItem(cell, r + 1, c + 1);
      return item ? [item] : [];
    }),
  );
  const cols = Math.max(1, ...layoutMap.map((row) => row.length));

  const occupiedColumns = new Set<number>();
  for (const item of items) {
    const span = item.type === "WC" ? item.colSpan : 1;
    for (let c = item.col; c < item.col + span; c++) occupiedColumns.add(c);
  }
  const aisleColumns = new Set(
    Array.from({ length: cols }, (_, i) => i + 1).filter((c) => !occupiedColumns.has(c)),
  );

  return {
    rows: layoutMap.length,
    cols,
    items,
    seats: items.filter(
      (item): item is Extract<LayoutItem, { type: "SEAT" }> => item.type === "SEAT",
    ),
    aisleColumns,
  };
};

/** Etiquetas de todos los asientos (pasajeros + staff). Igual que `getLayoutSeatLabels` de la API. */
export const getLayoutSeatLabels = (layoutMap: LayoutMap): string[] =>
  parseVehicleLayout(layoutMap).seats.map((seat) => seat.label);
