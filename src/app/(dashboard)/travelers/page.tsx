"use client";

import { useState } from "react";
import { Search, UserPlus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TravelersTable } from "@/features/travelers/components/TravelersTable";
import { useDeleteTraveler, useTravelers } from "@/features/travelers/hooks/useTravelers";
import type { TravelerOutput } from "@/features/travelers/schemas/traveler.schema";
import { EditTravelerDrawer } from "@/features/travelers/components/EditTravelerDrawer";
import { TravelerHistoryDrawer } from "@/features/travelers/components/TravelerHistoryDrawer";

export default function TravelersPage() {
  const { data: travelers = [], isLoading } = useTravelers();
  const [searchQuery, setSearchQuery] = useState("");
  const { mutateAsync: deleteTraveler } = useDeleteTraveler();

  // Estado para controlar el viajero seleccionado para edición en el Drawer
  const [selectedTravelerToEdit, setSelectedTravelerToEdit] = useState<TravelerOutput | null>(null);

  const [selectedTraveler, setSelectedTraveler] = useState<TravelerOutput | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [historyTravelerId, setHistoryTravelerId] = useState<string | null>(null);

  // Al hacer click en Editar desde la tabla:
  const handleEdit = (traveler: TravelerOutput) => {
    setSelectedTraveler(traveler);
    setIsDrawerOpen(true);
  };

  const filteredTravelers = travelers?.filter(
    (t) =>
      t.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.whatsappPhone?.includes(searchQuery) ||
      t.email?.toLowerCase().includes(searchQuery.toLowerCase()), // Ojo: email puede ser null, agregué optional chaining
  );

  const handleEditTraveler = (traveler: TravelerOutput) => {
    setSelectedTravelerToEdit(traveler); // Abre el drawer inyectando el objeto
  };

  const handleDeleteTraveler = async (travelerId: string) => {
    await deleteTraveler(travelerId);
  };

  return (
    <main className="container mx-auto space-y-6 px-4 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Directorio de Viajeros
          </h1>
          <p className="mt-1 text-slate-500">
            Base de datos global de clientes, historial médico y contactos de emergencia.
          </p>
        </div>
      </div>

      <div className="flex max-w-md items-center gap-2">
        <div className="relative w-full">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, WhatsApp o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <TravelersTable
        travelers={filteredTravelers}
        isLoading={isLoading}
        onEdit={handleEditTraveler}
        onDelete={handleDeleteTraveler}
        onViewHistory={setHistoryTravelerId} // 👈 Pasamos el nuevo setter a la tabla
      />

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
