"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { LodgingPassengerOutput, LodgingRoomOutput } from "../../schemas/lodging.schema";
import { filterRooms, getRoomTitles, sortRooms, type RoomFilter } from "../../utils/lodging.util";
import { RoomCardSkeleton } from "./LodgingBoardSkeleton";
import { RoomCard } from "./RoomCard";

/** Tope de marcadores: con un lote grande no se llena la pantalla de esqueletos. */
const MAX_PLACEHOLDERS = 4;

const FILTERS: { value: RoomFilter; label: string }[] = [
  { value: "ALL", label: "Todas" },
  { value: "WITH_MATRIMONIAL", label: "Con cama matrimonial" },
  { value: "ONLY_SINGLES", label: "Solo individuales" },
  { value: "FREE_BEDS", label: "Con camas libres" },
];

interface RoomGridProps {
  rooms: LodgingRoomOutput[];
  passengersById: Record<string, LodgingPassengerOutput>;
  availablePassengers: LodgingPassengerOutput[];
  /** Sin callbacks (solo consulta) las tarjetas no ofrecen acciones. */
  onAssign?: (roomId: string, slotIndex: number, bookingPassengerId: string) => void;
  onUnassign?: (roomId: string, slotIndex: number) => void;
  onRoomNumberChange?: (roomId: string, roomNumber: string | null) => void;
  onDeleteRoom?: (roomId: string) => void;
  onDeleteBed?: (roomId: string, slotIndex: number) => void;
  /** Habitaciones con una mutación en curso (acciones bloqueadas). */
  busyRoomIds?: ReadonlySet<string>;
  /** Habitaciones que se están registrando en este hotel (marcadores). */
  registeringCount?: number;
  /** Acción del hotel sin habitaciones; ausente en solo consulta. */
  onRegisterClick?: () => void;
}

export function RoomGrid({
  rooms,
  passengersById,
  availablePassengers,
  onAssign,
  onUnassign,
  onRoomNumberChange,
  onDeleteRoom,
  onDeleteBed,
  busyRoomIds,
  registeringCount = 0,
  onRegisterClick,
}: RoomGridProps) {
  const [filter, setFilter] = useState<RoomFilter>("ALL");
  const titles = getRoomTitles(rooms);
  const visibleRooms = sortRooms(filterRooms(rooms, filter));

  if (rooms.length === 0 && registeringCount === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
        <p className="text-sm text-slate-500">Este hotel no tiene habitaciones registradas.</p>
        {onRegisterClick && (
          <Button
            type="button"
            onClick={onRegisterClick}
            className="gap-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Registrar habitaciones
          </Button>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar habitaciones">
          {FILTERS.map(({ value, label }) => {
            const count = filterRooms(rooms, value).length;
            const isActive = filter === value;
            const isFreeHighlight = value === "FREE_BEDS" && count > 0;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={isActive}
                onClick={() => setFilter(value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  isActive
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : isFreeHighlight
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                )}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        {visibleRooms.length === 0 && registeringCount === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
            No hay habitaciones con este filtro.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {visibleRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                isBusy={busyRoomIds?.has(room.id)}
                title={titles[room.id]}
                passengersById={passengersById}
                availablePassengers={availablePassengers}
                onAssign={onAssign && ((slot, id) => onAssign(room.id, slot, id))}
                onUnassign={onUnassign && ((slot) => onUnassign(room.id, slot))}
                onRoomNumberChange={
                  onRoomNumberChange && ((value) => onRoomNumberChange(room.id, value))
                }
                onDeleteRoom={onDeleteRoom && (() => onDeleteRoom(room.id))}
                onDeleteBed={onDeleteBed && ((slot) => onDeleteBed(room.id, slot))}
              />
            ))}
            {Array.from({ length: Math.min(registeringCount, MAX_PLACEHOLDERS) }, (_, index) => (
              <RoomCardSkeleton key={`registering-${index}`} />
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
