"use client";

import { useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { LodgingPassengerOutput } from "../../schemas/lodging.schema";
import { matchesPassengerSearch } from "../../utils/lodging.util";

interface AssignPassengerPopoverProps {
  /** Pasajeros sin cama en el hotel activo. */
  passengers: LodgingPassengerOutput[];
  onSelect: (bookingPassengerId: string) => void;
  /** Botón que abre el selector. */
  children: ReactNode;
}

/** Selector con buscador de pasajeros sin cama: una cama libre elige a quién asignar. */
export function AssignPassengerPopover({
  passengers,
  onSelect,
  children,
}: AssignPassengerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const visible = passengers.filter((passenger) => matchesPassengerSearch(query, passenger));

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setQuery("");
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="w-72 gap-2 rounded-xl p-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar pasajero o grupo..."
            aria-label="Buscar pasajero sin habitación"
            className="h-9 pl-8 text-base sm:text-sm"
          />
        </div>
        {visible.length === 0 ? (
          <p className="px-2 py-3 text-center text-xs text-slate-500">
            No hay pasajeros sin habitación.
          </p>
        ) : (
          <ul className="max-h-56 space-y-0.5 overflow-y-auto">
            {visible.map((passenger) => (
              <li key={passenger.bookingPassengerId}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(passenger.bookingPassengerId);
                    setIsOpen(false);
                  }}
                  className="flex w-full flex-col rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-indigo-50"
                >
                  <span className="text-sm font-medium text-slate-900">{passenger.fullName}</span>
                  <span className="text-xs text-slate-500">
                    {passenger.groupLabel}
                    {passenger.seatLabel ? ` · Asiento ${passenger.seatLabel}` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
