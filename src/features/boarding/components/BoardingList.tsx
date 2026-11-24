"use client";

import { useState } from "react";
import { BedDouble, Check, Lock, MapPin, Search, Armchair } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatPickupTime } from "@/shared/utils/tour-date.util";
import type { BoardingListItem, BoardingPointOutput } from "../schemas/boarding.schema";
import {
  BOARDING_FILTER_LABELS,
  BOARDING_FILTERS,
  countBoarded,
  filterBoardingItems,
  formatBoardingRoom,
  getDefaultBoardingFilter,
  hasMultipleHotels,
  type BoardingFilter,
} from "../utils/boarding.util";

interface BoardingListProps {
  items: BoardingListItem[];
  boardingPoints: BoardingPointOutput[];
  temporalStatus: string;
  /** Sin callback la lista es de solo consulta (tour finalizado o cancelado, o Solo Lectura). */
  onToggle?: (id: string, boarded: boolean) => void;
  /** Motivo del modo consulta, para explicarlo arriba de la lista. */
  readOnlyMessage?: string;
}

const boardedTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Mexico_City",
  });

/**
 * Pase de lista de abordaje (RB-MAN-002): contador en vivo, búsqueda, filtros Faltan / Abordados /
 * Todos y renglones táctiles con un botón grande para palomear con una mano. Presentacional: la
 * marca optimista y la sincronización las hace el contenedor (panel o enlace de staff).
 */
export function BoardingList({
  items,
  boardingPoints,
  temporalStatus,
  onToggle,
  readOnlyMessage,
}: BoardingListProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<BoardingFilter>(() =>
    getDefaultBoardingFilter(temporalStatus),
  );

  const total = items.length;
  const boarded = countBoarded(items);
  const percent = total > 0 ? Math.round((boarded / total) * 100) : 0;
  const visible = filterBoardingItems(items, filter, query);
  const withHotel = hasMultipleHotels(items);
  const pointByCode = new Map(boardingPoints.map((point) => [point.code, point]));

  return (
    <section aria-labelledby="boarding-title" className="space-y-3">
      <div className="space-y-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="boarding-title" className="text-sm font-bold text-slate-900">
            Pase de lista
          </h2>
          <p className="text-sm text-slate-600" aria-live="polite">
            Abordados:{" "}
            <strong className="text-base font-extrabold text-slate-900">
              {boarded} de {total}
            </strong>{" "}
            pasajeros
          </p>
        </div>
        <div
          role="progressbar"
          aria-label="Pasajeros abordados"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
        >
          <div
            className={cn(
              "h-full rounded-full transition-all",
              boarded === total && total > 0 ? "bg-emerald-500" : "bg-indigo-600",
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {readOnlyMessage && (
        <p className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {readOnlyMessage}
        </p>
      )}

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar pasajero o titular..."
          aria-label="Buscar pasajero o titular"
          className="h-11 rounded-xl bg-white pl-9 text-base sm:text-sm"
        />
      </div>

      <div className="flex gap-2" role="group" aria-label="Filtrar por abordaje">
        {BOARDING_FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={filter === option}
            onClick={() => setFilter(option)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
              filter === option
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            )}
          >
            {BOARDING_FILTER_LABELS[option]}
            {option === "missing" && ` (${total - boarded})`}
            {option === "boarded" && ` (${boarded})`}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          {total === 0
            ? "Este tour aún no tiene pasajeros registrados."
            : filter === "missing" && boarded === total
              ? "¡Ya abordaron todos!"
              : "Ningún pasajero coincide con la búsqueda."}
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((item) => {
            const isBoarded = item.boardedAt !== null;
            const point = item.boardingPointCode ? pointByCode.get(item.boardingPointCode) : null;
            return (
              <li
                key={item.id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3 transition-colors",
                  isBoarded ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200 bg-white",
                )}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-base font-semibold text-slate-900">{item.fullName}</p>
                  <p className="truncate text-xs text-slate-500">
                    {item.isTitular ? "Titular de la reserva" : `Titular: ${item.holderName}`}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                      {point
                        ? `${point.code} · ${point.location}${point.time ? ` · ${formatPickupTime(point.time)}` : ""}`
                        : "Sin punto"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Armchair className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                      {item.seatLabel ? `Asiento ${item.seatLabel}` : "Sin asiento"}
                    </span>
                    {item.rooms.length > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <BedDouble className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                        {item.rooms.map((room) => formatBoardingRoom(room, withHotel)).join(", ")}
                      </span>
                    )}
                  </div>
                  {isBoarded && item.boardedAt && (
                    <p className="text-xs font-semibold text-emerald-700">
                      Abordó {boardedTime(item.boardedAt)}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!onToggle}
                  aria-pressed={isBoarded}
                  aria-label={
                    isBoarded
                      ? `Quitar abordaje de ${item.fullName}`
                      : `Marcar a ${item.fullName} como abordado`
                  }
                  onClick={() => onToggle?.(item.id, !isBoarded)}
                  className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 transition-all active:scale-95 disabled:cursor-not-allowed",
                    isBoarded
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-300 bg-white text-transparent hover:border-indigo-400",
                    !onToggle && "opacity-60",
                  )}
                >
                  <Check className="h-7 w-7 stroke-[3]" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
