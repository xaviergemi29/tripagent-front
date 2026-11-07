"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeleteTraveler, useTravelers } from "@/features/travelers/hooks/useTravelers";
import type { TravelerOutput } from "@/features/travelers/schemas/traveler.schema";
import { EditTravelerDrawer } from "@/features/travelers/components/EditTravelerDrawer";
import { TravelerHistoryDrawer } from "@/features/travelers/components/TravelerHistoryDrawer";
import { TravelersTable } from "@/features/travelers/components/TravelersTable";
import {
  TravelersFilters,
  TravelerFilterType,
} from "@/features/travelers/components/TravelersFilters";

export default function TravelersPage() {
  const router = useRouter();
  const { data: travelers = [], isLoading } = useTravelers();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<TravelerFilterType>("all");
  const { mutateAsync: deleteTraveler } = useDeleteTraveler();

  const [selectedTravelerToEdit, setSelectedTravelerToEdit] = useState<TravelerOutput | null>(null);
  const [historyTravelerId, setHistoryTravelerId] = useState<string | null>(null);

  const counts = useMemo(() => {
    return {
      all: travelers.length,
      national: travelers.filter((t) => t.hasNationalTrips).length,
      international: travelers.filter((t) => t.hasInternationalTrips).length,
    };
  }, [travelers]);

  const filteredTravelers = useMemo(() => {
    let result = travelers;

    if (activeFilter === "national") {
      result = result.filter((t) => t.hasNationalTrips);
    } else if (activeFilter === "international") {
      result = result.filter((t) => t.hasInternationalTrips);
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (t) =>
          t.fullName?.toLowerCase().includes(query) ||
          t.whatsappPhone?.includes(query) ||
          t.email?.toLowerCase().includes(query),
      );
    }

    return result;
  }, [travelers, searchQuery, activeFilter]);

  const hasTravelers = travelers.length > 0;

  return (
    <main className="container mx-auto space-y-6 px-4 py-8">
      <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            MÓDULO DE PASAJEROS
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Directorio de Viajeros
          </h1>
        </div>
      </div>

      {hasTravelers && (
        <TravelersFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={counts}
        />
      )}

      {/* Renderizado Condicional del Empty State vs Tabla */}
      {!isLoading && !hasTravelers ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <Users className="h-7 w-7 stroke-[1.75]" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-slate-900">
            Aún no hay viajeros registrados
          </h3>
          <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-slate-500">
            Los viajeros aparecerán aquí automáticamente conforme se registren en tus tours.
          </p>
          <Button
            onClick={() => router.push("/tours")}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <span>Ir a Mis Viajes</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <TravelersTable
          travelers={filteredTravelers}
          isLoading={isLoading}
          isFiltered={searchQuery.trim().length > 0 || activeFilter !== "all"}
          onEdit={setSelectedTravelerToEdit}
          onDelete={deleteTraveler}
          onViewHistory={setHistoryTravelerId}
        />
      )}

      <EditTravelerDrawer
        traveler={selectedTravelerToEdit}
        isOpen={!!selectedTravelerToEdit}
        onClose={() => setSelectedTravelerToEdit(null)}
      />

      <TravelerHistoryDrawer
        travelerId={historyTravelerId}
        onClose={() => setHistoryTravelerId(null)}
      />
    </main>
  );
}
