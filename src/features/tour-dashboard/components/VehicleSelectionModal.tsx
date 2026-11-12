"use client";

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
import { Bus, Car, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import {
  useAssignVehicleToTour,
  useVehicles,
} from "@/features/tour-dashboard/hooks/useTourDashboard";
import type { VehicleOutput } from "@/features/tour-dashboard/schemas/tour-dashboard.schema";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VehicleSelectionModalProps {
  tourId: string;
  isOpen: boolean;
  onClose: () => void;
  passengersCount: number;
  assignedSeatsCount: number;
  currentVehicle?: VehicleOutput | null;
  onSuccess?: () => void;
}

export function VehicleSelectionModal({
  tourId,
  isOpen,
  onClose,
  passengersCount,
  assignedSeatsCount,
  currentVehicle,
  onSuccess,
}: VehicleSelectionModalProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useVehicles();
  const { mutateAsync: assignVehicle, isPending: isSubmitting } = useAssignVehicleToTour();

  const getVehicleCapacity = (layoutMap: (string | null)[][]): number => {
    return layoutMap.flat().filter((cell) => cell && cell !== "AISLE").length;
  };

  const handleConfirmVehicle = async (): Promise<void> => {
    if (!selectedVehicleId) return;

    try {
      // Regla de Negocio: Si se cambia el vehículo y ya había asientos, los reseteamos.
      const resetOrphans = !!currentVehicle && assignedSeatsCount > 0;
      await assignVehicle({ tourId, vehicleId: selectedVehicleId, resetOrphans });
      toast.success("Vehículo asignado correctamente");
      onSuccess?.();
      onCloseModal();
    } catch (error) {
      toast.error("Error al asignar vehículo");
    }
  };

  const onCloseModal = (): void => {
    setSelectedVehicleId(null);
    onClose();
  };

  const title = currentVehicle
    ? "¿Deseas cambiar el vehículo del tour?"
    : "Asignar Vehículo al Tour";
  const confirmText = currentVehicle ? "Confirmar y Cambiar Vehículo" : "Asignar y Cargar Mapa";
  const isChangeWithSeats = !!currentVehicle && assignedSeatsCount > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCloseModal()}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-lg overflow-y-auto rounded-2xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Selecciona la plantilla con la distribución de asientos adecuada para la ruta.
          </DialogDescription>
        </DialogHeader>

        {currentVehicle && (
          <div className="mt-2 mb-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className="text-slate-700">
              Vehículo actual:{" "}
              <span className="font-semibold">
                {currentVehicle.name} ({getVehicleCapacity(currentVehicle.layoutMap)} lugares)
              </span>
            </p>
            <div className="flex justify-between text-slate-500">
              <span>Total de pasajeros registrados:</span>
              <span className="font-semibold text-slate-800">{passengersCount}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Total de asientos ocupados:</span>
              <span className="font-semibold text-slate-800">{assignedSeatsCount}</span>
            </div>
          </div>
        )}

        <div className="grid gap-3 py-2">
          <h4 className="mb-1 text-sm font-medium text-slate-700">Seleccionar Nuevo Vehículo</h4>
          {isLoadingVehicles ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            vehicles.map((v) => {
              const capacity = getVehicleCapacity(v.layoutMap);
              const isSelected = selectedVehicleId === v.id;

              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVehicleId(v.id)}
                  disabled={isSubmitting}
                  className={cn(
                    "relative flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all",
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "rounded-full p-2",
                        isSelected
                          ? "bg-indigo-100 text-indigo-600"
                          : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {capacity > 20 ? <Bus className="h-5 w-5" /> : <Car className="h-5 w-5" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">{v.name}</span>
                      <span className="text-xs text-slate-500">
                        {capacity} lugares · {v.layoutMap.length} filas
                      </span>
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 className="h-5 w-5 text-indigo-600" />}
                </button>
              );
            })
          )}
        </div>

        {/* ALERTA DE PÉRDIDA DE ASIENTOS */}
        {isChangeWithSeats && selectedVehicleId && selectedVehicleId !== currentVehicle.id && (
          <div className="animate-in fade-in mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <div className="space-y-1">
              <p className="leading-snug font-medium">
                Al cambiar el vehículo, los asientos asignados actualmente no se conservarán.
                Tendrás que asignar manualmente los asientos de los viajeros en el nuevo vehículo.
                ¿Deseas continuar?
              </p>
              <p className="text-xs font-semibold text-amber-700">
                Se reestablecerán {assignedSeatsCount} asiento(s) a estado pendiente.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row">
          <Button
            variant="outline"
            onClick={onCloseModal}
            disabled={isSubmitting}
            className="order-2 w-full rounded-xl sm:order-1 sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmVehicle}
            disabled={
              !selectedVehicleId || isSubmitting || selectedVehicleId === currentVehicle?.id
            }
            className="order-1 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white hover:bg-indigo-700 sm:order-2 sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
