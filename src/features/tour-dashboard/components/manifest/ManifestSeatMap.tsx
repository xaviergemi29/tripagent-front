import { VehicleLayoutGrid } from "@/features/vehicles/components/VehicleLayoutGrid";
import type { LayoutMap } from "@/features/vehicles/schemas/vehicle.schema";
import { cn } from "@/lib/utils";
import { formatPickupTime } from "@/shared/utils/tour-date.util";
import type { BoardingSheet, SheetSeat } from "../../utils/boarding-sheet.util";

interface ManifestSeatMapProps {
  layoutMap: LayoutMap;
  sheet: BoardingSheet;
}

const SEAT_BASE =
  "flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-md border px-0.5 text-center leading-tight";

function PrintSeat({ seat }: { seat: SheetSeat | undefined }) {
  if (!seat) return null;

  if (seat.status === "STAFF") {
    return (
      <div className={cn(SEAT_BASE, "border-amber-500 bg-amber-100 text-amber-900")}>
        <span className="text-[9px] font-bold">{seat.label}</span>
        <span className="text-[8px] font-semibold uppercase">Staff</span>
      </div>
    );
  }

  if (seat.status === "FREE") {
    return (
      <div className={cn(SEAT_BASE, "border-dashed border-slate-400 bg-white text-slate-500")}>
        <span className="text-[9px] font-bold">{seat.label}</span>
        <span className="text-[8px]">Libre</span>
      </div>
    );
  }

  return (
    <div className={cn(SEAT_BASE, "border-slate-700 bg-slate-100 text-black")}>
      <span className="text-[9px] font-bold">
        {seat.label}
        {seat.point && <span className="ml-0.5 text-[8px]">[{seat.point.code}]</span>}
      </span>
      <span className="w-full truncate text-[8px] font-medium">{seat.shortName ?? "Ocupado"}</span>
    </div>
  );
}

/** Croquis del vehículo para imprimir: "12 [P1] / Ana T." en cada asiento ocupado. */
export function ManifestSeatMap({ layoutMap, sheet }: ManifestSeatMapProps) {
  return (
    <section aria-labelledby="manifest-seatmap-title" className="mb-4">
      <h2 id="manifest-seatmap-title" className="mb-2 text-base font-bold uppercase">
        Croquis del vehículo
      </h2>
      <div className="flex items-start gap-6">
        <VehicleLayoutGrid
          layoutMap={layoutMap}
          size="print"
          renderSeat={(layoutSeat) => <PrintSeat seat={sheet.seatsByLabel.get(layoutSeat.label)} />}
        />

        <div className="min-w-0 flex-1 text-xs">
          <h3 className="mb-1 font-bold uppercase">Puntos de abordaje</h3>
          <ul className="space-y-1">
            {sheet.points.map((point) => (
              <li key={point.code}>
                <span className="mr-1 inline-block rounded border border-slate-700 px-1 font-bold">
                  {point.code}
                </span>
                {point.location} · {formatPickupTime(point.time)}
              </li>
            ))}
          </ul>
          <h3 className="mt-4 mb-1 font-bold uppercase">Leyenda</h3>
          <ul className="space-y-1 text-[11px]">
            <li>Ocupado: número · [punto] · nombre</li>
            <li>Libre: asiento sin pasajero</li>
            <li>Staff: asiento reservado al personal</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
