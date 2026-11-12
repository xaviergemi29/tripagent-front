import { Button } from "@/components/ui/button";
import { Bus, RefreshCw } from "lucide-react";
import type { VehicleOutput } from "@/features/tour-dashboard/schemas/tour-dashboard.schema";

interface VehicleStatusBannerProps {
  vehicle?: VehicleOutput | null;
  onChangeVehicleClick: () => void;
}

export function VehicleStatusBanner({ vehicle, onChangeVehicleClick }: VehicleStatusBannerProps) {
  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
        <div className="rounded-full bg-indigo-50 p-4 text-indigo-600">
          <Bus className="h-8 w-8" />
        </div>
        <div>
          <span className="mb-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tracking-wider text-slate-600 uppercase">
            Distribución de Asientos Pendiente
          </span>
          <h3 className="text-lg font-bold text-slate-900">
            Aún no has asignado un vehículo a este viaje
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Asigna una plantilla para habilitar el croquis interactivo y organizar los lugares de
            tus pasajeros.
          </p>
        </div>
        <Button onClick={onChangeVehicleClick} className="mt-2 bg-indigo-600 hover:bg-indigo-700">
          <Bus className="mr-2 h-4 w-4" />
          Asignar Vehículo / Plantilla
        </Button>
      </div>
    );
  }

  const { passenger, staff } = vehicle.capacity;

  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row">
      <div className="flex items-center">
        <span className="mr-3 h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
        <span className="mr-2 text-sm text-slate-500">Vehículo asignado:</span>
        <span className="text-sm font-bold text-slate-900">
          {vehicle.name} ({passenger} pasajeros{staff > 0 ? ` + ${staff} staff` : ""})
        </span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onChangeVehicleClick}
        className="w-full gap-2 border-indigo-200 font-medium text-indigo-700 hover:bg-indigo-50 sm:w-auto"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Cambiar Vehículo
      </Button>
    </div>
  );
}
