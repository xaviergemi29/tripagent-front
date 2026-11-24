"use client";

import { useState } from "react";
import { Building2, Heart, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { LodgingPassengerOutput } from "../../schemas/lodging.schema";
import {
  getInitials,
  groupUnassignedPassengers,
  matchesPassengerSearch,
  type FreeBed,
} from "../../utils/lodging.util";
import { AssignBedPopover } from "./AssignBedPopover";

interface UnassignedSidebarProps {
  hotelName: string;
  /** Fechas del tour: el hotel no guarda fechas propias. */
  stayLabel: string;
  /** Pasajeros sin cama en el hotel activo. */
  passengers: LodgingPassengerOutput[];
  /** Hay cambios del hospedaje en curso: la lista y su conteo se marcan como "actualizando". */
  isUpdating?: boolean;
  freeBeds: FreeBed[];
  /** Hay una cama matrimonial con sus 2 lugares libres (habilita "Asignar pareja juntos"). */
  hasFreeMatrimonialBed: boolean;
  /** Sin callbacks (solo consulta) no se ofrece asignar. */
  onAssign?: (bed: FreeBed, bookingPassengerId: string) => void;
  onAssignCouple?: (bookingPassengerIds: [string, string]) => void;
}

export function UnassignedSidebar({
  hotelName,
  stayLabel,
  passengers,
  isUpdating = false,
  freeBeds,
  hasFreeMatrimonialBed,
  onAssign,
  onAssignCouple,
}: UnassignedSidebarProps) {
  const [query, setQuery] = useState("");
  const { groups, individuals } = groupUnassignedPassengers(passengers);
  const visibleGroups = groups
    .map((group) => ({
      group,
      visible: group.passengers.filter((passenger) => matchesPassengerSearch(query, passenger)),
    }))
    .filter(({ visible }) => visible.length > 0);
  const visibleIndividuals = individuals.filter((passenger) =>
    matchesPassengerSearch(query, passenger),
  );
  const hasResults = visibleGroups.length > 0 || visibleIndividuals.length > 0;

  const renderPassenger = (passenger: LodgingPassengerOutput) => (
    <li
      key={passenger.bookingPassengerId}
      className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5"
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600"
        aria-hidden="true"
      >
        {getInitials(passenger.fullName)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{passenger.fullName}</p>
        {passenger.seatLabel && (
          <p className="text-xs text-slate-500">Asiento {passenger.seatLabel}</p>
        )}
      </div>
      {onAssign && (
        <AssignBedPopover
          freeBeds={freeBeds}
          passengerName={passenger.fullName}
          onSelect={(bed) => onAssign(bed, passenger.bookingPassengerId)}
        />
      )}
    </li>
  );

  return (
    <div className="space-y-4">
      <section
        aria-label="Pasajeros sin habitación"
        aria-busy={isUpdating}
        className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
      >
        <header className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900">Pasajeros sin habitación</h3>
          <span
            className={cn(
              "rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-600",
              isUpdating && "animate-pulse",
            )}
            aria-label={`${passengers.length} sin habitación`}
          >
            {passengers.length}
          </span>
        </header>

        <div className="relative mb-3">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar pasajero o grupo..."
            aria-label="Buscar pasajero o grupo"
            className="h-10 rounded-xl pl-9 text-base sm:text-sm"
          />
        </div>

        {passengers.length === 0 ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-4 text-center text-sm font-medium text-emerald-700">
            Todos los pasajeros tienen cama en este hotel.
          </p>
        ) : !hasResults ? (
          <p className="px-3 py-4 text-center text-sm text-slate-500">Sin coincidencias.</p>
        ) : (
          <div className="space-y-4">
            {visibleGroups.map(({ group, visible }) => {
              const [first, second] = group.passengers;
              const canAssignCouple =
                group.passengers.length === 2 && hasFreeMatrimonialBed && Boolean(onAssignCouple);
              return (
                <div key={group.bookingId} className="space-y-2">
                  <h4 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Grupo · {group.groupLabel}
                  </h4>
                  {canAssignCouple && (
                    <button
                      type="button"
                      onClick={() =>
                        onAssignCouple?.([first.bookingPassengerId, second.bookingPassengerId])
                      }
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                    >
                      <Heart className="h-3.5 w-3.5" aria-hidden="true" />
                      Asignar pareja juntos a cama matrimonial
                    </button>
                  )}
                  <ul className="space-y-2">{visible.map(renderPassenger)}</ul>
                </div>
              );
            })}
            {visibleIndividuals.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  Viajeros individuales
                </h4>
                <ul className="space-y-2">{visibleIndividuals.map(renderPassenger)}</ul>
              </div>
            )}
          </div>
        )}
      </section>

      <section
        aria-label="Datos del establecimiento"
        className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
      >
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">
          <Building2 className="h-4 w-4 text-indigo-600" aria-hidden="true" />
          Datos del Establecimiento
        </h3>
        <p className="text-sm font-medium text-slate-800">{hotelName}</p>
        {stayLabel && <p className="mt-0.5 text-xs text-slate-500">{stayLabel}</p>}
      </section>
    </div>
  );
}
