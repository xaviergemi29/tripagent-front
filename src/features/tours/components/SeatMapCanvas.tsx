"use client";

import { useEffect, useState } from "react";
import {
  ShieldAlert,
  RefreshCcw,
  Trash2,
  ShieldCheck,
  ShieldOff,
  UserPlus,
  AlertTriangle,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useTourSeats, useUpdateSeat, SeatInfo } from "../hooks/useTourSeats";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getInitials } from "@/shared/utils/travelers-helpers";
import { cn } from "@/lib/utils";
import type { LayoutMap } from "@/features/vehicles/schemas/vehicle.schema";
import { parseVehicleLayout } from "@/features/vehicles/utils/vehicle-layout.util";
import {
  VehicleLayoutGrid,
  type LayoutSeat,
} from "@/features/vehicles/components/VehicleLayoutGrid";

interface Passenger {
  id: string;
  fullName: string;
  bookingId: string;
}

interface SeatMapCanvasProps {
  tourId: string;
  layoutMap: LayoutMap;
  activePassengers: Passenger[];
  initialSelectedPassengerId?: string | null;
  /** Lugares de staff del tour: tope de asientos de staff (croquis + bloqueos). La API lo valida. */
  staffCapacity?: number;
}

const SEAT_BASE =
  "relative flex h-full w-full flex-col items-center justify-center rounded-lg border-2 transition-all active:scale-95";

/** Etiqueta de esquina con el número de asiento. */
function SeatCornerLabel({ label }: { label: string }) {
  return (
    <span className="absolute top-0.5 left-1 text-[8px] font-bold opacity-75 sm:top-1 sm:left-1.5 sm:text-[9px]">
      {label}
    </span>
  );
}

export function SeatMapCanvas({
  tourId,
  layoutMap,
  initialSelectedPassengerId,
  staffCapacity = 0,
}: SeatMapCanvasProps) {
  const { data: assignedSeats = [] } = useTourSeats(tourId);
  const { mutate: updateSeat } = useUpdateSeat(tourId);

  const [selectedPassengerId, setSelectedPassengerId] = useState<string | null>(null);

  useEffect(() => {
    if (initialSelectedPassengerId) {
      setSelectedPassengerId(initialSelectedPassengerId);
    }
  }, [initialSelectedPassengerId]);

  const layout = parseVehicleLayout(layoutMap);
  const layoutSeats = layout.seats;
  const hasDriver = layout.items.some((item) => item.type === "DRIVER");
  const hasWc = layout.items.some((item) => item.type === "WC");
  const layoutLabels = new Set(layoutSeats.map((seat) => seat.label));
  const layoutStaffSeats = layoutSeats.filter((seat) => seat.kind === "STAFF").length;

  const getSeatInfo = (label: string): SeatInfo | undefined =>
    assignedSeats.find((s) => s.seatLabel === label);

  // Mismo tope que la API: asientos de staff del croquis + bloqueos ≤ lugares de staff del tour.
  const blockedCount = assignedSeats.filter((s) => s.status === "BLOCKED").length;
  const staffSeatsInUse = layoutStaffSeats + blockedCount;
  const canBlockMore = staffSeatsInUse < staffCapacity;

  // Asignaciones con una etiqueta que no existe en este croquis (p. ej. de un croquis anterior):
  // se listan para que nunca queden ocultas y el operador pueda liberarlas.
  const orphanSeats = assignedSeats.filter(
    (seat) => seat.status === "ASSIGNED" && !layoutLabels.has(seat.seatLabel),
  );

  // Reserva el asiento para chofer, guía o coordinador; deja de estar disponible para pasajeros.
  const handleBlockSeat = (seatLabel: string): void => {
    updateSeat({ seatLabel, status: "BLOCKED", passengerId: null });
  };

  const handleUnblockSeat = (seatLabel: string): void => {
    updateSeat({ seatLabel, status: "AVAILABLE", passengerId: null });
  };

  const handleEmptySeatClick = (seatLabel: string): void => {
    if (!selectedPassengerId) {
      toast.info("Selecciona primero a un pasajero de la lista.");
      return;
    }
    updateSeat({ seatLabel, status: "ASSIGNED", passengerId: selectedPassengerId });
    setSelectedPassengerId(null);
    toast.success(`✅ Asiento ${seatLabel} asignado.`);
  };

  const handleRemoveSeat = (seatLabel: string): void => {
    updateSeat({ seatLabel, status: "AVAILABLE", passengerId: null });
    toast.success("🗑️ Pasajero regresado a la lista de espera.");
  };

  const handleChangeSeat = (passengerId: string): void => {
    setSelectedPassengerId(passengerId);
    toast.info("Toca un asiento vacío para reubicarlo.");
  };

  const renderSeat = (seat: LayoutSeat) => {
    const { label: seatLabel } = seat;

    // Asiento de staff definido por el croquis (p. ej. copiloto de la Sprinter): reservado.
    if (seat.kind === "STAFF") {
      return (
        <div
          title={`Asiento ${seatLabel} · Staff (reservado por el croquis)`}
          aria-label={`Asiento ${seatLabel} reservado para staff`}
          className={cn(
            SEAT_BASE,
            "cursor-default border-amber-400 bg-amber-50 text-amber-700 active:scale-100",
          )}
        >
          <SeatCornerLabel label={seatLabel} />
          <BadgeCheck className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-[8px] font-bold uppercase sm:text-[9px]">Staff</span>
        </div>
      );
    }

    const info = getSeatInfo(seatLabel);
    const isBlocked = info?.status === "BLOCKED";
    const isAssigned = info?.status === "ASSIGNED";

    if (isAssigned && info?.passenger) {
      return (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <DropdownMenu>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      SEAT_BASE,
                      "border-indigo-600 bg-indigo-500 text-white shadow-md",
                    )}
                  >
                    <SeatCornerLabel label={seatLabel} />
                    <span className="mt-1 text-xs font-black tracking-widest sm:text-sm">
                      {getInitials(info.passenger.fullName)}
                    </span>
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>

              <TooltipContent
                side="top"
                className="rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg"
              >
                <p>{info.passenger.fullName}</p>
                <span className="text-[10px] text-indigo-300">Asiento {seatLabel}</span>
              </TooltipContent>

              <DropdownMenuContent align="center" className="w-56">
                <DropdownMenuLabel className="text-xs font-normal text-slate-500">
                  Pasajero:{" "}
                  <strong className="block text-sm text-slate-900">
                    {info.passenger.fullName}
                  </strong>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => handleChangeSeat(info.passenger!.id)}
                  className="cursor-pointer"
                >
                  <RefreshCcw className="mr-2 h-4 w-4 text-slate-500" /> Mover de asiento
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleRemoveSeat(seatLabel)}
                  className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Quitar asiento
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (isBlocked) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              title={`Asiento ${seatLabel} · Bloqueado / Staff`}
              aria-label={`Asiento ${seatLabel} bloqueado para staff`}
              className={cn(SEAT_BASE, "cursor-pointer border-red-300 bg-red-50 text-red-400")}
            >
              <SeatCornerLabel label={seatLabel} />
              <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56">
            <DropdownMenuLabel className="text-xs font-normal text-slate-500">
              Asiento {seatLabel}
              <strong className="block text-sm text-slate-900">Bloqueado / Staff</strong>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleUnblockSeat(seatLabel)}
              className="cursor-pointer"
            >
              <ShieldOff className="mr-2 h-4 w-4 text-slate-500" /> Liberar asiento
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    // Con un pasajero seleccionado, tocar un asiento libre lo asigna directamente.
    if (selectedPassengerId) {
      return (
        <button
          onClick={() => handleEmptySeatClick(seatLabel)}
          title="Disponible"
          className={cn(
            SEAT_BASE,
            "cursor-pointer border-dashed border-indigo-400 bg-indigo-50/50 text-slate-400 hover:border-indigo-500",
          )}
        >
          <span className="text-xs font-bold sm:text-sm">{seatLabel}</span>
        </button>
      );
    }

    // Sin pasajero seleccionado: menú para reservar el asiento al staff.
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            title="Disponible"
            className={cn(
              SEAT_BASE,
              "cursor-pointer border-slate-300 bg-white text-slate-400 hover:border-indigo-400",
            )}
          >
            <span className="text-xs font-bold sm:text-sm">{seatLabel}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-64">
          <DropdownMenuLabel className="text-xs font-normal text-slate-500">
            Asiento {seatLabel}
            <strong className="block text-sm text-slate-900">Disponible</strong>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!canBlockMore}
            onClick={() => handleBlockSeat(seatLabel)}
            className="cursor-pointer"
          >
            <ShieldCheck className="mr-2 h-4 w-4 text-red-500" /> Bloquear para staff
          </DropdownMenuItem>
          {!canBlockMore && (
            <p className="px-2 pb-1.5 text-[11px] leading-snug text-slate-500">
              {staffCapacity === 0
                ? "Este tour no tiene lugares de staff. Auméntalos al editar el tour."
                : `Ya están ocupados los ${staffCapacity} lugar(es) de staff del tour.`}
            </p>
          )}
          <DropdownMenuSeparator />
          <p className="flex items-start gap-2 px-2 py-1.5 text-[11px] leading-snug text-slate-500">
            <UserPlus className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Para sentar a un pasajero, selecciónalo primero en &quot;Faltan por acomodar&quot;.
          </p>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Resumen de staff: asientos del croquis + bloqueos frente a los lugares de staff del tour */}
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-slate-600">
        <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
        <span>
          Staff: <strong className="text-slate-900">{staffSeatsInUse}</strong> de{" "}
          <strong className="text-slate-900">{staffCapacity}</strong> lugar(es)
          {layoutStaffSeats > 0 && ` (${layoutStaffSeats} del croquis)`}
        </span>
        {!selectedPassengerId && canBlockMore && (
          <span className="text-slate-400">· Toca un asiento libre para reservarlo al staff</span>
        )}
      </div>

      {orphanSeats.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="flex items-start gap-2 font-medium">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            {orphanSeats.length} pasajero(s) tienen un asiento que no existe en este vehículo.
            Libéralos para volver a acomodarlos.
          </p>
          <ul className="flex flex-wrap gap-2">
            {orphanSeats.map((seat) => (
              <li
                key={seat.seatLabel}
                className="flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-2 py-1"
              >
                <span>
                  {seat.passenger?.fullName ?? "Pasajero"} · {seat.seatLabel}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveSeat(seat.seatLabel)}
                  className="font-semibold text-amber-700 underline hover:text-amber-900"
                >
                  Liberar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* EL LIENZO (CANVAS) */}
      <div className="flex justify-center overflow-x-auto rounded-xl border bg-slate-50 p-3 sm:p-6">
        <VehicleLayoutGrid layoutMap={layoutMap} renderSeat={renderSeat} />
      </div>

      {/* Leyenda compartida (escritorio y móvil) */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-medium text-slate-600">
        <LegendItem className="border border-slate-300 bg-white" label="Disponible" />
        <LegendItem className="bg-indigo-500" label="Asignado" />
        <LegendItem className="border border-red-300 bg-red-100" label="Bloqueado (staff)" />
        {layoutStaffSeats > 0 && (
          <LegendItem className="border border-amber-400 bg-amber-100" label="Asiento de staff" />
        )}
        {hasDriver && <LegendItem className="bg-slate-800" label="Operador (no es asiento)" />}
        {hasWc && (
          <LegendItem className="border border-dashed border-sky-300 bg-sky-50" label="WC" />
        )}
      </div>
    </div>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("h-3 w-3 rounded", className)} />
      <span>{label}</span>
    </div>
  );
}
