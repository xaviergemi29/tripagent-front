"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatPickupTime } from "@/shared/utils/tour-date.util";
import type { StaffShareOutput } from "../schemas/staff-share.schema";
import {
  buildStaffShareView,
  rowMatchesFilters,
  type StaffShareFilters,
} from "../utils/staff-share-view.util";
import { StaffShareList } from "./StaffShareList";
import { StaffShareSeatMap } from "./StaffShareSeatMap";

type StaffShareTab = "map" | "list";

/**
 * Contenido interactivo de `/s/[token]` (pestaña, filtro por punto y búsqueda). Recibe solo datos
 * planos del Server Component: ninguna función como prop.
 */
export function StaffShareView({ data }: { data: StaffShareOutput }) {
  const hasVehicle = data.vehicle !== null;
  const [tab, setTab] = useState<StaffShareTab>(hasVehicle ? "map" : "list");
  const [filters, setFilters] = useState<StaffShareFilters>({ pointCode: null, query: "" });

  const view = buildStaffShareView(data);
  const isFiltering = filters.pointCode !== null || filters.query.trim() !== "";
  const seatedRows = view.seatedRows.filter((row) => rowMatchesFilters(row, filters));
  const unseatedRows = view.unseatedRows.filter((row) => rowMatchesFilters(row, filters));
  const highlightedLabels = isFiltering
    ? new Set(
        seatedRows.flatMap((row) => (row.passenger.seatLabel ? [row.passenger.seatLabel] : [])),
      )
    : null;

  const pillClass = (active: boolean) =>
    cn(
      "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
      active
        ? "border-indigo-600 bg-indigo-600 text-white"
        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
    );

  return (
    <div className="space-y-4">
      {data.boardingPoints.length > 0 && (
        <section
          aria-labelledby="staff-points-title"
          className="space-y-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
        >
          <h2
            id="staff-points-title"
            className="text-xs font-bold tracking-wider text-slate-500 uppercase"
          >
            Puntos de abordaje
          </h2>
          <ul className="space-y-1.5 text-sm text-slate-700">
            {data.boardingPoints.map((point) => (
              <li key={point.code} className="flex items-start gap-2">
                <span className="rounded border border-slate-300 px-1.5 text-xs font-bold">
                  {point.code}
                </span>
                <span className="min-w-0 break-words">
                  {point.location} · {formatPickupTime(point.time)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="space-y-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <Input
            type="search"
            aria-label="Buscar pasajero por nombre"
            placeholder="Buscar pasajero por nombre"
            value={filters.query}
            onChange={(event) => setFilters({ ...filters, query: event.target.value })}
            className="h-11 rounded-xl bg-white pl-9"
          />
        </div>

        {data.boardingPoints.length > 0 && (
          <div
            role="group"
            aria-label="Filtrar por punto de abordaje"
            className="flex gap-2 overflow-x-auto pb-1"
          >
            <button
              type="button"
              aria-pressed={filters.pointCode === null}
              className={pillClass(filters.pointCode === null)}
              onClick={() => setFilters({ ...filters, pointCode: null })}
            >
              Todos
            </button>
            {data.boardingPoints.map((point) => (
              <button
                key={point.code}
                type="button"
                aria-pressed={filters.pointCode === point.code}
                title={point.location}
                className={pillClass(filters.pointCode === point.code)}
                onClick={() => setFilters({ ...filters, pointCode: point.code })}
              >
                {point.code}
              </button>
            ))}
          </div>
        )}
      </div>

      {data.vehicle ? (
        <Tabs value={tab} onValueChange={(value) => setTab(value === "list" ? "list" : "map")}>
          <TabsList className="w-full">
            <TabsTrigger value="map">Croquis</TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
          </TabsList>
          <TabsContent value="map" className="mt-3">
            <StaffShareSeatMap
              layoutMap={data.vehicle.layoutMap}
              seatsByLabel={view.seatsByLabel}
              highlightedLabels={highlightedLabels}
            />
          </TabsContent>
          <TabsContent value="list" className="mt-3">
            <StaffShareList seatedRows={seatedRows} unseatedRows={unseatedRows} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-3">
          <p
            role="note"
            className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
          >
            Este viaje aún no tiene vehículo asignado: por ahora solo está disponible la lista.
          </p>
          <StaffShareList seatedRows={seatedRows} unseatedRows={unseatedRows} />
        </div>
      )}
    </div>
  );
}
