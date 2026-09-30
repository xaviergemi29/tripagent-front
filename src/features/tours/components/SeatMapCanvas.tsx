"use client";

import { useState } from "react";
import { User, ShieldAlert, Link as LinkIcon, RefreshCcw, Trash2 } from "lucide-react";
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

interface Passenger {
  id: string;
  fullName: string;
  bookingId: string; // 🚀 Requerido para el contexto de grupo
}

interface Props {
  tourId: string;
  layoutMap: (string | null | undefined)[][];
  activePassengers: Passenger[];
}

// Helper para extraer iniciales ("Xavier Ramos" -> "XR")
const getInitials = (name: string) => {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

export function SeatMapCanvas({ tourId, layoutMap, activePassengers }: Props) {
  const { data: assignedSeats = [] } = useTourSeats(tourId);
  const { mutate: updateSeat } = useUpdateSeat(tourId);

  const [selectedPassengerId, setSelectedPassengerId] = useState<string | null>(null);

  const getSeatInfo = (label: string): SeatInfo | undefined =>
    assignedSeats.find((s: any) => s.seatLabel === label);

  // Obtener el bookingId del pasajero seleccionado para resaltar a sus acompañantes
  const selectedBookingId = activePassengers.find((p) => p.id === selectedPassengerId)?.bookingId;

  // Filtrar "Pasajeros en espera" (Microcopy PM)
  const benchPassengers = activePassengers.filter(
    (p) => !assignedSeats.some((s: any) => s.passenger?.id === p.id && s.status === "ASSIGNED"),
  );

  const handleEmptySeatClick = (seatLabel: string) => {
    if (!selectedPassengerId) {
      toast.info("Selecciona primero a un pasajero de la lista.");
      return;
    }
    updateSeat({ seatLabel, status: "ASSIGNED", passengerId: selectedPassengerId });
    setSelectedPassengerId(null);
    toast.success(`✅ Asiento ${seatLabel} asignado.`);
  };

  const handleRemoveSeat = (seatLabel: string) => {
    updateSeat({ seatLabel, status: "AVAILABLE", passengerId: null });
    toast.success("🗑️ Pasajero regresado a la lista de espera.");
  };

  const handleChangeSeat = (passengerId: string) => {
    // Ponemos al pasajero en la mano del operador para que toque un nuevo asiento
    setSelectedPassengerId(passengerId);
    toast.info("Toca un asiento vacío para reubicarlo.");
  };

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      {/* EL LIENZO (CANVAS) */}
      <div className="flex flex-1 justify-center overflow-x-auto rounded-xl border bg-slate-50 p-6">
        <div className="flex flex-col gap-2">
          {layoutMap.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-2">
              {row.map((seatLabel, colIndex) => {
                if (!seatLabel || seatLabel === "AISLE") {
                  return <div key={`aisle-${rowIndex}-${colIndex}`} className="h-14 w-14" />;
                }

                const info = getSeatInfo(seatLabel);
                const isBlocked = info?.status === "BLOCKED";
                const isAssigned = info?.status === "ASSIGNED";

                // ESTADO 1: Ocupado (Dropdown Menu para editar)
                if (isAssigned && info?.passenger) {
                  return (
                    <TooltipProvider key={seatLabel} delayDuration={200}>
                      <Tooltip>
                        <DropdownMenu>
                          <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                              <button className="relative flex h-14 w-14 flex-col items-center justify-center rounded-lg border-2 border-indigo-600 bg-indigo-500 text-white shadow-md transition-transform active:scale-95">
                                <span className="absolute top-1 left-1.5 text-[9px] font-bold opacity-75">
                                  {seatLabel}
                                </span>
                                <span className="mt-1 text-sm font-black tracking-widest">
                                  {getInitials(info.passenger.fullName)}
                                </span>
                              </button>
                            </DropdownMenuTrigger>
                          </TooltipTrigger>

                          {/* Tooltip visible en Desktop al hacer hover */}
                          <TooltipContent
                            side="top"
                            className="rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg"
                          >
                            <p>{info.passenger.fullName}</p>
                            <span className="text-[10px] text-indigo-300">Asiento {seatLabel}</span>
                          </TooltipContent>

                          {/* Menú desplegable / Action sheet visible en Desktop y Mobile al hacer TAP */}
                          <DropdownMenuContent align="center" className="w-56">
                            {/* 🚀 Encabezado para Mobile: Revela la información al hacer tap */}
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
                              <RefreshCcw className="mr-2 h-4 w-4 text-slate-500" /> Mover de
                              asiento
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

                // ESTADO 2 y 3: Vacío o Bloqueado (Tap-to-Assign)
                return (
                  <button
                    key={seatLabel}
                    onClick={() => !isBlocked && handleEmptySeatClick(seatLabel)}
                    title={isBlocked ? "Bloqueado / Staff" : "Disponible"}
                    className={`relative flex h-14 w-14 flex-col items-center justify-center rounded-lg border-2 transition-all active:scale-95 ${isBlocked ? "cursor-not-allowed border-red-300 bg-red-50 text-red-400" : ""} ${!isBlocked ? "cursor-pointer border-slate-300 bg-white text-slate-400 hover:border-indigo-400" : ""} ${selectedPassengerId && !isBlocked ? "border-dashed border-indigo-400 bg-indigo-50/50" : ""} `}
                  >
                    {isBlocked ? (
                      <ShieldAlert className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-bold">{seatLabel}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* EL BANQUILLO (SIDEBAR) */}
      <div className="h-fit max-h-[600px] w-full overflow-y-auto rounded-xl border bg-white p-4 md:w-80">
        <h3 className="mb-4 flex items-center justify-between font-bold text-slate-800">
          <span>Faltan por acomodar</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {benchPassengers.length}
          </span>
        </h3>

        <div className="flex flex-col gap-2">
          {benchPassengers.map((p) => {
            const isSelected = selectedPassengerId === p.id;
            // Destello visual para acompañantes del mismo grupo
            const isSameGroup = selectedBookingId === p.bookingId && !isSelected;

            return (
              <button
                key={p.id}
                onClick={() => setSelectedPassengerId(isSelected ? null : p.id)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-all ${isSelected ? "border-indigo-500 bg-indigo-50 shadow-sm ring-1 ring-indigo-500" : ""} ${isSameGroup ? "border-dashed border-indigo-200 bg-indigo-50/50" : ""} ${!isSelected && !isSameGroup ? "border-slate-200 hover:bg-slate-50" : ""} `}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <User
                    className={`h-4 w-4 flex-shrink-0 ${isSelected || isSameGroup ? "text-indigo-600" : "text-slate-400"}`}
                  />
                  <span
                    className={`truncate text-sm font-medium ${isSelected ? "text-indigo-900" : "text-slate-700"}`}
                  >
                    {p.fullName}
                  </span>
                </div>
                {/* Indicador de familia/grupo visual */}
                {isSameGroup && (
                  <span
                    title="Viaja con la persona seleccionada"
                    className="flex-shrink-0 cursor-help"
                  >
                    <LinkIcon className="h-3 w-3 text-indigo-400" />
                  </span>
                )}
              </button>
            );
          })}

          {benchPassengers.length === 0 && (
            <div className="py-8 text-center">
              <span className="text-2xl">🎉</span>
              <p className="mt-2 text-sm font-bold text-emerald-600">¡Todos tienen asiento!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
