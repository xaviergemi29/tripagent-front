import { Users, Armchair, Bed, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardTab } from "@/features/tour-dashboard/constants/dashboard-tabs";
import {
  DashboardTabButton,
  DashboardTabList,
  tabCountClass,
} from "@/features/tour-dashboard/components/header/DashboardTabsList";

interface MobileTabsNavProps {
  activeTab: DashboardTab;
  totalPassengers: number;
  assignedCount: number;
  totalBookedPax: number;
  requiresSeats?: boolean;
  showLodging?: boolean;
  lodgingPendingCount?: number;
  onTabChange: (tab: DashboardTab) => void;
}

const GRID_COLUMNS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

export function MobileTabsNav({
  activeTab,
  requiresSeats,
  showLodging,
  lodgingPendingCount = 0,
  totalPassengers,
  assignedCount,
  totalBookedPax,
  onTabChange,
}: MobileTabsNavProps) {
  // "Abordaje" siempre está: la barra se muestra en todo tour (de 2 a 4 pestañas).
  const tabCount = 2 + (requiresSeats ? 1 : 0) + (showLodging ? 1 : 0);

  const tab = (id: DashboardTab) => ({
    isActive: activeTab === id,
    variant: "segment" as const,
    onSelect: () => onTabChange(id),
  });
  const countBadge = (id: DashboardTab) =>
    `rounded-full px-1.5 py-px text-[10px] font-bold ${tabCountClass(activeTab === id, "segment")}`;

  return (
    <DashboardTabList
      label="Secciones del Centro de Control"
      className={cn("grid gap-1 rounded-xl bg-slate-100 p-1", GRID_COLUMNS[tabCount])}
    >
      <DashboardTabButton {...tab("passengers")}>
        <Users className="h-4 w-4" aria-hidden="true" />
        <span className="max-w-full truncate">Pasajeros</span>
        <span className={countBadge("passengers")}>{totalPassengers}</span>
      </DashboardTabButton>

      {requiresSeats && (
        <DashboardTabButton {...tab("seatmap")}>
          <Armchair className="h-4 w-4" aria-hidden="true" />
          <span className="max-w-full truncate">Asientos</span>
          <span className={countBadge("seatmap")}>
            {assignedCount}/{totalBookedPax}
          </span>
        </DashboardTabButton>
      )}

      {showLodging && (
        <DashboardTabButton {...tab("lodging")}>
          <Bed className="h-4 w-4" aria-hidden="true" />
          <span className="max-w-full truncate">Hospedaje</span>
          {lodgingPendingCount > 0 && (
            <span className="rounded-full bg-rose-100 px-1.5 py-px text-[10px] font-bold text-rose-700">
              {lodgingPendingCount}
              <span className="sr-only"> pendientes</span>
            </span>
          )}
        </DashboardTabButton>
      )}

      <DashboardTabButton {...tab("boarding")}>
        <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
        <span className="max-w-full truncate">Abordaje</span>
      </DashboardTabButton>
    </DashboardTabList>
  );
}
