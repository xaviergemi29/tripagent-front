"use client";

import { useState } from "react";
import { useTravelerHistory } from "../hooks/useTravelers";
import {
  Loader2,
  X,
  Phone,
  Calendar,
  Banknote,
  History,
  Bus,
  Plane,
  Check,
  XCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { formatCurrency } from "@/shared/utils/currency.util";
import {
  BOOKING_STATUS,
  CURRENCIES,
  DEFAULT_CURRENCY,
  DESTINATION_TYPE,
  PASSENGER_STATUS,
  TOUR_TEMPORAL_STATUS,
} from "@/shared/constants/domain.constants";
import type { TravelerHistoryOutput } from "../schemas/traveler.schema";
import { formatLocalDate } from "@/shared/utils/tour-date.util";
import { getInitials } from "@/shared/utils/travelers-helpers";

interface PropsTravelerHistoryDrawer {
  travelerId: string | null;
  onClose: () => void;
}

type HistoryItem = TravelerHistoryOutput["history"][number];

export const isCancelledTrip = (trip: Pick<HistoryItem, "passengerStatus" | "bookingStatus">) =>
  trip.passengerStatus === PASSENGER_STATUS.CANCELLED ||
  trip.bookingStatus === BOOKING_STATUS.CANCELLED;

/** Estado que muestra cada viaje. "Concluido" sale del `temporalStatus` de la API, que considera el
 * regreso y la hora de CDMX (antes se comparaba la salida con `new Date()`, que corría el día). */
export type TripDisplayStatus = "UPCOMING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export const resolveTripDisplayStatus = (
  trip: Pick<HistoryItem, "passengerStatus" | "bookingStatus" | "temporalStatus">,
): TripDisplayStatus => {
  if (isCancelledTrip(trip) || trip.temporalStatus === TOUR_TEMPORAL_STATUS.CANCELLED) {
    return "CANCELLED";
  }
  if (trip.temporalStatus === TOUR_TEMPORAL_STATUS.FINISHED) return "COMPLETED";
  if (trip.temporalStatus === TOUR_TEMPORAL_STATUS.IN_PROGRESS) return "IN_PROGRESS";
  return "UPCOMING";
};

const DATE_LABEL_PREFIX: Record<TripDisplayStatus, string> = {
  UPCOMING: "Salida",
  IN_PROGRESS: "Salida",
  COMPLETED: "Concluido",
  CANCELLED: "Cancelado",
};

export const HISTORY_FILTERS = [
  { value: "ALL", label: "Todos", matches: () => true },
  {
    value: "NATIONAL",
    label: "Nacionales",
    matches: (trip: HistoryItem) =>
      !isCancelledTrip(trip) && trip.destinationType === DESTINATION_TYPE.NATIONAL,
  },
  {
    value: "INTERNATIONAL",
    label: "Extranjero",
    matches: (trip: HistoryItem) =>
      !isCancelledTrip(trip) && trip.destinationType === DESTINATION_TYPE.INTERNATIONAL,
  },
  { value: "CANCELLED", label: "Cancelados", matches: isCancelledTrip },
] as const satisfies readonly {
  value: string;
  label: string;
  matches: (trip: HistoryItem) => boolean;
}[];

type HistoryFilter = (typeof HISTORY_FILTERS)[number]["value"];

const matcherFor = (value: HistoryFilter) =>
  HISTORY_FILTERS.find((f) => f.value === value)!.matches;

export function TravelerHistoryDrawer({ travelerId, onClose }: PropsTravelerHistoryDrawer) {
  const { data: traveler, isLoading } = useTravelerHistory(travelerId);

  const ltvByCurrency = traveler?.metrics?.lifetimeValueByCurrency ?? {};
  const lifetimeValueLines = CURRENCIES.flatMap((currency) => {
    const amount = ltvByCurrency[currency];
    return amount ? [[currency, amount] as const] : [];
  });
  if (lifetimeValueLines.length === 0) lifetimeValueLines.push([DEFAULT_CURRENCY, 0] as const);
  const [activeFilter, setActiveFilter] = useState<HistoryFilter>("ALL");

  const history = traveler?.history ?? [];

  const countFor = (value: HistoryFilter): number => history.filter(matcherFor(value)).length;
  const filteredBookings = history.filter(matcherFor(activeFilter));

  if (!travelerId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-in slide-in-from-right flex h-full w-full max-w-lg flex-col bg-white shadow-2xl duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b bg-slate-50/50 p-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Perfil del Viajero</h2>
            <p className="text-xs font-medium text-slate-500">Historial y valor acumulado</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5 text-slate-500" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {/* 1. IDENTIDAD DEL CLIENTE */}
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-base font-bold text-indigo-700">
                {getInitials(traveler?.fullName)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold text-slate-900">
                  {traveler?.fullName}
                </h3>
                <div className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-600">
                  <Phone className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{traveler?.whatsappPhone || "Sin teléfono"}</span>
                </div>
              </div>
            </div>

            {/* 2. KPIs HERO */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5">
                <div className="flex items-center justify-between text-xs font-medium tracking-wide text-slate-500">
                  <span>VIAJES ACTIVOS</span>
                  <Calendar className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="my-1">
                  <span className="text-2xl font-bold text-slate-900">
                    {traveler?.metrics?.totalTrips ?? 0}
                  </span>
                  <span className="ml-1.5 text-xs font-medium text-slate-500">TOURS</span>
                </div>
                <div className="flex items-center gap-1.5 border-t border-slate-200/60 pt-1 text-[11px] font-medium text-slate-600">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>{countFor("NATIONAL")} Nac.</span>
                  <span className="text-slate-300">•</span>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  <span>{countFor("INTERNATIONAL")} Ext.</span>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5">
                <div className="flex items-center justify-between text-xs font-medium tracking-wide text-slate-500">
                  <span>TOTAL COMPRADO</span>
                  <Banknote className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="my-1 flex flex-col">
                  {lifetimeValueLines.map(([currency, amount]) => (
                    <span
                      key={currency}
                      className={`font-bold text-emerald-600 ${
                        lifetimeValueLines.length > 1 ? "text-base" : "text-2xl"
                      }`}
                    >
                      {formatCurrency(amount, { currency })}
                    </span>
                  ))}
                </div>
                <div className="border-t border-slate-200/60 pt-1 text-[11px] font-medium text-slate-500">
                  {lifetimeValueLines.length > 1
                    ? "Por divisa, sin conversión"
                    : "En la moneda de sus tours"}
                </div>
              </div>
            </div>

            {/* 3. SECCIÓN DE HISTORIAL */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  <History className="h-3.5 w-3.5 text-slate-400" />
                  Historial completo
                </h4>
                <span className="text-xs font-medium text-slate-400">
                  {filteredBookings.length} registros
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1 text-[11px] font-medium text-slate-600 sm:text-xs">
                {HISTORY_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setActiveFilter(filter.value)}
                    className={`rounded-lg px-1 py-1.5 text-center transition-all ${
                      activeFilter === filter.value
                        ? "bg-white font-semibold text-slate-900 shadow-sm"
                        : "hover:text-slate-900"
                    }`}
                  >
                    {filter.label} ({countFor(filter.value)})
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-3">
                {filteredBookings.map((item) => {
                  const uiStatus = resolveTripDisplayStatus(item);
                  const isCancelled = uiStatus === "CANCELLED";
                  const isNacional = item.destinationType === DESTINATION_TYPE.NATIONAL;

                  const priceFormatted = formatCurrency(item.amountPaid, {
                    currency: item.currency || DEFAULT_CURRENCY,
                  });

                  const localDateString = formatLocalDate(item.departureDateTime);

                  const dateLabel = `${DATE_LABEL_PREFIX[uiStatus]}: ${localDateString}`;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-all ${
                        isCancelled
                          ? "border-l-4 border-l-red-400 bg-red-50/20"
                          : isNacional
                            ? "border-l-4 border-l-emerald-500"
                            : "border-l-4 border-l-indigo-600"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        {isNacional ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 sm:text-[11px]">
                            <Bus className="h-3 w-3 text-emerald-600" />
                            NACIONAL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200/60 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 sm:text-[11px]">
                            <Plane className="h-3 w-3 text-indigo-600" />
                            EXTRANJERO
                          </span>
                        )}

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-bold ${isCancelled ? "text-slate-400 line-through" : "text-slate-900"}`}
                          >
                            {priceFormatted}
                          </span>

                          {uiStatus === "UPCOMING" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 sm:text-[11px]">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                              Próximo viaje
                            </span>
                          )}

                          {uiStatus === "IN_PROGRESS" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 sm:text-[11px]">
                              <Clock className="h-3 w-3 text-amber-600" />
                              En curso
                            </span>
                          )}

                          {uiStatus === "COMPLETED" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 sm:text-[11px]">
                              <Check className="h-3 w-3 text-emerald-600" />
                              Completado
                            </span>
                          )}

                          {uiStatus === "CANCELLED" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 sm:text-[11px]">
                              <XCircle className="h-3 w-3 text-red-500" />
                              Cancelado
                            </span>
                          )}
                        </div>
                      </div>

                      <h5 className="mb-1 text-sm leading-snug font-bold text-slate-900">
                        {item.tourTitle}
                      </h5>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{item.isTitular ? "Titular (Pagador)" : "Acompañante"}</span>
                        <span>{dateLabel}</span>
                      </div>
                    </div>
                  );
                })}

                {filteredBookings.length === 0 && (
                  <p className="rounded-xl border border-dashed py-6 text-center text-xs text-slate-400 italic">
                    No se encontraron registros para este filtro.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
