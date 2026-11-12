import { Flame, Users } from "lucide-react";
import type { PublicTourOutput } from "../public-tour.schema";

interface BrochureAvailabilityProps {
  availability: PublicTourOutput["availability"];
}

export function BrochureAvailability({ availability }: BrochureAvailabilityProps) {
  const { sellableCapacity, occupiedSeats, availableSeats } = availability;
  const isSoldOut = availableSeats <= 0;
  const occupiedPercentage =
    sellableCapacity > 0
      ? Math.min(100, Math.round((occupiedSeats / sellableCapacity) * 100))
      : 100;
  const isAlmostFull = !isSoldOut && availableSeats <= Math.max(1, sellableCapacity * 0.2);

  const headline = isSoldOut
    ? "Cupo agotado"
    : availableSeats === 1
      ? "¡Solo queda 1 lugar!"
      : isAlmostFull
        ? `¡Solo quedan ${availableSeats} lugares!`
        : `Quedan ${availableSeats} lugares`;

  const barColor = isSoldOut ? "bg-red-500" : isAlmostFull ? "bg-amber-500" : "bg-emerald-500";
  const accent = isSoldOut
    ? "bg-red-50 text-red-600"
    : isAlmostFull
      ? "bg-amber-50 text-amber-600"
      : "bg-emerald-50 text-emerald-600";

  return (
    <section
      aria-label="Disponibilidad de lugares"
      className="space-y-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${accent}`}>
          {isAlmostFull ? <Flame className="h-4 w-4" /> : <Users className="h-4 w-4" />}
        </div>
        <div>
          <h3 className="text-base leading-tight font-bold text-slate-900">{headline}</h3>
          <p className="text-xs text-slate-500">
            {occupiedSeats} de {sellableCapacity} lugares reservados
          </p>
        </div>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={sellableCapacity}
        aria-valuenow={occupiedSeats}
        aria-label="Lugares reservados"
        className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${occupiedPercentage}%` }}
        />
      </div>
    </section>
  );
}
