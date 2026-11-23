"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { BedDouble, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LODGING_BASE_ROOM_TYPES,
  LODGING_EXTRA_ROOM_TYPES,
  LODGING_LIMITS,
  LODGING_ROOM_CAPACITY,
  LODGING_ROOM_TYPES,
  type LodgingRoomType,
} from "@/shared/constants/domain.constants";
import { LODGING_ROOM_TYPE_DICT } from "@/shared/utils/config/status-dictionaries.config";
import { useRegisterLodgingRooms } from "../../hooks/useLodging";
import {
  registerLodgingRoomsFormSchema,
  toRegisterLodgingRoomsInput,
  type RegisterLodgingRoomsFormInput,
} from "../../schemas/lodging.schema";

interface RoomRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourId: string;
  /** Nombre precargado: agrega lotes a ese hotel (la API agrega por nombre). Vacío = hotel nuevo. */
  initialHotelName?: string;
}

/** Registra un hotel y sus habitaciones por lote (tipo y cantidad). Abre limpio cada vez. */
export function RoomRegistrationModal({
  isOpen,
  onClose,
  tourId,
  initialHotelName = "",
}: RoomRegistrationModalProps) {
  const { mutate, isPending } = useRegisterLodgingRooms(tourId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="w-[95vw] gap-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-0 shadow-2xl sm:max-w-lg">
        <DialogHeader className="border-b border-slate-100 p-6 pb-5 text-left">
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
            Registrar habitaciones y camas
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-slate-500">
            Configura el hotel y la distribución inicial para esta salida
          </DialogDescription>
        </DialogHeader>
        <RoomRegistrationForm
          initialHotelName={initialHotelName}
          isSubmitting={isPending}
          onCancel={onClose}
          onSubmit={(values) => mutate(toRegisterLodgingRoomsInput(values), { onSuccess: onClose })}
        />
      </DialogContent>
    </Dialog>
  );
}

const EMPTY_QUANTITIES: RegisterLodgingRoomsFormInput["quantities"] = {
  MATRIMONIAL: 0,
  DOUBLE_INDIVIDUAL: 0,
  TRIPLE: 0,
  QUADRUPLE: 0,
  SINGLE: 0,
};

interface RoomRegistrationFormProps {
  initialHotelName: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: RegisterLodgingRoomsFormInput) => void;
}

function RoomRegistrationForm({
  initialHotelName,
  isSubmitting,
  onCancel,
  onSubmit,
}: RoomRegistrationFormProps) {
  const { register, handleSubmit, setValue, control } = useForm<RegisterLodgingRoomsFormInput>({
    resolver: zodResolver(registerLodgingRoomsFormSchema),
    defaultValues: { hotelName: initialHotelName, quantities: EMPTY_QUANTITIES },
  });
  const hotelName = useWatch({ control, name: "hotelName" });
  const quantities = useWatch({ control, name: "quantities" });
  const [extraTypes, setExtraTypes] = useState<LodgingRoomType[]>([]);
  const [isPickingExtra, setIsPickingExtra] = useState(false);

  const visibleTypes = [...LODGING_BASE_ROOM_TYPES, ...extraTypes];
  const availableExtras = LODGING_EXTRA_ROOM_TYPES.filter((type) => !extraTypes.includes(type));
  const totalRooms = LODGING_ROOM_TYPES.reduce((sum, type) => sum + (quantities[type] ?? 0), 0);
  const totalCapacity = LODGING_ROOM_TYPES.reduce(
    (sum, type) => sum + (quantities[type] ?? 0) * LODGING_ROOM_CAPACITY[type],
    0,
  );
  const canSubmit = hotelName.trim().length > 0 && totalRooms > 0 && !isSubmitting;

  const setQuantity = (type: LodgingRoomType, value: number) =>
    setValue(`quantities.${type}`, Math.min(LODGING_LIMITS.quantityMax, Math.max(0, value)));

  const addExtra = (type: LodgingRoomType) => {
    setExtraTypes((prev) => [...prev, type]);
    setQuantity(type, 1);
    setIsPickingExtra(false);
  };

  const removeExtra = (type: LodgingRoomType) => {
    setExtraTypes((prev) => prev.filter((item) => item !== type));
    setQuantity(type, 0);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
      <div className="space-y-2">
        <Label
          htmlFor="lodging-hotel-name"
          className="text-xs font-semibold tracking-wider text-slate-700 uppercase"
        >
          Nombre del hotel <span className="text-red-500">*</span>
        </Label>
        <Input
          id="lodging-hotel-name"
          type="text"
          autoComplete="off"
          maxLength={LODGING_LIMITS.hotelNameMax}
          placeholder="Ej. Hotel Sierra Huasteca Inn"
          disabled={isSubmitting}
          className="h-11 w-full rounded-xl border-slate-200 px-3.5 text-base text-slate-900 placeholder:text-slate-400 sm:text-sm"
          {...register("hotelName")}
        />
      </div>

      <div>
        <div className="mb-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Habitaciones a registrar
        </div>

        <ul className="space-y-3">
          {visibleTypes.map((type) => {
            const config = LODGING_ROOM_TYPE_DICT[type];
            const count = quantities[type] ?? 0;
            const isExtra = extraTypes.includes(type);
            return (
              <li
                key={type}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition-colors hover:border-slate-300 hover:bg-white"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{config.name}</span>
                    <span className="rounded-full border border-slate-200/80 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      {config.badgeLabel}
                    </span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <BedDouble className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                    <span>{config.description}</span>
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {isExtra && (
                    <button
                      type="button"
                      onClick={() => removeExtra(type)}
                      disabled={isSubmitting}
                      aria-label={`Quitar el tipo ${config.name}`}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                  <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setQuantity(type, count - 1)}
                      disabled={isSubmitting || count === 0}
                      aria-label={`Quitar una habitación ${config.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <span
                      className="w-9 text-center text-sm font-bold text-slate-800"
                      aria-label={`Habitaciones ${config.name}`}
                    >
                      {count}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(type, count + 1)}
                      disabled={
                        isSubmitting ||
                        count >= LODGING_LIMITS.quantityMax ||
                        totalRooms >= LODGING_LIMITS.totalRoomsMax
                      }
                      aria-label={`Agregar una habitación ${config.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {availableExtras.length > 0 && (
          <div className="mt-3">
            {isPickingExtra ? (
              <div className="space-y-2 rounded-xl border border-indigo-100 bg-indigo-50/70 p-3">
                <div className="text-xs font-semibold text-indigo-950">
                  Selecciona una configuración adicional:
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {availableExtras.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => addExtra(type)}
                      className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-900 shadow-sm transition-colors hover:bg-indigo-600 hover:text-white"
                    >
                      <Plus className="h-3 w-3" aria-hidden="true" />
                      {LODGING_ROOM_TYPE_DICT[type].name} ({LODGING_ROOM_TYPE_DICT[type].badgeLabel}
                      )
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsPickingExtra(false)}
                    className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsPickingExtra(true)}
                className="flex items-center gap-1.5 rounded-md px-1 py-1 text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Agregar otro tipo de habitación
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-600" aria-live="polite">
          Se crearán{" "}
          <strong className="font-bold text-slate-900">
            {totalRooms} {totalRooms === 1 ? "habitación" : "habitaciones"}
          </strong>{" "}
          <span className="font-semibold text-emerald-700">
            ({totalCapacity} {totalCapacity === 1 ? "lugar" : "lugares"})
          </span>
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-10 flex-1 rounded-xl border-slate-200 px-4 text-sm font-medium text-slate-700 sm:flex-none"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!canSubmit}
            className="h-10 flex-1 rounded-xl bg-indigo-600 px-5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 sm:flex-none"
          >
            {isSubmitting ? "Agregando..." : "Agregar al tablero"}
          </Button>
        </div>
      </div>
    </form>
  );
}
