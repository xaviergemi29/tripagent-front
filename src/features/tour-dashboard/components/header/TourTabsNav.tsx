import { Users, Bus, Bed, ClipboardCheck } from "lucide-react";
import type { VehicleOutput } from "@/features/tour-dashboard/schemas/tour-dashboard.schema";
import type { DashboardTab } from "@/features/tour-dashboard/constants/dashboard-tabs";
import { DashboardTabButton, DashboardTabList, tabCountClass } from "./DashboardTabsList";

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

  const tab = (id: DashboardTab) => ({
    isActive: activeTab === id,
    variant: "underline" as const,
    onSelect: () => onTabChange(id),
  });
  const countBadge = (id: DashboardTab) =>
    `rounded-full px-2 py-0.5 text-xs font-bold ${tabCountClass(activeTab === id, "underline")}`;

  return (
    <DashboardTabList
      label="Secciones del Centro de Control"
      className="flex w-full flex-col border-b border-slate-200 sm:flex-row sm:overflow-x-auto"
    >
      <DashboardTabButton {...tab("passengers")}>
        <Users className="h-4 w-4" aria-hidden="true" />
        Lista de Pasajeros y Reservas
        <span className={countBadge("passengers")}>{totalPassengers}</span>
      </DashboardTabButton>

      {requiresSeats && (
        <DashboardTabButton {...tab("seatmap")}>
          <Bus className="h-4 w-4" aria-hidden="true" />
          {getSeatmapLabel()}
          <span className={countBadge("seatmap")}>
            {assignedSeatsCount}/{totalPassengers}
          </span>
        </DashboardTabButton>
      )}

      {showLodging && (
        <DashboardTabButton {...tab("lodging")}>
          <Bed className="h-4 w-4" aria-hidden="true" />
          Hospedaje
          {lodgingPendingCount > 0 && (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
              {lodgingPendingCount} pendientes
            </span>
          )}
        </DashboardTabButton>
      )}

      <DashboardTabButton {...tab("boarding")}>
        <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
        Abordaje
      </DashboardTabButton>
    </DashboardTabList>
  );
}
