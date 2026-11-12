import { Bus, RefreshCw, Info } from "lucide-react";
import { SeatMapCanvas } from "@/features/tours/components/SeatMapCanvas";
import { getInitials } from "@/shared/utils/travelers-helpers";
import type { FlattenedPassenger, VehicleOutput } from "../../schemas/tour-dashboard.schema";
import { PASSENGER_ROLE_DICT } from "@/shared/utils/config/status-dictionaries.config";

interface VehicleAssignedViewProps {
  tourId: string;
  vehicle: VehicleOutput;
  assignedSeatsCount: number;
  staffCapacity: number;
  unassignedEligibles: FlattenedPassenger[];
  allEligiblePassengers: FlattenedPassenger[];
  pendingSeatPassengerId: string | null;
  onChangeVehicleClick: () => void;
  onSelectPassenger: (id: string) => void;
}

export function VehicleAssignedView({
  tourId,
  vehicle,
  assignedSeatsCount,
  staffCapacity,
  unassignedEligibles,
  allEligiblePassengers,
  pendingSeatPassengerId,
  onChangeVehicleClick,
  onSelectPassenger,
}: VehicleAssignedViewProps) {
  const { passenger: capacity, staff: staffSeats } = vehicle.capacity;

  return (
    <div className="animate-in fade-in flex flex-col gap-4 duration-300">
      {/* Resumen de la Unidad */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <Bus className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900">{vehicle.name}</span>
            <span className="text-xs font-medium text-slate-500">
              {assignedSeatsCount} ocupados de {capacity}
              {staffSeats > 0 ? ` · ${staffSeats} staff` : ""}
            </span>
          </div>
        </div>
        <button
          onClick={onChangeVehicleClick}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 active:scale-95"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Cambiar</span>
        </button>
      </div>

      {/* Carrusel de Faltantes por Acomodar */}
      {unassignedEligibles.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 px-1">
            <Info className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-700">
              Faltan por acomodar: {unassignedEligibles.length}
            </span>
          </div>

          <div className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pl-1">
            {unassignedEligibles.map((p) => {
              const isSelected = pendingSeatPassengerId === p.id;
              return (
                <div
                  key={p.id}
                  className={`flex w-64 shrink-0 snap-start flex-col gap-2 rounded-xl border p-3 shadow-sm transition-colors ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                      {getInitials(p.fullName)}
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-bold text-slate-900">
                        {p.fullName}
                      </span>
                      <span className="truncate text-[10px] text-slate-500">
                        {PASSENGER_ROLE_DICT[p.role]}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectPassenger(p.id)}
                    className={`flex h-10 w-full items-center justify-center rounded-lg text-sm font-semibold transition-all active:scale-95 ${
                      isSelected
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {isSelected ? "Toca un asiento libre" : "Seleccionar"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Croquis de Asientos */}
      <div className="flex justify-center overflow-x-auto rounded-2xl border border-slate-200/80 bg-slate-50/50 py-4 shadow-inner">
        <SeatMapCanvas
          tourId={tourId}
          layoutMap={vehicle.layoutMap}
          activePassengers={allEligiblePassengers}
          initialSelectedPassengerId={pendingSeatPassengerId}
          staffCapacity={staffCapacity}
        />
      </div>
    </div>
  );
}
