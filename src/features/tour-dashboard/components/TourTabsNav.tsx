import { Users, Bus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VehicleOutput } from "@/features/tour-dashboard/schemas/tour-dashboard.schema";

interface TourTabsNavProps {
  activeTab: "passengers" | "seatmap";
  totalPassengers: number;
  assignedSeatsCount: number;
  requiresSeats?: boolean;
  vehicle?: VehicleOutput | null;
  onTabChange: (tab: "passengers" | "seatmap") => void;
}

export function TourTabsNav({
  activeTab,
  requiresSeats,
  totalPassengers,
  assignedSeatsCount,
  vehicle,
  onTabChange,
}: TourTabsNavProps) {
  const getSeatmapLabel = () => {
    if (!vehicle) return "Croquis de Asientos (Sin vehículo)";
    // Asientos de pasajero (sin operador ni asientos de staff), calculados por la API.
    return `Mapa de Asientos • ${vehicle.name} (${vehicle.capacity.passenger})`;
  };

  return (
    <div className="flex w-full items-center">
      <div className="grid w-full grid-cols-1 gap-1 rounded-2xl bg-slate-100/80 p-1.5 sm:grid-cols-2 md:flex md:w-auto md:gap-0">
        <button
          onClick={() => onTabChange("passengers")}
          className={cn(
            "flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all",
            activeTab === "passengers"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800",
          )}
        >
          <Users className="mr-2 h-4 w-4" />
          Lista de Pasajeros y Reservas
          <span className="ml-1.5 rounded-full bg-slate-200/60 px-2 py-0.5 text-xs text-slate-600">
            {totalPassengers}
          </span>
        </button>

        {requiresSeats && (
          <button
            onClick={() => onTabChange("seatmap")}
            className={cn(
              "flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all",
              activeTab === "seatmap"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800",
            )}
          >
            <Bus className="mr-2 h-4 w-4" />
            {getSeatmapLabel()}
            <span className="ml-1.5 rounded-full bg-slate-200/60 px-2 py-0.5 text-xs text-slate-600">
              {assignedSeatsCount}/{totalPassengers}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
