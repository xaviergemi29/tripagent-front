"use client";

import { useState } from "react";
import { useTourFilters } from "../hooks/useTourFilters";
import { useDeleteTour } from "../hooks/useTours";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { TourOutput } from "../schemas/tour.schema";
import { TourBannerInfo } from "./TourBannerInfo";
import { TourFilters } from "./TourFilters";
import { TourMobileCardList } from "./mobile/TourMobileCardList";
import { TourDesktopTable } from "./TourDesktopTable";

interface TourListTableProps {
  tours: TourOutput[];
  isLoading?: boolean;
}

export function TourListTable({ tours, isLoading = false }: TourListTableProps) {
  const { mutate: deleteTour } = useDeleteTour();
  const [tourToDelete, setTourToDelete] = useState<string | null>(null);

  const filters = useTourFilters(tours);

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-2xl border border-slate-100 bg-white p-8 text-center text-slate-500">
        Cargando operaciones...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TourBannerInfo />

      <TourFilters {...filters} />

      <div className="mt-4">
        {filters.filteredTours.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">
            No se encontraron salidas con los filtros actuales.
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <TourDesktopTable tours={filters.filteredTours} onDeleteRequest={setTourToDelete} />
            </div>
            <div className="block md:hidden">
              <TourMobileCardList tours={filters.filteredTours} onDeleteRequest={setTourToDelete} />
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!tourToDelete}
        onOpenChange={(open) => !open && setTourToDelete(null)}
        title="¿Eliminar este tour?"
        description="El tour dejará de aparecer en tus listados y su folleto público dejará de funcionar. Solo se puede eliminar si no tiene reservas activas ni dinero abonado: cancela y reembolsa primero desde el Centro de Control."
        confirmText="Sí, eliminar"
        onConfirm={() => {
          if (tourToDelete) {
            deleteTour(tourToDelete);
            setTourToDelete(null);
          }
        }}
        isDestructive={true}
      />
    </div>
  );
}
