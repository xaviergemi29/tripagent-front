import { BusFront, User } from "lucide-react";
import { getInitials } from "@/shared/utils/travelers-helpers";

interface UnassignedPassenger {
  id: string;
  fullName: string;
}

interface NoVehicleViewProps {
  eligibleWaitingPassengers: UnassignedPassenger[];
  onOpenVehicleModal: () => void;
}

export function NoVehicleView({
  eligibleWaitingPassengers,
  onOpenVehicleModal,
}: NoVehicleViewProps) {
  return (
    <div className="animate-in fade-in space-y-4 duration-300">
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <BusFront className="h-8 w-8" />
        </div>

        <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          ● Distribución de Asientos Pendiente
        </span>

        <h3 className="text-lg leading-snug font-bold text-slate-900">
          Aún no has asignado un vehículo a este viaje
        </h3>

        <p className="mx-auto max-w-xs text-sm text-slate-600">
          Asigna una plantilla para habilitar el mapa interactivo y organizar los lugares de tus
          pasajeros.
        </p>

        <button
          onClick={onOpenVehicleModal}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 font-semibold text-white shadow-sm shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95"
        >
          <BusFront className="h-5 w-5" />
          Asignar Vehículo al Tour
        </button>

        <p className="text-xs text-slate-400">
          Plantillas disponibles en tu agencia: Sprinter (20 lugares), Autobús (47 lugares), etc.
        </p>
      </div>

      {eligibleWaitingPassengers.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <User className="h-4 w-4" />
            Pasajeros confirmados que esperan distribución ({eligibleWaitingPassengers.length})
          </h4>
          <div className="flex flex-col gap-2">
            {eligibleWaitingPassengers.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                  {getInitials(p.fullName)}
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-bold text-slate-900">{p.fullName}</span>
                  <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Liquidado o Abonado
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
