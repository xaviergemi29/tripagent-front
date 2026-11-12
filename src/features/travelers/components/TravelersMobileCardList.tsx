"use client";

import { useState } from "react";
import { UserX } from "lucide-react";
import { TravelerCard } from "./TravelerCard";
import type { TravelerTableRow } from "./TravelersTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface TravelersMobileCardListProps {
  travelers: TravelerTableRow[];
  isLoading?: boolean;
  isFiltered?: boolean;
  onEdit: (traveler: TravelerTableRow) => void;
  onDelete: (id: string) => void;
  onViewHistory: (id: string) => void;
}

export function TravelersMobileCardList({
  travelers,
  isLoading,
  isFiltered,
  onEdit,
  onDelete,
  onViewHistory,
}: TravelersMobileCardListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3.5 px-3.5 py-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[240px] animate-pulse rounded-2xl bg-slate-200/50" />
        ))}
      </div>
    );
  }

  if (travelers.length === 0) {
    return (
      <div className="mx-3.5 my-3 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
        <UserX className="mb-3 h-10 w-10 text-slate-400" />
        {isFiltered ? (
          <p className="text-sm font-medium text-slate-700">No se encontraron viajeros.</p>
        ) : (
          <>
            <h3 className="mb-1 text-base font-semibold text-slate-900">
              Aún no hay viajeros registrados
            </h3>
            <p className="text-xs text-slate-500">
              Presiona &quot;Nuevo Viajero&quot; para comenzar.
            </p>
          </>
        )}
      </div>
    );
  }

  const handleConfirmDelete = (): void => {
    if (deletingId && onDelete) {
      onDelete(deletingId);
    }
    setDeletingId(null);
  };

  return (
    <>
      <div className="flex flex-col gap-3.5 px-3.5 py-3 pb-24">
        {travelers.map((traveler) => (
          <TravelerCard
            key={traveler.id}
            traveler={traveler}
            onEdit={onEdit}
            onDelete={(id) => setDeletingId(id)}
            onViewHistory={onViewHistory}
          />
        ))}
      </div>

      <ConfirmDialog
        isOpen={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Eliminar registro de viajero"
        description="¿Estás seguro que deseas remover a este pasajero? Esta acción no se puede deshacer."
        onConfirm={handleConfirmDelete}
        confirmText="Sí, eliminar"
        isDestructive={true}
      />
    </>
  );
}
