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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Bus, Car, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import {
  useAssignVehicleToTour,
  useVehicles,
  useTourDashboardByTourId,
} from "../hooks/useTourDashboard";
import type { VehicleDTO } from "../schemas/tour-dashboard.schema";

interface Props {
  tourId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ConflictData {
  newVehicle: VehicleDTO;
  orphanSeatsCount: number;
  orphanSeatNumbers: number[];
}

export function VehicleSelectionModal({ tourId, isOpen, onClose }: Props) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isCapacityAlertOpen, setIsCapacityAlertOpen] = useState(false);
  const [conflictData, setConflictData] = useState<ConflictData | null>(null);

  const { data: vehicles = [], isLoading: isLoadingVehicles } = useVehicles();
  const { data: tourData } = useTourDashboardByTourId(tourId);
  const { mutateAsync: assignVehicle, isPending: isSubmitting } = useAssignVehicleToTour();

  const totalPassengers = tourData?.metrics?.occupancy?.current || 0;
  const assignedSeatNumbers = tourData?.metrics?.assignedSeats || [];

  const getVehicleCapacity = (layoutMap: (string | null)[][]): number => {
    return layoutMap.flat().filter((cell) => cell && cell !== "AISLE").length;
  };

  const handleConfirmVehicle = async (): Promise<void> => {
    if (!selectedVehicleId) return;

    const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
    if (!selectedVehicle) return;

    const newCapacity = getVehicleCapacity(selectedVehicle.layoutMap);

    // Validación simplificada gracias al backend
    const orphanSeats = assignedSeatNumbers.filter((seatNum) => seatNum > newCapacity);

    if (orphanSeats.length > 0) {
      setConflictData({
        newVehicle: selectedVehicle,
        orphanSeatsCount: orphanSeats.length,
        orphanSeatNumbers: orphanSeats,
      });
      setIsCapacityAlertOpen(true);
      return;
    }

    await executeVehicleAssignment(selectedVehicle.id, false);
  };

  const executeVehicleAssignment = async (
    vehicleId: string,
    resetOrphans: boolean,
  ): Promise<void> => {
    try {
      await assignVehicle({ tourId, vehicleId, resetOrphans });
      onCloseModal();
    } catch (error) {
      console.error(error);
    }
  };

  const onCloseModal = (): void => {
    setSelectedVehicleId(null);
    setConflictData(null);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onCloseModal()}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-lg overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Asignar Vehículo al Tour</DialogTitle>
            <DialogDescription>
              Selecciona la capacidad y distribución de asientos para este viaje.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 mb-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Pasajeros registrados:</span>
              <span className="font-bold text-slate-800">{totalPassengers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Asientos ya asignados:</span>
              <span className="font-bold text-slate-800">{assignedSeatNumbers.length}</span>
            </div>
          </div>

          <div className="grid gap-3 py-4">
            {isLoadingVehicles ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="mt-2 text-sm text-slate-500">Cargando flota...</p>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <p className="text-sm font-medium text-slate-600">
                  No tienes vehículos registrados.
                </p>
              </div>
            ) : (
              vehicles.map((v) => {
                const capacity = getVehicleCapacity(v.layoutMap);
                const isInsufficient = capacity < totalPassengers;
                const isSelected = selectedVehicleId === v.id;

                return (
                  <button
                    key={v.id}
                    onClick={() => !isInsufficient && setSelectedVehicleId(v.id)}
                    disabled={isInsufficient || isSubmitting}
                    className={`relative flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all ${
                      isInsufficient
                        ? "cursor-not-allowed border-rose-200 bg-slate-50 opacity-60"
                        : isSelected
                          ? "border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full p-2 ${isSelected ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-600"}`}
                      >
                        {capacity > 20 ? <Bus className="h-5 w-5" /> : <Car className="h-5 w-5" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{v.name}</span>
                        <span className="text-xs text-slate-500">
                          {capacity} lugares · {v.layoutMap.length} filas
                        </span>
                        {isInsufficient && (
                          <span className="mt-1 text-[10px] font-bold text-rose-600">
                            Capacidad insuficiente (requiere {totalPassengers})
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-indigo-600" />}
                  </button>
                );
              })
            )}
          </div>

          <DialogFooter className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row">
            <Button
              variant="ghost"
              onClick={onCloseModal}
              disabled={isSubmitting}
              className="order-2 w-full sm:order-1 sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmVehicle}
              disabled={!selectedVehicleId || isSubmitting}
              className="order-1 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white hover:bg-indigo-700 sm:order-2 sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Confirmar y cargar mapa</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isCapacityAlertOpen} onOpenChange={setIsCapacityAlertOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-center text-lg font-bold text-slate-900">
              El nuevo vehículo tiene menor capacidad
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-center text-sm text-slate-600">
              <p>
                El vehículo cuenta con{" "}
                <strong>
                  {getVehicleCapacity(conflictData?.newVehicle?.layoutMap || [])} asientos
                </strong>
                . Existen <strong>{conflictData?.orphanSeatsCount} pasajeros</strong> con asientos
                que exceden esta capacidad.
              </p>
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-700">
                ⚠️ Dichos asientos serán desasignados y deberán reacomodarse manualmente.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex-col gap-2 sm:flex-row">
            <AlertDialogCancel
              onClick={() => setIsCapacityAlertOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setIsCapacityAlertOpen(false);
                if (conflictData) await executeVehicleAssignment(conflictData.newVehicle.id, true);
              }}
              className="w-full bg-amber-600 font-semibold text-white hover:bg-amber-700 sm:w-auto"
            >
              Continuar y liberar asientos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
