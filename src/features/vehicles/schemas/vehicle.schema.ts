import { z } from "zod";

/**
 * Espejo de `shared/utils/vehicle-layout.util.ts` de la API (croquis de vehículo).
 * Celdas: null (vacío o cubierto por un WC), "AISLE" (pasillo), texto (asiento de pasajero,
 * formato anterior), { type: "SEAT", label, kind }, { type: "DRIVER" } (operador) y
 * { type: "WC", rowSpan?, colSpan? }.
 */
export const SEAT_KINDS = ["PASSENGER", "STAFF"] as const;

export const layoutCellSchema = z.union([
  z.null(),
  z.string(),
  z.object({
    type: z.literal("SEAT"),
    label: z.string(),
    kind: z.enum(SEAT_KINDS).default("PASSENGER"),
  }),
  z.object({ type: z.literal("DRIVER") }),
  z.object({
    type: z.literal("WC"),
    rowSpan: z.number().int().optional(),
    colSpan: z.number().int().optional(),
  }),
]);

export const layoutMapSchema = z.array(z.array(layoutCellSchema));

/** Capacidad calculada por la API: `total` = pasajeros + staff; el operador nunca cuenta. */
export const vehicleCapacityOutputSchema = z.object({
  total: z.number(),
  passenger: z.number(),
  staff: z.number(),
});

/** Plantilla del catálogo global (`GET /vehicle-templates`). */
export const vehicleTemplateOutputSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string(),
  layoutMap: layoutMapSchema,
  capacity: vehicleCapacityOutputSchema,
});

export type SeatKind = (typeof SEAT_KINDS)[number];
export type LayoutCell = z.input<typeof layoutCellSchema> | undefined;
export type LayoutMap = LayoutCell[][];
export type VehicleCapacityOutput = z.infer<typeof vehicleCapacityOutputSchema>;
export type VehicleTemplateOutput = z.infer<typeof vehicleTemplateOutputSchema>;
