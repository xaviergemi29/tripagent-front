"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { Bed, BedDouble, Copy, Minus, Plus, Trash2, type LucideIcon } from "lucide-react";
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
import { LODGING_BED_LIMITS, LODGING_LIMITS } from "@/shared/constants/domain.constants";
import {
  canAddBed,
  describeBeds,
  exceedsRegisterLimits,
  getBedsCapacity,
  getRegisterableCapacity,
  getRoomKindLabel,
  isValidBeds,
  type BedKind,
  type RoomBeds,
} from "@/shared/utils/lodging-beds.util";
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

/** Registra un hotel y sus habitaciones, una por una, eligiendo sus camas. Abre limpio cada vez. */
export function RoomRegistrationModal({
  isOpen,
  onClose,
  tourId,
  initialHotelName = "",
}: RoomRegistrationModalProps) {
  const { mutate, isPending } = useRegisterLodgingRooms(tourId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="flex max-h-[90dvh] w-[95vw] flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-0 shadow-2xl sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b border-slate-100 p-6 pb-5 text-left">
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

/** Habitación nueva sin camas: el operador elige qué crear (nada se registra por omisión). */
const EMPTY_ROOM: RoomBeds = { matrimonialBeds: 0, singleBeds: 0 };

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
    defaultValues: { hotelName: initialHotelName, rooms: [EMPTY_ROOM] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "rooms" });
  const hotelName = useWatch({ control, name: "hotelName" });
  const rooms = useWatch({ control, name: "rooms" });

  const totalRooms = rooms.length;
  const totalCapacity = getRegisterableCapacity(rooms);
  const firstIncomplete = rooms.findIndex((room) => !isValidBeds(room));
  const allValid = firstIncomplete === -1;
  const overLimit = exceedsRegisterLimits(rooms);
  const canAddRoom = totalRooms < LODGING_LIMITS.totalRoomsMax;
  const canSubmit = hotelName.trim().length > 0 && allValid && !overLimit && !isSubmitting;

  const setBeds = (index: number, field: keyof RoomBeds, value: number) =>
    setValue(`rooms.${index}.${field}`, Math.max(0, value));

  const duplicateLast = () => {
    const last = rooms[rooms.length - 1];
    if (last) append({ matrimonialBeds: last.matrimonialBeds, singleBeds: last.singleBeds });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
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
            {fields.map((field, index) => (
              <RoomConfigCard
                key={field.id}
                index={index}
                beds={rooms[index] ?? EMPTY_ROOM}
                canRemove={fields.length > 1}
                disabled={isSubmitting}
                onChange={(bedField, value) => setBeds(index, bedField, value)}
                onRemove={() => remove(index)}
              />
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => append(EMPTY_ROOM)}
              disabled={isSubmitting || !canAddRoom}
              className="flex items-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 px-4 py-2.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 disabled:opacity-50 md:text-sm"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Agregar otra habitación
            </button>
            <button
              type="button"
              onClick={duplicateLast}
              disabled={isSubmitting || !canAddRoom}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 md:text-sm"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              Duplicar última
            </button>
          </div>
        </div>
      </div>

      <div className="shrink-0 space-y-3 border-t border-slate-100 p-4 sm:p-6">
        <section
          aria-label="Resumen de habitaciones"
          className="rounded-xl border border-slate-200 bg-slate-50 p-3.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Resumen antes de agregar
            </h4>
            {allValid && !overLimit ? (
              <span className="rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                Listo para registrar
              </span>
            ) : (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                {overLimit
                  ? `Máximo ${LODGING_LIMITS.quantityMax} habitaciones iguales por envío`
                  : `Elige las camas de la Habitación ${firstIncomplete + 1}`}
              </span>
            )}
          </div>
          <ul className="mt-2 max-h-28 space-y-0.5 overflow-y-auto text-xs text-slate-600">
            {rooms.map((room, index) => (
              <li key={fields[index]?.id ?? index}>
                <strong className="text-slate-800">Habitación {index + 1}:</strong>{" "}
                {getBedsCapacity(room) > 0 ? describeBeds(room) : "sin camas todavía"}
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div aria-live="polite">
            <p className="text-xs text-slate-600">
              Se crearán{" "}
              <strong className="font-bold text-slate-900">
                {totalRooms} {totalRooms === 1 ? "habitación" : "habitaciones"}
              </strong>{" "}
              <span className="font-semibold text-emerald-700">
                ({totalCapacity} {totalCapacity === 1 ? "lugar" : "lugares"})
              </span>
            </p>
            <p className="text-[11px] text-slate-500">
              En el tablero capturas el número de cuarto y asignas a los pasajeros.
            </p>
          </div>
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
      </div>
    </form>
  );
}

interface RoomConfigCardProps {
  index: number;
  beds: RoomBeds;
  canRemove: boolean;
  disabled: boolean;
  onChange: (field: keyof RoomBeds, value: number) => void;
  onRemove: () => void;
}

function RoomConfigCard({
  index,
  beds,
  canRemove,
  disabled,
  onChange,
  onRemove,
}: RoomConfigCardProps) {
  const title = `Habitación ${index + 1}`;
  const capacity = getBedsCapacity(beds);
  const hasBeds = isValidBeds(beds);

  return (
    <li className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-all">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <BedDouble className="h-4 w-4" aria-hidden="true" />
          </span>
          <h3 className="text-sm font-bold text-slate-800 md:text-base">{title}</h3>
          {hasBeds ? (
            <span className="rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              {getRoomKindLabel(beds)}
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              Elige las camas
            </span>
          )}
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            aria-label={`Eliminar ${title}`}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <BedStepper
          icon={BedDouble}
          label="Camas matrimoniales"
          hint="2 personas c/u"
          noun="cama matrimonial"
          title={title}
          value={beds.matrimonialBeds}
          disabled={disabled}
          canAdd={canAddBed(beds, "MATRIMONIAL")}
          onChange={(value) => onChange("matrimonialBeds", value)}
        />
        <BedStepper
          icon={Bed}
          label="Camas individuales"
          hint="1 persona c/u"
          noun="cama individual"
          title={title}
          value={beds.singleBeds}
          disabled={disabled}
          canAdd={canAddBed(beds, "SINGLE")}
          onChange={(value) => onChange("singleBeds", value)}
        />
      </div>

      <BedsPreview beds={beds} />
      {capacity >= LODGING_BED_LIMITS.capacityMax && (
        <p className="mt-2 text-[11px] text-slate-500">
          Máximo {LODGING_BED_LIMITS.capacityMax} personas por habitación.
        </p>
      )}
    </li>
  );
}

/** Una pieza por cama: matrimonial (2 personas) o individual (1 persona). Solo decorativa. */
function BedsPreview({ beds }: { beds: RoomBeds }) {
  const pieces: { kind: BedKind; key: string }[] = [
    ...Array.from({ length: beds.matrimonialBeds }, (_, i) => ({
      kind: "MATRIMONIAL" as const,
      key: `m${i}`,
    })),
    ...Array.from({ length: beds.singleBeds }, (_, i) => ({
      kind: "SINGLE" as const,
      key: `s${i}`,
    })),
  ];
  if (pieces.length === 0) return null;
  return (
    <ul aria-hidden="true" className="mt-3 flex flex-wrap gap-2">
      {pieces.map(({ kind, key }) =>
        kind === "MATRIMONIAL" ? (
          <li
            key={key}
            className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700"
          >
            <BedDouble className="h-4 w-4" />
            Matrimonial · 2
          </li>
        ) : (
          <li
            key={key}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600"
          >
            <Bed className="h-4 w-4" />
            Individual · 1
          </li>
        ),
      )}
    </ul>
  );
}

interface BedStepperProps {
  icon: LucideIcon;
  label: string;
  hint: string;
  /** Para los aria-label: "cama matrimonial". */
  noun: string;
  title: string;
  value: number;
  disabled: boolean;
  /** Cabe una cama más sin pasar los límites de la habitación. */
  canAdd: boolean;
  onChange: (value: number) => void;
}

function BedStepper({
  icon: Icon,
  label,
  hint,
  noun,
  title,
  value,
  disabled,
  canAdd,
  onChange,
}: BedStepperProps) {
  return (
    // flex-wrap: si no cabe, el contador baja a otra línea en lugar de cortar "Camas matrimoniales".
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
      <div className="min-w-[9.5rem] flex-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap text-slate-800 md:text-sm">
          <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          {label}
        </div>
        <p className="text-[11px] text-slate-500">{hint}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          disabled={disabled || value === 0}
          aria-label={`Quitar una ${noun} de la ${title}`}
          className="flex h-7 w-7 items-center justify-center rounded bg-white text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <span
          className="w-6 text-center text-sm font-bold text-slate-800"
          role="status"
          aria-live="polite"
          aria-label={`${label} de la ${title}`}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={disabled || !canAdd}
          aria-label={`Agregar una ${noun} a la ${title}`}
          className="flex h-7 w-7 items-center justify-center rounded bg-white text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
