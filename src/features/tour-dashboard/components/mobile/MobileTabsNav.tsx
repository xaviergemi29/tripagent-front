import { Users, Armchair, Bed, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardTab } from "@/features/tour-dashboard/constants/dashboard-tabs";

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
  // "Abordaje" siempre está: la barra se muestra en todo tour.
  const tabCount = 2 + (requiresSeats ? 1 : 0) + (showLodging ? 1 : 0);
  return (
    <div
      className={cn(
        "grid gap-1 rounded-xl bg-slate-100 p-1 text-sm font-semibold",
        tabCount === 3 ? "grid-cols-3" : "grid-cols-2",
      )}
    >
      <button
        onClick={() => onTabChange("passengers")}
        className={cn(
          "flex items-center justify-center gap-2 rounded-lg py-2.5 transition-all",
          activeTab === "passengers"
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-500 hover:text-slate-700",
        )}
      >
        <Users className="h-4 w-4" />
        <span className="truncate">Pasajeros ({totalPassengers})</span>
      </button>

      {requiresSeats && (
        <button
          onClick={() => onTabChange("seatmap")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg py-2.5 transition-all",
            activeTab === "seatmap"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          <Armchair className="h-4 w-4" />
          <span className="truncate">
            Asientos ({assignedCount}/{totalBookedPax})
          </span>
        </button>
      )}

      {showLodging && (
        <button
          onClick={() => onTabChange("lodging")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg py-2.5 transition-all",
            activeTab === "lodging"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          <Bed className="h-4 w-4" />
          <span className="truncate">Hospedaje</span>
          {lodgingPendingCount > 0 && (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
              {lodgingPendingCount} pendientes
            </span>
          )}
        </button>
      )}
      <button
        onClick={() => onTabChange("boarding")}
        className={cn(
          "flex items-center justify-center gap-2 rounded-lg py-2.5 transition-all",
          activeTab === "boarding"
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-500 hover:text-slate-700",
        )}
      >
        <ClipboardCheck className="h-4 w-4" />
        <span className="truncate">Abordaje</span>
      </button>
    </div>
  );
}
