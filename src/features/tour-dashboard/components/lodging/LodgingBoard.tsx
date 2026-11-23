"use client";

import { useState } from "react";
import { Copy, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LODGING_ROOM_STATUS, LODGING_SLOT_INDEX } from "@/shared/constants/domain.constants";
import { copyToClipboard } from "@/shared/utils/clipboard";
import {
  useAssignLodgingRoom,
  useDeleteLodgingBed,
  useDeleteLodgingRoom,
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
  findEmptyMatrimonial,
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
  const [bedTarget, setBedTarget] = useState<TargetBedDeletion | null>(null);
  const [roomTarget, setRoomTarget] = useState<TargetRoomDeletion | null>(null);

  const hotel = lodging.hotels.find((item) => item.id === selectedHotelId) ?? lodging.hotels[0];
  const stayLabel = buildStayLabel(departureDateTime, returnDate);
  const passengersById = Object.fromEntries(
    lodging.passengers.map((passenger) => [passenger.bookingPassengerId, passenger]),
  );
  const unassigned = getUnassignedPassengers(hotel, lodging.passengers);
  const freeBeds = getFreeBeds(hotel.rooms);
  const emptyMatrimonial = findEmptyMatrimonial(hotel.rooms);

  const assignedCount = getHotelAssignedIds(hotel).size;
  const totalPassengers = lodging.passengers.length;
  const freeBedsCount = hotel.rooms.reduce((sum, room) => sum + getRoomFreeBeds(room), 0);
  const confirmedCount = hotel.rooms.filter(
    (room) => room.status === LODGING_ROOM_STATUS.CONFIRMED,
  ).length;
  const consultedCount = hotel.rooms.length - confirmedCount;
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

  return (
    <div className="space-y-5 rounded-2xl bg-slate-50/70 p-1 sm:p-2">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Hospedaje y Rooming List</h2>
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
          <div className="flex flex-wrap gap-2" role="group" aria-label="Hotel activo">
            {lodging.hotels.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={item.id === hotel.id}
                onClick={() => setSelectedHotelId(item.id)}
                className={cn(
                  "rounded-xl border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                  item.id === hotel.id
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Pasajeros alojados</p>
          <p className="mt-1 text-xl font-bold text-slate-900">
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
          <p className="mt-1 text-xl font-bold text-emerald-800">{freeBedsCount} camas libres</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Estado de cuartos</p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {confirmedCount} Conf. · {consultedCount} Consult.
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
            freeBeds={freeBeds}
            hasEmptyMatrimonial={Boolean(emptyMatrimonial)}
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
              canEdit && emptyMatrimonial
                ? ([first, second]) =>
                    assign.mutate({
                      roomId: emptyMatrimonial.id,
                      assignments: [
                        { slotIndex: LODGING_SLOT_INDEX.first, bookingPassengerId: first },
                        { slotIndex: LODGING_SLOT_INDEX.first + 1, bookingPassengerId: second },
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
            onConfirm={
              canEdit
                ? (roomId) => updateRoom.mutate({ roomId, status: LODGING_ROOM_STATUS.CONFIRMED })
                : undefined
            }
          />
        </div>
      </div>

      <DeleteBedModal
        targetBed={bedTarget}
        isDeleting={deleteBed.isPending}
        onClose={() => setBedTarget(null)}
        onConfirm={({ roomId, slotIndex }) =>
          deleteBed.mutate({ roomId, slotIndex }, { onSettled: () => setBedTarget(null) })
        }
      />
      <DeleteRoomModal
        targetRoom={roomTarget}
        isDeleting={deleteRoom.isPending}
        onClose={() => setRoomTarget(null)}
        onConfirm={({ roomId }) =>
          deleteRoom.mutate({ roomId }, { onSettled: () => setRoomTarget(null) })
        }
      />
    </div>
  );
}
