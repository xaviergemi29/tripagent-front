import { VehicleLayoutGrid } from "@/features/vehicles/components/VehicleLayoutGrid";
import type { LayoutMap } from "@/features/vehicles/schemas/vehicle.schema";
import { cn } from "@/lib/utils";
import { STAFF_SEAT_RIGHT_STATUS } from "../schemas/staff-share.schema";
import type { StaffShareSeat } from "../utils/staff-share-view.util";

interface StaffShareSeatMapProps {
  layoutMap: LayoutMap;
  seatsByLabel: Map<string, StaffShareSeat>;
  /** Etiquetas que cumplen el filtro/búsqueda; `null` = sin filtro. El resto se atenúa. */
  highlightedLabels: Set<string> | null;
}

const SEAT_BASE =
  "flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-md border px-0.5 text-center leading-tight transition-opacity";

function SeatCell({ seat, dimmed }: { seat: StaffShareSeat | undefined; dimmed: boolean }) {
  if (!seat) return null;
  const dim = dimmed && "opacity-25";

  if (seat.status === "STAFF") {
    return (
      <div
        title={`Asiento ${seat.label} · Staff`}
        className={cn(SEAT_BASE, "border-slate-500 bg-slate-200 text-slate-700", dim)}
      >
        <span className="text-[10px] font-bold">{seat.label}</span>
        <span className="text-[8px] font-semibold uppercase">Staff</span>
      </div>
    );
  }

  if (!seat.row) {
    return (
      <div
        title={`Asiento ${seat.label} · Libre`}
        className={cn(SEAT_BASE, "border-slate-200 bg-slate-50 text-slate-400", dim)}
      >
        <span className="text-[10px] font-bold">{seat.label}</span>
      </div>
    );
  }

  const { passenger, shortName, point } = seat.row;
  const isPending = passenger.seatRightStatus === STAFF_SEAT_RIGHT_STATUS.PENDING_DEPOSIT;

  return (
    <div
      title={`${passenger.fullName} · ${isPending ? "Pendiente de anticipo" : "Confirmado"}`}
      data-seat-status={isPending ? "PENDING_DEPOSIT" : "CONFIRMED"}
      className={cn(
        SEAT_BASE,
        isPending
          ? "border-2 border-dashed border-amber-500 bg-amber-50 text-amber-900"
          : "border-emerald-500 bg-emerald-50 text-emerald-900",
        dim,
      )}
    >
      <span className="text-[10px] font-bold">
        {seat.label}
        {point && <span className="ml-0.5 text-[8px]">[{point.code}]</span>}
      </span>
      <span className="w-full truncate text-[9px] font-medium">{shortName}</span>
    </div>
  );
}

/** Croquis de solo lectura: "12 [P1] / Ana T."; pendiente de anticipo con borde ámbar punteado. */
export function StaffShareSeatMap({
  layoutMap,
  seatsByLabel,
  highlightedLabels,
}: StaffShareSeatMapProps) {
  return (
    // Scroll horizontal propio: un autobús de 5 columnas nunca debe ensanchar la página.
    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mx-auto w-fit">
        <VehicleLayoutGrid
          layoutMap={layoutMap}
          renderSeat={(layoutSeat) => (
            <SeatCell
              seat={seatsByLabel.get(layoutSeat.label)}
              dimmed={highlightedLabels !== null && !highlightedLabels.has(layoutSeat.label)}
            />
          )}
        />
      </div>

      <ul
        aria-label="Leyenda del croquis"
        className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[11px] text-slate-600"
      >
        <LegendItem swatch="border-emerald-500 bg-emerald-50" text="Confirmado" />
        <LegendItem
          swatch="border-2 border-dashed border-amber-500 bg-amber-50"
          text="Pendiente de anticipo"
        />
        <LegendItem swatch="border-slate-200 bg-slate-50" text="Libre" />
        <LegendItem swatch="border-slate-500 bg-slate-200" text="Staff" />
      </ul>
    </div>
  );
}

function LegendItem({ swatch, text }: { swatch: string; text: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span className={cn("h-3.5 w-3.5 rounded border", swatch)} aria-hidden />
      {text}
    </li>
  );
}
