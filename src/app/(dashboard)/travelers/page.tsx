"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, ArrowRight } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDeleteTraveler, useTravelers } from "@/features/travelers/hooks/useTravelers";
import type { TravelerOutput } from "@/features/travelers/schemas/traveler.schema";
import { EditTravelerDrawer } from "@/features/travelers/components/EditTravelerDrawer";
import { TravelerHistoryDrawer } from "@/features/travelers/components/TravelerHistoryDrawer";
import { TravelersTable } from "@/features/travelers/components/TravelersTable";

export default function TravelersPage() {
  const router = useRouter();
  const { data: travelers = [], isLoading } = useTravelers();
  const [searchQuery, setSearchQuery] = useState("");
  const { mutateAsync: deleteTraveler } = useDeleteTraveler();

  const [selectedTravelerToEdit, setSelectedTravelerToEdit] = useState<TravelerOutput | null>(null);
  const [historyTravelerId, setHistoryTravelerId] = useState<string | null>(null);

  const filteredTravelers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return travelers;

    return travelers.filter(
      (t) =>
        t.fullName?.toLowerCase().includes(query) ||
        t.whatsappPhone?.includes(query) ||
        t.email?.toLowerCase().includes(query),
    );
  }, [travelers, searchQuery]);

  const handleEditTraveler = (traveler: TravelerOutput): void => {
    setSelectedTravelerToEdit(traveler);
  };

  const handleDeleteTraveler = async (travelerId: string): Promise<void> => {
    await deleteTraveler(travelerId);
  };

  const totalTravelers = travelers.length;
  const hasTravelers = totalTravelers > 0;

  return (
    <main className="container mx-auto space-y-6 px-4 py-8">
      {/* 1. Cabecera Principal + Contador Minimalista */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            MÓDULO DE PASAJEROS
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Directorio de Viajeros
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Base de datos de pasajeros registrados en tus tours.
          </p>
        </div>

        {/* Chip Minimalista de Contador */}
        <div className="flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 sm:self-auto">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          <span>
            Total:{" "}
            <strong className="font-semibold text-slate-900">{totalTravelers} viajeros</strong>
          </span>
        </div>
      </div>

      {/* 2. Caja de Búsqueda (Solo si existen viajeros en la BD) */}
      {hasTravelers && (
        <div className="relative mb-6 w-full max-w-2xl">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 rounded-xl border-slate-200 bg-white pl-10 text-sm shadow-none placeholder:text-slate-400 focus-visible:border-indigo-600 focus-visible:ring-indigo-600"
          />
        </div>
      )}

      {/* 3. Renderizado Condicional: Table vs Empty State Principal */}
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
          isFiltered={searchQuery.trim().length > 0}
          onEdit={handleEditTraveler}
          onDelete={handleDeleteTraveler}
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
