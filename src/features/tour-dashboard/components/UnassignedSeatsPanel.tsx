import { useState } from "react";
import { Info, X, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getInitials } from "@/shared/utils/travelers-helpers";

interface UnassignedPassenger {
  id: string;
  fullName: string;
  role: "TITULAR" | "COMPANION";
  paxCount: number;
}

interface UnassignedSeatsPanelProps {
  unassignedPassengers: UnassignedPassenger[];
  onSelectPassenger: (id: string) => void;
  selectedPassengerId: string | null;
}

export function UnassignedSeatsPanel({
  unassignedPassengers,
  onSelectPassenger,
  selectedPassengerId,
}: UnassignedSeatsPanelProps) {
  const [showHelpTooltip, setShowHelpTooltip] = useState(true);

  return (
    <div className="flex h-[600px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-4">
        <h3 className="text-sm font-semibold text-slate-800">Faltan por acomodar</h3>
        <Badge variant="outline" className="border-amber-200 bg-amber-100 text-xs text-amber-800">
          {unassignedPassengers.length}
        </Badge>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Tarjeta Descartable */}
        {showHelpTooltip && unassignedPassengers.length > 0 && (
          <div className="relative flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <p className="pr-4">
              Selecciona un pasajero y posteriormente presiona cualquier número de asiento
              disponible en el croquis.
            </p>
            <button
              onClick={() => setShowHelpTooltip(false)}
              className="absolute top-2 right-2 rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Listado o Empty State */}
        {unassignedPassengers.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="mb-3 rounded-full bg-emerald-100 p-3 text-emerald-600 shadow-sm">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h4 className="font-semibold text-slate-800">¡Todos tienen asiento asignado!</h4>
            <p className="mt-1 text-xs text-slate-500">
              Has acomodado a todos los pasajeros elegibles.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {unassignedPassengers.map((passenger) => {
              const isSelected = selectedPassengerId === passenger.id;
              return (
                <button
                  key={passenger.id}
                  onClick={() => onSelectPassenger(passenger.id)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-600"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                    {getInitials(passenger.fullName)}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold text-slate-900">
                      {passenger.fullName}
                    </span>
                    <span className="text-xs text-slate-500">
                      {passenger.role === "TITULAR" ? "Titular" : "Acompañante"} •{" "}
                      {passenger.paxCount || 1} Pasajero
                    </span>
                  </div>
                  {!isSelected && (
                    <span className="shrink-0 text-[10px] font-medium text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100">
                      Asignar →
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
