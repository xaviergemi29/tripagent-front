"use client";

import { useRef, useState } from "react";
import { Bed, BedDouble, CheckCircle2, Pencil, Trash2, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LODGING_ROOM_NUMBER_MAX,
  LODGING_ROOM_STATUS,
  type LodgingRoomType,
} from "@/shared/constants/domain.constants";
import { LODGING_ROOM_STATUS_DICT } from "@/shared/utils/config/status-dictionaries.config";
import type { LodgingPassengerOutput, LodgingRoomOutput } from "../../schemas/lodging.schema";
import {
  getBedLabel,
  getInitials,
  getRoomDescription,
  getRoomBeds,
  getRoomFreeBeds,
  getRoomOccupied,
} from "../../utils/lodging.util";
import { AssignPassengerPopover } from "./AssignPassengerPopover";

const ROOM_ICON: Record<LodgingRoomType, typeof Bed> = {
  MATRIMONIAL: Bed,
  DOUBLE_INDIVIDUAL: BedDouble,
  TRIPLE: Users,
  QUADRUPLE: Users,
  SINGLE: Bed,
};

interface RoomCardProps {
  room: LodgingRoomOutput;
  /** "Matrimonial #1". */
  title: string;
  passengersById: Record<string, LodgingPassengerOutput>;
  /** Pasajeros sin cama en el hotel (candidatos de las camas libres). */
  availablePassengers: LodgingPassengerOutput[];
  /** Sin callbacks (solo consulta) la tarjeta no ofrece ninguna acción. */
  onAssign?: (slotIndex: number, bookingPassengerId: string) => void;
  onUnassign?: (slotIndex: number) => void;
  onRoomNumberChange?: (roomNumber: string | null) => void;
  onConfirm?: () => void;
  onDeleteRoom?: () => void;
  /** Se ofrece solo con más de una cama (con una sola se elimina la habitación). */
  onDeleteBed?: (slotIndex: number) => void;
}

const ICON_BUTTON =
  "rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600";

function IconAction({
  label,
  tooltip,
  onClick,
  className = ICON_BUTTON,
  children,
}: {
  label: string;
  tooltip: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" onClick={onClick} aria-label={label} className={className}>
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export function RoomCard({
  room,
  title,
  passengersById,
  availablePassengers,
  onAssign,
  onUnassign,
  onRoomNumberChange,
  onConfirm,
  onDeleteRoom,
  onDeleteBed,
}: RoomCardProps) {
  const Icon = ROOM_ICON[room.roomType];
  const statusConfig = LODGING_ROOM_STATUS_DICT[room.status];
  const occupied = getRoomOccupied(room);
  const free = getRoomFreeBeds(room);
  const isConsulted = room.status === LODGING_ROOM_STATUS.CONSULTED;
  const canDeleteBeds = Boolean(onDeleteBed) && room.capacity > 1;

  return (
    <article
      aria-label={title}
      className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
    >
      <header className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600">
            <Icon className="h-4.5 w-4.5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h4 className="truncate text-sm font-bold text-slate-900">{title}</h4>
            <RoomNumberChip
              // Si cambia el valor guardado (otro operador, rollback), el borrador parte de cero.
              key={room.roomNumber ?? ""}
              roomNumber={room.roomNumber}
              onChange={onRoomNumberChange}
            />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusConfig.badgeClass}`}
          >
            {statusConfig.label}
          </span>
          {onDeleteRoom && (
            <IconAction
              label={`Eliminar ${title}`}
              tooltip="Eliminar habitación"
              onClick={onDeleteRoom}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </IconAction>
          )}
        </div>
      </header>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full border border-slate-200/80 bg-slate-50 px-2 py-0.5 font-medium text-slate-600">
          {getRoomDescription(room)}
        </span>
        <span className="text-slate-500">
          {occupied}/{room.capacity} ocupados
          {free > 0 ? ` (${free} ${free === 1 ? "libre" : "libres"})` : ""}
        </span>
      </div>

      <ul className="mt-3 space-y-2">
        {getRoomBeds(room).map((bed) => {
          const label = getBedLabel(room.roomType, bed.slotIndex);
          const passenger = bed.bookingPassengerId
            ? passengersById[bed.bookingPassengerId]
            : undefined;
          const deleteBed = canDeleteBeds && onDeleteBed && (
            <div className="ml-1 shrink-0 border-l border-slate-200 pl-1.5">
              <IconAction
                label={`Eliminar ${label}`}
                tooltip="Eliminar esta cama"
                onClick={() => onDeleteBed(bed.slotIndex)}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </IconAction>
            </div>
          );
          return (
            <li key={bed.slotIndex}>
              {bed.bookingPassengerId ? (
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 p-2.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700"
                    aria-hidden="true"
                  >
                    {getInitials(passenger?.fullName ?? "")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      {label}
                    </p>
                    <p className="truncate text-sm font-medium text-slate-900">
                      {passenger?.fullName ?? "Pasajero"}
                    </p>
                    {passenger?.seatLabel && (
                      <p className="text-xs text-slate-500">Asiento {passenger.seatLabel}</p>
                    )}
                  </div>
                  {onUnassign && (
                    <IconAction
                      label={`Quitar a ${passenger?.fullName ?? "pasajero"} de ${label}`}
                      tooltip="Quitar pasajero de esta cama"
                      onClick={() => onUnassign(bed.slotIndex)}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </IconAction>
                  )}
                  {deleteBed}
                </div>
              ) : (
                <div className="flex items-center">
                  {onAssign ? (
                    <AssignPassengerPopover
                      passengers={availablePassengers}
                      onSelect={(bookingPassengerId) => onAssign(bed.slotIndex, bookingPassengerId)}
                    >
                      <button
                        type="button"
                        aria-label={`Asignar pasajero a ${label}`}
                        className="flex w-full min-w-0 flex-1 items-center justify-between gap-2 rounded-xl border border-dashed border-slate-300 p-2.5 text-left text-sm text-slate-500 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600"
                      >
                        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                          {label}
                        </span>
                        <span>Disponible · Asignar pasajero</span>
                      </button>
                    </AssignPassengerPopover>
                  ) : (
                    <div className="flex min-w-0 flex-1 items-center justify-between rounded-xl border border-dashed border-slate-200 p-2.5 text-sm text-slate-400">
                      <span className="text-[10px] font-bold tracking-wider uppercase">
                        {label}
                      </span>
                      <span>Disponible</span>
                    </div>
                  )}
                  {deleteBed}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {isConsulted && onConfirm && (
        <footer className="mt-3 border-t border-slate-100 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onConfirm}
            className="w-full gap-1.5 rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Marcar como Confirmada
          </Button>
        </footer>
      )}
    </article>
  );
}

interface RoomNumberChipProps {
  roomNumber: string | null;
  onChange?: (roomNumber: string | null) => void;
}

/** Número de cuarto editable en línea: Enter o salir del campo guarda; Escape cancela. */
function RoomNumberChip({ roomNumber, onChange }: RoomNumberChipProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(roomNumber ?? "");
  // Enter y Escape desmontan el campo: evita que el blur resultante guarde otra vez.
  const isClosing = useRef(false);

  const label = roomNumber ? `Hab. ${roomNumber}` : "Núm. de cuarto";

  if (!onChange) {
    return roomNumber ? <p className="text-xs text-slate-500">{label}</p> : null;
  }

  const close = (save: boolean) => {
    if (isClosing.current) return;
    isClosing.current = true;
    const next = draft.trim() || null;
    setIsEditing(false);
    if (save && next !== roomNumber) onChange(next);
  };

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => {
          isClosing.current = false;
          setDraft(roomNumber ?? "");
          setIsEditing(true);
        }}
        aria-label={roomNumber ? `Editar número de cuarto (${label})` : "Editar número de cuarto"}
        className="mt-0.5 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-600"
      >
        {label}
        <Pencil className="h-3 w-3" aria-hidden="true" />
      </button>
    );
  }

  return (
    <Input
      autoFocus
      value={draft}
      maxLength={LODGING_ROOM_NUMBER_MAX}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => close(true)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          close(true);
        } else if (event.key === "Escape") {
          event.preventDefault();
          close(false);
        }
      }}
      aria-label="Número de cuarto"
      placeholder="Ej. 101"
      className="mt-0.5 h-7 w-28 px-2 text-base sm:text-xs"
    />
  );
}
