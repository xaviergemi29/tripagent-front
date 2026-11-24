import { Users, Bus, Bed, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VehicleOutput } from "@/features/tour-dashboard/schemas/tour-dashboard.schema";
import type { DashboardTab } from "@/features/tour-dashboard/constants/dashboard-tabs";

interface TourTabsNavProps {
  activeTab: DashboardTab;
  totalPassengers: number;
  assignedSeatsCount: number;
  requiresSeats?: boolean;
  /** Tour de varios días: muestra la pestaña Hospedaje. */
  showLodging?: boolean;
  lodgingPendingCount?: number;
  vehicle?: VehicleOutput | null;
  onTabChange: (tab: DashboardTab) => void;
}

export function TourTabsNav({
  activeTab,
  requiresSeats,
  showLodging,
  lodgingPendingCount = 0,
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

        {showLodging && (
          <button
            onClick={() => onTabChange("lodging")}
            className={cn(
              "flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all",
              activeTab === "lodging"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800",
            )}
          >
            <Bed className="mr-2 h-4 w-4" />
            Hospedaje
            {lodgingPendingCount > 0 && (
              <span className="ml-1.5 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                {lodgingPendingCount} pendientes
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => onTabChange("boarding")}
          className={cn(
            "flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all",
            activeTab === "boarding"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800",
          )}
        >
          <ClipboardCheck className="mr-2 h-4 w-4" />
          Abordaje
        </button>
      </div>
    </div>
  );
}
