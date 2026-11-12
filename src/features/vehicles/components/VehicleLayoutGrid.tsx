"use client";

import type { CSSProperties, ReactNode } from "react";
import { Toilet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LayoutMap } from "../schemas/vehicle.schema";
import { parseVehicleLayout, type LayoutItem } from "../utils/vehicle-layout.util";

export type LayoutSeat = Extract<LayoutItem, { type: "SEAT" }>;

interface VehicleLayoutGridProps {
  layoutMap: LayoutMap;
  /** Cómo se dibuja cada asiento (pasajero o staff). Debe ocupar toda la celda (h-full w-full). */
  renderSeat: (seat: LayoutSeat) => ReactNode;
  /** "md": croquis interactivo; "sm": vista previa compacta (selector de vehículo). */
  size?: "sm" | "md";
  className?: string;
}

/** Volante (lucide no incluye uno). Decorativo. */
function SteeringWheelIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M3.5 10.5h6M14.5 10.5h6M12 14.5V21" />
    </svg>
  );
}

/**
 * Dibuja cualquier croquis de vehículo con CSS grid: asientos (vía `renderSeat`), operador, WC
 * (con `rowSpan`/`colSpan`) y pasillos más angostos. Es genérico: soporta las plantillas del
 * catálogo, los vehículos con el formato anterior y modelos futuros sin cambios de código.
 */
export function VehicleLayoutGrid({
  layoutMap,
  renderSeat,
  size = "md",
  className,
}: VehicleLayoutGridProps) {
  const layout = parseVehicleLayout(layoutMap);
  const isSmall = size === "sm";

  const gridStyle: CSSProperties = {
    gridTemplateColumns: Array.from({ length: layout.cols }, (_, i) =>
      layout.aisleColumns.has(i + 1) ? "var(--aisle)" : "var(--seat)",
    ).join(" "),
    gridAutoRows: "var(--seat)",
  };

  const place = (item: LayoutItem): CSSProperties => ({
    gridRow: `${item.row} / span ${item.type === "WC" ? item.rowSpan : 1}`,
    gridColumn: `${item.col} / span ${item.type === "WC" ? item.colSpan : 1}`,
  });

  return (
    <div className={cn("inline-flex flex-col items-center gap-2", className)}>
      <span
        className={cn(
          "w-full rounded-t-2xl border-b-2 border-slate-300 text-center font-semibold tracking-widest text-slate-400 uppercase",
          isSmall ? "pb-0.5 text-[9px]" : "pb-1 text-[10px]",
        )}
      >
        Frente
      </span>

      <div
        className={cn(
          "grid",
          isSmall
            ? "gap-1 [--aisle:0.5rem] [--seat:1.75rem]"
            : "gap-1.5 [--aisle:0.75rem] [--seat:2.75rem] sm:gap-2 sm:[--aisle:1.25rem] sm:[--seat:3.25rem] lg:[--seat:3.5rem]",
        )}
        style={gridStyle}
      >
        {layout.items.map((item) => {
          if (item.type === "SEAT") {
            return (
              <div key={`seat-${item.label}`} style={place(item)} className="min-h-0 min-w-0">
                {renderSeat(item)}
              </div>
            );
          }

          if (item.type === "DRIVER") {
            return (
              <div
                key={`driver-${item.row}-${item.col}`}
                style={place(item)}
                title="Operador (chofer): no es un asiento de pasajero"
                className="flex flex-col items-center justify-center rounded-lg border-2 border-slate-700 bg-slate-800 text-white"
              >
                <SteeringWheelIcon className={isSmall ? "h-3.5 w-3.5" : "h-5 w-5"} />
                {!isSmall && (
                  <span className="mt-0.5 text-[7px] font-bold tracking-tight uppercase sm:text-[9px] sm:tracking-wide">
                    Operador
                  </span>
                )}
              </div>
            );
          }

          return (
            <div
              key={`wc-${item.row}-${item.col}`}
              style={place(item)}
              title="Sanitario"
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-sky-300 bg-sky-50 text-sky-600"
            >
              <Toilet className={isSmall ? "h-3.5 w-3.5" : "h-5 w-5"} aria-hidden />
              <span className={cn("font-bold", isSmall ? "text-[8px]" : "text-[10px]")}>WC</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Asiento de vista previa (no interactivo): pasajero en blanco, staff en ámbar. */
export function PreviewSeat({ seat }: { seat: LayoutSeat }) {
  const isStaff = seat.kind === "STAFF";
  return (
    <div
      title={isStaff ? `Asiento ${seat.label} · Staff` : `Asiento ${seat.label}`}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-md border text-[9px] font-bold",
        isStaff
          ? "border-amber-400 bg-amber-100 text-amber-800"
          : "border-slate-300 bg-white text-slate-500",
      )}
    >
      {isStaff ? "S" : seat.label}
    </div>
  );
}
