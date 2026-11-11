import { Users, Armchair } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileTabsNavProps {
  activeTab: "passengers" | "seatmap";
  onTabChange: (tab: "passengers" | "seatmap") => void;
  totalPassengers: number;
  assignedCount: number;
  totalBookedPax: number;
  requiresSeats?: boolean;
}

export function MobileTabsNav({
  activeTab,
  requiresSeats,
  onTabChange,
  totalPassengers,
  assignedCount,
  totalBookedPax,
}: MobileTabsNavProps) {
  if (!requiresSeats) return null;
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
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
    </div>
  );
}
