"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, RefreshCcw, Trash2 } from "lucide-react";
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

interface Passenger {
  id: string;
  fullName: string;
  bookingId: string;
}

interface SeatMapCanvasProps {
  tourId: string;
  layoutMap: (string | null | undefined)[][];
  activePassengers: Passenger[];
  initialSelectedPassengerId?: string | null;
}

export function SeatMapCanvas({
  tourId,
  layoutMap,
  initialSelectedPassengerId,
}: SeatMapCanvasProps) {
  const { data: assignedSeats = [] } = useTourSeats(tourId);
  const { mutate: updateSeat } = useUpdateSeat(tourId);

  const [selectedPassengerId, setSelectedPassengerId] = useState<string | null>(null);

  useEffect(() => {
    if (initialSelectedPassengerId) {
      setSelectedPassengerId(initialSelectedPassengerId);
    }
  }, [initialSelectedPassengerId]);

  const getSeatInfo = (label: string): SeatInfo | undefined =>
    assignedSeats.find((s) => s.seatLabel === label);

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
    </div>
  );
}
