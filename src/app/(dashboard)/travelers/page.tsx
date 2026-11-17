"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDeleteTraveler, useTravelers } from "@/features/travelers/hooks/useTravelers";
import { EditTravelerDrawer } from "@/features/travelers/components/EditTravelerDrawer";
import { TravelerHistoryDrawer } from "@/features/travelers/components/TravelerHistoryDrawer";
import { TravelersTable, TravelerTableRow } from "@/features/travelers/components/TravelersTable";
import { TravelersFilters } from "@/features/travelers/components/TravelersFilters";
import { useTravelersFilter } from "@/features/travelers/hooks/useTravelersFilter";
import { ArrowRight, Users } from "lucide-react";
import { TravelersMobileCardList } from "@/features/travelers/components/TravelersMobileCardList";
import { Button } from "@/components/ui/button";
import { QueryErrorState } from "@/components/shared/QueryErrorState";
import { GuidedTourButton } from "@/features/onboarding/components/GuidedTourButton";
import { TOUR_TARGET, TRAVELERS_GUIDED_TOUR } from "@/features/onboarding/constants/guided-tours";
import { useGuidedTour } from "@/features/onboarding/hooks/useGuidedTour";

export default function TravelersPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isFetching } = useTravelers();
  const travelers = data ?? [];
  // Falló sin datos: no es "Aún no hay viajeros registrados".
  const loadFailed = isError && !data;
  const { mutate: deleteTraveler } = useDeleteTraveler();

  const { searchQuery, setSearchQuery, activeFilter, setActiveFilter, filteredTravelers, counts } =
    useTravelersFilter(travelers);

  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingTraveler, setEditingTraveler] = useState<TravelerTableRow | null>(null);
  const [historyTravelerId, setHistoryTravelerId] = useState<string | null>(null);

  const handleEdit = (traveler: TravelerTableRow): void => {
    setEditingTraveler(traveler);
    setIsEditDrawerOpen(true);
  };

  const handleDelete = (id: string): void => {
    deleteTraveler(id);
  };

  const handleViewHistory = (id: string): void => {
    setHistoryTravelerId(id);
  };

  const isFiltered = searchQuery.length > 0 || activeFilter !== "all";
  const hasTravelers = travelers.length > 0;
  // Guía interactiva: se abre sola la primera vez, cuando ya cargó el directorio.
  const { start: startGuide } = useGuidedTour(TRAVELERS_GUIDED_TOUR, {
    autoStart: !isLoading && !loadFailed,
  });

  return (
    <main className="container mx-auto space-y-6 px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            MÓDULO DE PASAJEROS
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Directorio de Viajeros
          </h1>
        </div>
        <GuidedTourButton onClick={() => void startGuide()} className="self-start sm:self-auto" />
      </div>

      {loadFailed ? (
        <QueryErrorState
          resourceName="viajeros"
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      ) : !isLoading && !hasTravelers ? (
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
        <div className="space-y-4">
          <div data-tour={TOUR_TARGET.TRAVELERS_FILTERS}>
            <TravelersFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              counts={counts}
            />
          </div>

          <div className="hidden md:block" data-tour={TOUR_TARGET.TRAVELERS_LIST}>
            <TravelersTable
              travelers={filteredTravelers}
              isLoading={isLoading}
              isFiltered={isFiltered}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewHistory={handleViewHistory}
            />
          </div>

          <div className="block md:hidden" data-tour={TOUR_TARGET.TRAVELERS_LIST}>
            <TravelersMobileCardList
              travelers={filteredTravelers}
              isLoading={isLoading}
              isFiltered={isFiltered}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewHistory={handleViewHistory}
            />
          </div>
        </div>
      )}

      <EditTravelerDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        traveler={editingTraveler}
      />

      <TravelerHistoryDrawer
        travelerId={historyTravelerId}
        onClose={() => setHistoryTravelerId(null)}
      />
    </main>
  );
}
