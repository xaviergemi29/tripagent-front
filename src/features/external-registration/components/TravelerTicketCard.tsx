import { Armchair, Clock, MapPin } from "lucide-react";
import { formatPickupTime } from "@/shared/utils/tour-date.util";

export interface TravelerTicketCardProps {
  /** Posición del viajero dentro del grupo (1 = titular). */
  index: number;
  isTitular: boolean;
  name: string;
  seatLabel: string | null;
  /** Punto de abordaje propio del viajero. `null` si aún no tiene uno. */
  boardingPoint: { location: string; time: string | null } | null;
}

/**
 * Boleto individual del pase de abordaje digital (Magic Link, estado PAID).
 * Componente de presentación: sin hooks, funciona en Server y Client Components.
 */
export function TravelerTicketCard({
  index,
  isTitular,
  name,
  seatLabel,
  boardingPoint,
}: TravelerTicketCardProps) {
  return (
    <article
      aria-label={`Boleto de ${name}`}
      className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
    >
      {/* Cabecera de rol */}
      <div className="flex items-center gap-2 bg-indigo-700 px-4 py-2.5 text-xs font-bold tracking-wider text-white uppercase">
        <span className="h-2 w-2 rounded-full bg-white/50" aria-hidden />
        <span>
          Viajero {index} • {isTitular ? "Titular" : "Acompañante"}
        </span>
      </div>

      {/* Pasajero y asiento */}
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <span className="block text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            Pasajero
          </span>
          <h3 className="text-base font-bold break-words text-slate-900 md:text-lg">{name}</h3>
        </div>
        {seatLabel ? (
          <span className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
            <Armchair className="h-3.5 w-3.5" aria-hidden />
            Asiento {seatLabel}
          </span>
        ) : (
          <span className="flex shrink-0 items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
            <Armchair className="h-3.5 w-3.5" aria-hidden />
            Por asignar
          </span>
        )}
      </div>

      {/* Muescas laterales y línea punteada (efecto boleto físico) */}
      <div className="relative flex items-center" aria-hidden>
        <span className="absolute -left-2.5 h-5 w-5 rounded-full border border-slate-200 bg-slate-50" />
        <span className="mx-4 w-full border-b-2 border-dashed border-slate-200" />
        <span className="absolute -right-2.5 h-5 w-5 rounded-full border border-slate-200 bg-slate-50" />
      </div>

      {/* Logística de abordaje propia del viajero */}
      <div className="space-y-3 p-4">
        <div className="flex items-start gap-2.5">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
          <div className="min-w-0">
            <span className="block text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              Punto de abordaje
            </span>
            <p className="text-sm font-bold break-words text-slate-900">
              {boardingPoint?.location || "Por confirmar con la agencia"}
            </p>
          </div>
        </div>

        {boardingPoint?.time && (
          <div className="flex items-start gap-2.5">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
            <div>
              <span className="block text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                Hora
              </span>
              <p className="text-base font-extrabold text-emerald-700">
                {formatPickupTime(boardingPoint.time)}
              </p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
