"use client";

import { Search, Users, Globe2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

export type TravelerFilterType = "all" | "national" | "international";

interface TravelersFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: TravelerFilterType;
  onFilterChange: (filter: TravelerFilterType) => void;
  counts: {
    all: number;
    national: number;
    international: number;
  };
}

export function TravelersFilters({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  counts,
}: TravelersFiltersProps) {
  return (
    <div className="mb-5 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
      {/* Buscador de texto */}
      <div className="relative max-w-md flex-1">
        <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="text"
          placeholder="Buscar por nombre, teléfono o correo..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 rounded-xl border-slate-200 bg-white pl-10 text-xs placeholder:text-slate-400 focus-visible:ring-indigo-500"
        />
      </div>

      {/* Control Segmentado con Contadores */}
      <div className="flex items-center self-start rounded-xl border border-slate-200/80 bg-slate-100/90 p-1 sm:self-auto">
        <button
          type="button"
          onClick={() => onFilterChange("all")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            activeFilter === "all"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Users className="h-3.5 w-3.5 text-indigo-600" />
          <span>Todos</span>
          <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700">
            {counts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange("national")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            activeFilter === "national"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <MapPin className="h-3.5 w-3.5 text-emerald-600" />
          <span>Nacionales</span>
          <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700">
            {counts.national}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange("international")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            activeFilter === "international"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Globe2 className="h-3.5 w-3.5 text-indigo-600" />
          <span>Extranjero</span>
          <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700">
            {counts.international}
          </span>
        </button>
      </div>
    </div>
  );
}
