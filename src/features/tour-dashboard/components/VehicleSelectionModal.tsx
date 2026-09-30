import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAssignVehicleToTour, useVehicles } from "../hooks/useTourDashboard";

interface Props {
  tourId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function VehicleSelectionModal({ tourId, isOpen, onClose }: Props) {
  const { data: vehicles = [], isLoading } = useVehicles();
  const { mutate: assignVehicle, isPending } = useAssignVehicleToTour();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const handleSave = () => {
    if (!selectedVehicleId) return;
    assignVehicle({ tourId, vehicleId: selectedVehicleId }, { onSuccess: () => onClose() });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar Plantilla de Vehículo</DialogTitle>
          <DialogDescription>
            Selecciona la capacidad y distribución del transporte para este viaje.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {isLoading ? (
            <p className="text-center text-sm text-slate-500">Cargando plantillas...</p>
          ) : (
            <div className="flex flex-col gap-2">
              {vehicles.map((v: any) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVehicleId(v.id)}
                  className={`flex items-center justify-between rounded-lg border p-4 text-left transition-all ${
                    selectedVehicleId === v.id
                      ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <span className="font-semibold text-slate-800">{v.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedVehicleId || isPending}
            className="bg-indigo-600"
          >
            {isPending ? "Guardando..." : "Asignar y Continuar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
