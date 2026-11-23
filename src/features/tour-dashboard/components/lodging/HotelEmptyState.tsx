import { Bed, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface HotelEmptyStateProps {
  /** Pasajeros registrados del tour que aún no tienen habitación asignada. */
  unassignedPassengersCount: number;
  /** Habitaciones sugeridas; sin dato de parejas se estima con dobles individuales. */
  suggestedBreakdown?: {
    matrimoniales: number;
    doblesIndividuales: number;
  };
  /** Sin callback (Modo Auditoría o Solo Lectura) el botón no se muestra. */
  onAddHotelClick?: () => void;
}

export function HotelEmptyState({
  unassignedPassengersCount,
  suggestedBreakdown,
  onAddHotelClick,
}: HotelEmptyStateProps) {
  const breakdown = suggestedBreakdown ?? {
    matrimoniales: 0,
    doblesIndividuales: Math.ceil(unassignedPassengersCount / 2),
  };

  return (
    <div className="w-full py-6">
      <div className="mx-auto flex max-w-4xl flex-col items-center rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm md:rounded-3xl md:p-16">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-inner">
          <Bed className="h-10 w-10" aria-hidden="true" />
        </div>

        <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
          Aún no hay hospedaje configurado para este tour
        </h2>

        <p className="mb-6 max-w-xl text-sm leading-relaxed text-slate-600 md:text-base">
          {unassignedPassengersCount > 0 ? (
            <>
              Tienes{" "}
              <span className="font-semibold text-slate-800">
                {unassignedPassengersCount} pasajeros registrados
              </span>{" "}
              esperando asignación. Registra las habitaciones que consultaste o confirmaste con el
              hotel para empezar a distribuirlos.
            </>
          ) : (
            "Registra las habitaciones que consultaste o confirmaste con el hotel para empezar a asignar a tus viajeros cuando se registren."
          )}
        </p>

        {unassignedPassengersCount > 0 && (
          <div className="mb-8 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-indigo-200/70 bg-indigo-50/70 px-4 py-2 text-xs font-medium text-indigo-950 md:text-sm">
            <Bed className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
            <span>
              <strong className="font-semibold">
                {unassignedPassengersCount} pasajeros sin cuarto
              </strong>
              {" · "}
              Sugerido: {breakdown.matrimoniales} Matrimoniales y {breakdown.doblesIndividuales}{" "}
              Dobles Individuales
            </span>
          </div>
        )}

        {onAddHotelClick && (
          <Button
            type="button"
            onClick={onAddHotelClick}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-6 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-[0.99] md:text-base"
          >
            <PlusCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>Agregar primer hotel y habitaciones</span>
          </Button>
        )}
      </div>
    </div>
  );
}
