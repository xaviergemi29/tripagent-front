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
import { cn } from "@/lib/utils";
import { useTourSeats } from "@/features/tours/hooks/useTourSeats";
import { useVehicleTemplates } from "@/features/vehicles/hooks/useVehicleTemplates";
import type { LayoutMap, VehicleCapacityOutput } from "@/features/vehicles/schemas/vehicle.schema";
import { getLayoutSeatLabels } from "@/features/vehicles/utils/vehicle-layout.util";
import { PreviewSeat, VehicleLayoutGrid } from "@/features/vehicles/components/VehicleLayoutGrid";

interface VehicleSelectionModalProps {
  tourId: string;
  isOpen: boolean;
  onClose: () => void;
  /** Lugares con derecho a asiento (`metrics.logistics.total`): mínimo que debe caber. */
  passengersCount: number;
  assignedSeatsCount: number;
  currentVehicle?: VehicleOutput | null;
  onSuccess?: () => void;
}

/** Opción del selector: plantilla del catálogo o unidad anterior de la agencia. */
interface VehicleOption {
  key: string;
  target: { templateId: string } | { vehicleId: string };
  name: string;
  description?: string;
  layoutMap: LayoutMap;
  capacity: VehicleCapacityOutput;
  isCurrent: boolean;
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
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const { data: templates = [], isLoading: isLoadingTemplates } = useVehicleTemplates();
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useVehicles();
  const { mutateAsync: assignVehicle, isPending: isSubmitting } = useAssignVehicleToTour();
  const { data: seats = [] } = useTourSeats(tourId);

  // Catálogo de TripAgent: la API reutiliza o crea la unidad de la agencia para la plantilla.
  const catalogOptions: VehicleOption[] = templates.map((template) => ({
    key: `template:${template.id}`,
    target: { templateId: template.id },
    name: template.name,
    description: template.description,
    layoutMap: template.layoutMap,
    capacity: template.capacity,
    isCurrent: !!currentVehicle?.templateId && currentVehicle.templateId === template.id,
  }));

  // Unidades de la agencia que no vienen de una plantilla activa (formato anterior o por API).
  // Se conservan para no romper tours que ya las usan.
  const legacyOptions: VehicleOption[] = vehicles
    .filter((vehicle) => !templates.some((template) => template.id === vehicle.templateId))
    .map((vehicle) => ({
      key: `vehicle:${vehicle.id}`,
      target: { vehicleId: vehicle.id },
      name: vehicle.name,
      layoutMap: vehicle.layoutMap,
      capacity: vehicle.capacity,
      isCurrent: currentVehicle?.id === vehicle.id,
    }));

  const allOptions = [...catalogOptions, ...legacyOptions];
  const selected = allOptions.find((option) => option.key === selectedKey);

  // Vista previa de lo que hará la API: libera los asientos y bloqueos cuya etiqueta no existe
  // en la nueva unidad y conserva los demás con la misma etiqueta.
  const newLabels = new Set(selected ? getLayoutSeatLabels(selected.layoutMap) : []);
  const seatsToRelease = selected
    ? seats.filter((seat) => seat.status === "ASSIGNED" && !newLabels.has(seat.seatLabel))
    : [];
  const blocksToRemove = selected
    ? seats.filter((seat) => seat.status === "BLOCKED" && !newLabels.has(seat.seatLabel))
    : [];
  const keptSeatsCount =
    seats.filter((seat) => seat.status === "ASSIGNED").length - seatsToRelease.length;

  // Candado físico (la API también lo valida con 409): asientos de PASAJERO, sin staff ni operador.
  const isTooSmall = (option: VehicleOption) => option.capacity.passenger < passengersCount;

  const handleConfirmVehicle = async (): Promise<void> => {
    if (!selected) return;

    try {
      // Los toasts de éxito y error (incluido el 409 por capacidad) los muestra el hook.
      await assignVehicle({ tourId, ...selected.target });
      onSuccess?.();
      onCloseModal();
    } catch {
      // El modal se queda abierto para elegir otra unidad.
    }
  };

  const onCloseModal = (): void => {
    setSelectedKey(null);
    onClose();
  };

  const title = currentVehicle
    ? "¿Deseas cambiar el vehículo del tour?"
    : "Asignar Vehículo al Tour";
  const confirmText = currentVehicle ? "Confirmar y Cambiar Vehículo" : "Asignar y Cargar Mapa";
  const isChange = !!currentVehicle && !!selected && !selected.isCurrent;
  const isSelectedTooSmall = !!selected && isTooSmall(selected);

  const renderOption = (option: VehicleOption) => {
    const isSelected = selectedKey === option.key;
    const tooSmall = isTooSmall(option);
    const { total, passenger, staff } = option.capacity;

    return (
      <button
        key={option.key}
        type="button"
        onClick={() => setSelectedKey(option.key)}
        disabled={isSubmitting || tooSmall}
        className={cn(
          "relative flex w-full items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-all sm:p-4",
          isSelected
            ? "border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600"
            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
          tooSmall && "cursor-not-allowed opacity-60 hover:border-slate-200 hover:bg-white",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "shrink-0 rounded-full p-2",
              isSelected ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-600",
            )}
          >
            {total > 20 ? <Bus className="h-5 w-5" /> : <Car className="h-5 w-5" />}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="font-semibold text-slate-900">
              {option.name}
              {option.isCurrent && (
                <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">
                  Actual
                </span>
              )}
            </span>
            <span className="text-xs text-slate-500">
              {passenger} pasajeros
              {staff > 0 && ` + ${staff} staff`} · {total} asientos · operador aparte
            </span>
            {tooSmall && (
              <span className="text-xs font-medium text-red-600">
                No alcanza: {passengersCount} pasajeros ya tienen derecho a asiento
              </span>
            )}
          </div>
        </div>
        {isSelected && <CheckCircle2 className="h-5 w-5 shrink-0 text-indigo-600" />}
      </button>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCloseModal()}>
      {/* `sm:max-w-3xl` reemplaza el `sm:max-w-sm` del DialogContent base: deja espacio a la
          vista previa del croquis sin scroll horizontal. */}
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-3xl overflow-x-hidden overflow-y-auto rounded-2xl p-4 sm:max-w-3xl sm:p-6">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Elige una plantilla del catálogo. El operador (chofer) nunca cuenta como asiento.
          </DialogDescription>
        </DialogHeader>

        {currentVehicle && (
          <div className="mt-2 mb-2 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className="text-slate-700">
              Vehículo actual:{" "}
              <span className="font-semibold">
                {currentVehicle.name} ({currentVehicle.capacity.passenger} pasajeros
                {currentVehicle.capacity.staff > 0 && ` + ${currentVehicle.capacity.staff} staff`})
              </span>
            </p>
            <div className="flex justify-between text-slate-500">
              <span>Pasajeros con derecho a asiento:</span>
              <span className="font-semibold text-slate-800">{passengersCount}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Total de asientos ocupados:</span>
              <span className="font-semibold text-slate-800">{assignedSeatsCount}</span>
            </div>
          </div>
        )}

        <div className="grid gap-5 py-2 md:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="grid content-start gap-3">
            {isLoadingTemplates || isLoadingVehicles ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <>
                <h4 className="text-sm font-medium text-slate-700">Catálogo TripAgent</h4>
                {catalogOptions.map(renderOption)}

                {legacyOptions.length > 0 && (
                  <>
                    <h4 className="mt-2 text-sm font-medium text-slate-700">
                      Unidades anteriores de tu agencia
                    </h4>
                    <p className="-mt-2 text-xs text-slate-500">
                      Croquis sin operador ni staff, creados antes del catálogo. Se conservan para
                      los tours que ya los usan.
                    </p>
                    {legacyOptions.map(renderOption)}
                  </>
                )}
              </>
            )}
          </div>

          {/* Vista previa del croquis: columna fija en escritorio (sigue visible al recorrer la
              lista); debajo de la lista en celular, solo con una opción elegida. */}
          <aside
            className={cn(
              "flex-col items-center gap-3 self-start rounded-xl border border-slate-200 bg-slate-50 p-4 md:sticky md:top-0 md:flex",
              selected ? "flex" : "hidden",
            )}
          >
            {selected ? (
              <>
                <div className="text-center">
                  <p className="text-xs font-semibold text-slate-700">{selected.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {selected.capacity.passenger} pasajeros
                    {selected.capacity.staff > 0 && ` + ${selected.capacity.staff} staff`}
                  </p>
                </div>
                <VehicleLayoutGrid
                  layoutMap={selected.layoutMap}
                  size="sm"
                  renderSeat={(seat) => <PreviewSeat seat={seat} />}
                />
              </>
            ) : (
              <p className="py-10 text-center text-xs leading-relaxed text-slate-500">
                Selecciona una plantilla para ver su croquis.
              </p>
            )}
          </aside>
        </div>

        {/* AVISO DE CAMBIO: describe exactamente lo que hará la API */}
        {isChange &&
          !isSelectedTooSmall &&
          (keptSeatsCount > 0 || seatsToRelease.length > 0 || blocksToRemove.length > 0) && (
            <div className="animate-in fade-in mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <div className="space-y-1.5">
                {keptSeatsCount > 0 && (
                  <p className="leading-snug">
                    <strong>{keptSeatsCount} asiento(s) se conservan</strong> con la misma etiqueta.
                    En la nueva unidad esa etiqueta puede estar en otra posición: revisa el croquis.
                  </p>
                )}
                {seatsToRelease.length > 0 && (
                  <p className="leading-snug">
                    <strong>{seatsToRelease.length} pasajero(s)</strong> volverán a &quot;Faltan por
                    acomodar&quot; porque su asiento no existe en la nueva unidad (
                    {seatsToRelease.map((seat) => seat.seatLabel).join(", ")}).
                  </p>
                )}
                {blocksToRemove.length > 0 && (
                  <p className="leading-snug">
                    Se quitarán <strong>{blocksToRemove.length} bloqueo(s) de staff</strong> (
                    {blocksToRemove.map((seat) => seat.seatLabel).join(", ")}).
                  </p>
                )}
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
            disabled={!selected || isSubmitting || isSelectedTooSmall || selected.isCurrent}
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
