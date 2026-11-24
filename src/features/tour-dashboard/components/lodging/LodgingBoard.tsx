"use client";

import { useState } from "react";
import { Copy, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { copyToClipboard } from "@/shared/utils/clipboard";
import {
  useAssignLodgingRoom,
  useDeleteLodgingBed,
  useDeleteLodgingRoom,
  useLodgingActivity,
  useUnassignLodgingSlot,
  useUpdateLodgingRoom,
} from "../../hooks/useLodging";
import type {
  LodgingOutput,
  TargetBedDeletion,
  TargetRoomDeletion,
} from "../../schemas/lodging.schema";
import {
  buildBedDeletionTarget,
  buildRoomDeletionTarget,
  buildRoomingListText,
  buildStayLabel,
  findFreeMatrimonialBed,
  getFreeBeds,
  getHotelAssignedIds,
  getRoomFreeBeds,
  getRoomTitles,
  getUnassignedPassengers,
} from "../../utils/lodging.util";
import { DeleteBedModal } from "./DeleteBedModal";
import { DeleteRoomModal } from "./DeleteRoomModal";
import { RoomGrid } from "./RoomGrid";
import { UnassignedSidebar } from "./UnassignedSidebar";

interface LodgingBoardProps {
  tourId: string;
  tourTitle: string;
  departureDateTime: string;
  returnDate?: string | null;
  lodging: LodgingOutput;
  /** Modo Auditoría o Solo Lectura: se consulta y se copia, pero no se modifica nada. */
  readOnly?: boolean;
  /** Abre el modal de registro; sin nombre = hotel nuevo. Ausente en solo consulta. */
  onRegisterClick?: (hotelName?: string) => void;
}

const normalizeHotelName = (name: string) => name.trim().toLowerCase();

/** Tablero de hospedaje: hotel activo, KPIs, pasajeros sin cama y habitaciones. */
export function LodgingBoard({
  tourId,
  tourTitle,
  departureDateTime,
  returnDate,
  lodging,
  readOnly = false,
  onRegisterClick,
}: LodgingBoardProps) {
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const assign = useAssignLodgingRoom(tourId);
  const unassign = useUnassignLodgingSlot(tourId);
  const updateRoom = useUpdateLodgingRoom(tourId);
  const deleteBed = useDeleteLodgingBed(tourId);
  const deleteRoom = useDeleteLodgingRoom(tourId);
  const { busyRoomIds, registeringRooms, isUpdating } = useLodgingActivity(tourId);
  const [bedTarget, setBedTarget] = useState<TargetBedDeletion | null>(null);
  const [roomTarget, setRoomTarget] = useState<TargetRoomDeletion | null>(null);

  const hotel = lodging.hotels.find((item) => item.id === selectedHotelId) ?? lodging.hotels[0];
  const stayLabel = buildStayLabel(departureDateTime, returnDate);
  const passengersById = Object.fromEntries(
    lodging.passengers.map((passenger) => [passenger.bookingPassengerId, passenger]),
  );
  const unassigned = getUnassignedPassengers(hotel, lodging.passengers);
  // Una habitación con una mutación en curso no ofrece sus camas: sus índices aún pueden cambiar.
  const settledRooms = hotel.rooms.filter((room) => !busyRoomIds.has(room.id));
  const freeBeds = getFreeBeds(settledRooms);
  const freeMatrimonialBed = findFreeMatrimonialBed(settledRooms);
  const registeringCount = registeringRooms
    .filter(({ hotelName }) => normalizeHotelName(hotelName) === normalizeHotelName(hotel.name))
    .reduce((total, { count }) => total + count, 0);

  const assignedCount = getHotelAssignedIds(hotel).size;
  const totalPassengers = lodging.passengers.length;
  const freeBedsCount = hotel.rooms.reduce((sum, room) => sum + getRoomFreeBeds(room), 0);
  const hotelCapacity = hotel.rooms.reduce((sum, room) => sum + room.capacity, 0);
  const progress = totalPassengers > 0 ? Math.round((assignedCount / totalPassengers) * 100) : 0;

  const handleCopy = async () => {
    const text = buildRoomingListText({
      tourTitle,
      hotel,
      stayLabel,
      passengers: lodging.passengers,
    });
    if (await copyToClipboard(text)) {
      toast.success("Rooming List copiado al portapapeles");
    } else {
      toast.error("No se pudo copiar el Rooming List");
    }
  };

  const canEdit = !readOnly;
  const roomTitles = getRoomTitles(hotel.rooms);
  const findRoom = (roomId: string) => hotel.rooms.find((room) => room.id === roomId);

  /**
   * Elimina la cama solo si el tablero sigue como cuando se abrió el diálogo: los lugares siguientes
   * se recorren al eliminar una cama, así que un índice viejo borraría otra cama (o ninguna).
   */
  const confirmBedDeletion = (target: TargetBedDeletion) => {
    setBedTarget(null);
    const room = findRoom(target.roomId);
    const current = room
      ? buildBedDeletionTarget(room, roomTitles[room.id], target.slotIndex, lodging.passengers)
      : null;
    const sameOccupants = (ids: string[]) => ids.join("|");
    const isUnchanged =
      room !== undefined &&
      !busyRoomIds.has(room.id) &&
      room.matrimonialBeds + room.singleBeds > 1 &&
      target.slotIndex <= room.capacity &&
      sameOccupants(current?.assignedPassengers.map((item) => item.id) ?? []) ===
        sameOccupants(target.assignedPassengers.map((item) => item.id)) &&
      current?.slotsCount === target.slotsCount;
    if (!isUnchanged) {
      toast.error("La cama cambió", {
        description:
          "El tablero se actualizó mientras confirmabas. Revísalo y vuelve a intentarlo.",
      });
      return;
    }
    deleteBed.mutate({ roomId: target.roomId, slotIndex: target.slotIndex });
  };

  const confirmRoomDeletion = ({ roomId }: TargetRoomDeletion) => {
    setRoomTarget(null);
    if (!findRoom(roomId) || busyRoomIds.has(roomId)) return;
    deleteRoom.mutate({ roomId });
  };

  return (
    <div className="space-y-5 rounded-2xl bg-slate-50/70 p-1 sm:p-2">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            Hospedaje y Rooming List
            <span
              role="status"
              aria-live="polite"
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600"
            >
              {isUpdating && (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Actualizando…
                </>
              )}
            </span>
          </h2>
          <p className="text-sm text-slate-500">
            Control de distribución de habitaciones y asignación de camas para esta salida
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleCopy()}
            className="gap-2 rounded-xl"
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copiar Rooming List
          </Button>
          {canEdit && onRegisterClick && (
            <Button
              type="button"
              onClick={() => onRegisterClick(hotel.name)}
              className="gap-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Registrar habitaciones
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {lodging.hotels.length > 1 && (
          <div
            className="flex flex-wrap gap-1.5 rounded-2xl bg-slate-100 p-1.5"
            role="group"
            aria-label="Hotel activo"
          >
            {lodging.hotels.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={item.id === hotel.id}
                onClick={() => setSelectedHotelId(item.id)}
                className={cn(
                  "min-h-10 rounded-xl px-4 text-sm font-semibold transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 focus-visible:outline-none",
                  item.id === hotel.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-white hover:text-slate-900",
                )}
              >
                {item.name}
              </button>
            ))}
          </div>
        )}
        {lodging.hotels.length === 1 && (
          <span className="text-sm font-semibold text-slate-800">{hotel.name}</span>
        )}
        {canEdit && onRegisterClick && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRegisterClick()}
            className="gap-1.5 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Agregar otro hotel
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-busy={isUpdating}>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Pasajeros alojados</p>
          <p className={cn("mt-1 text-xl font-bold text-slate-900", isUpdating && "animate-pulse")}>
            {assignedCount} / {totalPassengers}
          </p>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label="Pasajeros alojados"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div className="h-full rounded-full bg-indigo-600" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs font-semibold text-emerald-700">Disponibilidad</p>
          <p
            className={cn("mt-1 text-xl font-bold text-emerald-800", isUpdating && "animate-pulse")}
          >
            {freeBedsCount} camas libres
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Habitaciones</p>
          <p className={cn("mt-1 text-xl font-bold text-slate-900", isUpdating && "animate-pulse")}>
            {hotel.rooms.length} {hotel.rooms.length === 1 ? "habitación" : "habitaciones"} ·{" "}
            {hotelCapacity} {hotelCapacity === 1 ? "lugar" : "lugares"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <UnassignedSidebar
            // Cada hotel tiene su propia lista y búsqueda.
            key={hotel.id}
            hotelName={hotel.name}
            stayLabel={stayLabel}
            passengers={unassigned}
            isUpdating={isUpdating}
            freeBeds={freeBeds}
            hasFreeMatrimonialBed={Boolean(freeMatrimonialBed)}
            onAssign={
              canEdit
                ? (bed, bookingPassengerId) =>
                    assign.mutate({
                      roomId: bed.roomId,
                      assignments: [{ slotIndex: bed.slotIndex, bookingPassengerId }],
                    })
                : undefined
            }
            onAssignCouple={
              canEdit && freeMatrimonialBed
                ? ([first, second]) =>
                    assign.mutate({
                      roomId: freeMatrimonialBed.roomId,
                      assignments: [
                        { slotIndex: freeMatrimonialBed.slotIndexes[0], bookingPassengerId: first },
                        {
                          slotIndex: freeMatrimonialBed.slotIndexes[1],
                          bookingPassengerId: second,
                        },
                      ],
                    })
                : undefined
            }
          />
        </div>
        <div className="lg:col-span-8">
          <RoomGrid
            key={hotel.id}
            rooms={hotel.rooms}
            busyRoomIds={busyRoomIds}
            registeringCount={registeringCount}
            onRegisterClick={
              canEdit && onRegisterClick ? () => onRegisterClick(hotel.name) : undefined
            }
            onDeleteRoom={
              canEdit
                ? (roomId) => {
                    const room = findRoom(roomId);
                    if (room) setRoomTarget(buildRoomDeletionTarget(room, roomTitles[roomId]));
                  }
                : undefined
            }
            onDeleteBed={
              canEdit
                ? (roomId, slotIndex) => {
                    const room = findRoom(roomId);
                    if (room) {
                      setBedTarget(
                        buildBedDeletionTarget(
                          room,
                          roomTitles[roomId],
                          slotIndex,
                          lodging.passengers,
                        ),
                      );
                    }
                  }
                : undefined
            }
            passengersById={passengersById}
            availablePassengers={unassigned}
            onAssign={
              canEdit
                ? (roomId, slotIndex, bookingPassengerId) =>
                    assign.mutate({ roomId, assignments: [{ slotIndex, bookingPassengerId }] })
                : undefined
            }
            onUnassign={
              canEdit ? (roomId, slotIndex) => unassign.mutate({ roomId, slotIndex }) : undefined
            }
            onRoomNumberChange={
              canEdit
                ? (roomId, roomNumber) => updateRoom.mutate({ roomId, roomNumber })
                : undefined
            }
          />
        </div>
      </div>

      {/* Se cierran al confirmar (la caché ya refleja el cambio): un segundo clic no repite la baja. */}
      <DeleteBedModal
        targetBed={bedTarget}
        onClose={() => setBedTarget(null)}
        onConfirm={confirmBedDeletion}
      />
      <DeleteRoomModal
        targetRoom={roomTarget}
        onClose={() => setRoomTarget(null)}
        onConfirm={confirmRoomDeletion}
      />
    </div>
  );
}
