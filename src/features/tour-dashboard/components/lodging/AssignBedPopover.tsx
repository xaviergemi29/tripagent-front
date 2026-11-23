"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { FreeBed } from "../../utils/lodging.util";

interface AssignBedPopoverProps {
  freeBeds: FreeBed[];
  passengerName: string;
  onSelect: (bed: FreeBed) => void;
}

/** "Asignar" de un pasajero: lista las camas libres del hotel activo. */
export function AssignBedPopover({ freeBeds, passengerName, onSelect }: AssignBedPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Asignar a ${passengerName}`}
          className="h-8 shrink-0 rounded-lg border-indigo-200 px-3 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
        >
          Asignar
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 gap-1 rounded-xl p-2">
        {freeBeds.length === 0 ? (
          <p className="px-2 py-3 text-center text-xs text-slate-500">
            No hay camas libres en este hotel.
          </p>
        ) : (
          <ul className="max-h-56 space-y-0.5 overflow-y-auto">
            {freeBeds.map((bed) => (
              <li key={`${bed.roomId}-${bed.slotIndex}`}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(bed);
                    setIsOpen(false);
                  }}
                  className="w-full rounded-lg px-2.5 py-1.5 text-left text-sm text-slate-800 transition-colors hover:bg-indigo-50"
                >
                  {bed.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
