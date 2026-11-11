import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { StatusFilter, DestinationFilter } from "../hooks/useTourFilters";

interface TourFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (val: StatusFilter) => void;
  destinationFilter: DestinationFilter;
  setDestinationFilter: (val: DestinationFilter) => void;
  counts: Record<string, number>;
}

export function TourFilters(props: TourFiltersProps) {
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    destinationFilter,
    setDestinationFilter,
    counts,
  } = props;

  return (
    <div className="flex flex-col gap-3">
      {/* Buscador ancho completo en móvil */}
      <div className="relative w-full md:w-96">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="text"
          placeholder="Buscar por tour o destino..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-10 w-full rounded-xl border-slate-200 bg-white pl-9 text-sm shadow-sm focus-visible:ring-indigo-500"
        />
      </div>

      {/* Píldoras con overflow táctil */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 text-sm">
        <div className="flex shrink-0 rounded-lg bg-slate-100 p-1">
          {(["ALL", "UPCOMING", "IN_PROGRESS", "COMPLETED"] as StatusFilter[]).map((status) => {
            const labelMap = {
              ALL: "Todos",
              UPCOMING: "Próximos",
              IN_PROGRESS: "En curso",
              COMPLETED: "Finalizados",
            };
            const countKeyMap = {
              ALL: "all",
              UPCOMING: "upcoming",
              IN_PROGRESS: "inProgress",
              COMPLETED: "completed",
            };
            const isActive = statusFilter === status;

            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {labelMap[status]}
                <span className="rounded-full bg-slate-200/50 px-1.5 py-0.5 text-[10px] text-slate-500">
                  {counts[countKeyMap[status]]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 rounded-lg bg-slate-100 p-1">
          {(["ALL", "NATIONAL", "INTERNATIONAL"] as DestinationFilter[]).map((dest) => {
            const labelMap = {
              ALL: "Destino: Todos",
              NATIONAL: "Nacional (N)",
              INTERNATIONAL: "Internacional (I)",
            };
            const isActive = destinationFilter === dest;
            return (
              <button
                key={dest}
                onClick={() => setDestinationFilter(dest)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {dest === "NATIONAL" && "🟢 "}
                {dest === "INTERNATIONAL" && "🟣 "}
                {labelMap[dest]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
