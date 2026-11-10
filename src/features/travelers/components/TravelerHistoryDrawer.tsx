"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { formatCurrency } from "@/shared/utils/currency.util";
import { formatLocalDate } from "@/shared/utils/tour-date.util";
import { getInitials } from "@/shared/utils/travelers-helpers";

interface Props {
  travelerId: string | null;
  onClose: () => void;
}

type FilterType = "ALL" | "NACIONAL" | "EXTRANJERO" | "CANCELLED";

export function TravelerHistoryDrawer({ travelerId, onClose }: Props) {
  const { data: traveler, isLoading } = useTravelerHistory(travelerId);
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");

  const history = traveler?.history || [];

  // Contadores memorizados
  const counts = useMemo(() => {
    return {
      all: history.length,
      national: history.filter(
        (h) =>
          h.destinationType === "NATIONAL" &&
          h.passengerStatus !== "CANCELLED" &&
          h.bookingStatus !== "CANCELLED",
      ).length,
      international: history.filter(
        (h) =>
          h.destinationType === "INTERNATIONAL" &&
          h.passengerStatus !== "CANCELLED" &&
          h.bookingStatus !== "CANCELLED",
      ).length,
      cancelled: history.filter(
        (h) => h.passengerStatus === "CANCELLED" || h.bookingStatus === "CANCELLED",
      ).length,
    };
  }, [history]);

  // Filtrado de registros
  const filteredBookings = useMemo(() => {
    if (activeFilter === "ALL") return history;
    if (activeFilter === "CANCELLED") {
      return history.filter(
        (h) => h.passengerStatus === "CANCELLED" || h.bookingStatus === "CANCELLED",
      );
    }
    const activeHistory = history.filter(
      (h) => h.passengerStatus !== "CANCELLED" && h.bookingStatus !== "CANCELLED",
    );
    if (activeFilter === "NACIONAL")
      return activeHistory.filter((h) => h.destinationType === "NATIONAL");
    if (activeFilter === "EXTRANJERO")
      return activeHistory.filter((h) => h.destinationType === "INTERNATIONAL");
    return history;
  }, [history, activeFilter]);

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
                  <span>{counts.national} Nac.</span>
                  <span className="text-slate-300">•</span>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  <span>{counts.international} Ext.</span>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5">
                <div className="flex items-center justify-between text-xs font-medium tracking-wide text-slate-500">
                  <span>TOTAL COMPRADO</span>
                  <Banknote className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="my-1">
                  <span className="text-2xl font-bold text-emerald-600">
                    {/* 🚀 USO DE UTILIDAD: formatCurrency */}
                    {formatCurrency(traveler?.metrics?.lifetimeValue, { currency: "MXN" })}
                  </span>
                </div>
                <div className="border-t border-slate-200/60 pt-1 text-[11px] font-medium text-slate-500">
                  Moneda nacional (MXN)
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
                <button
                  onClick={() => setActiveFilter("ALL")}
                  className={`rounded-lg px-1 py-1.5 text-center transition-all ${
                    activeFilter === "ALL"
                      ? "bg-white font-semibold text-slate-900 shadow-sm"
                      : "hover:text-slate-900"
                  }`}
                >
                  Todos ({counts.all})
                </button>
                <button
                  onClick={() => setActiveFilter("NACIONAL")}
                  className={`rounded-lg px-1 py-1.5 text-center transition-all ${
                    activeFilter === "NACIONAL"
                      ? "bg-white font-semibold text-slate-900 shadow-sm"
                      : "hover:text-slate-900"
                  }`}
                >
                  Nacionales ({counts.national})
                </button>
                <button
                  onClick={() => setActiveFilter("EXTRANJERO")}
                  className={`rounded-lg px-1 py-1.5 text-center transition-all ${
                    activeFilter === "EXTRANJERO"
                      ? "bg-white font-semibold text-slate-900 shadow-sm"
                      : "hover:text-slate-900"
                  }`}
                >
                  Extranjero ({counts.international})
                </button>
                <button
                  onClick={() => setActiveFilter("CANCELLED")}
                  className={`rounded-lg px-1 py-1.5 text-center transition-all ${
                    activeFilter === "CANCELLED"
                      ? "bg-white font-semibold text-slate-900 shadow-sm"
                      : "hover:text-slate-900"
                  }`}
                >
                  Cancelados ({counts.cancelled})
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {filteredBookings.map((item: any) => {
                  const isCancelled = item.isCancelled;
                  const isNacional = item.destinationType === "NATIONAL";

                  // 🚀 USO DE UTILIDAD: formatCurrency
                  const priceFormatted = formatCurrency(item.amountPaid);

                  // 🚀 USO DE UTILIDAD: formatLocalDate (evita el desfase de zona horaria)
                  const localDateString = formatLocalDate(item.departureDateTime);

                  let dateLabel = "";
                  if (isCancelled) {
                    dateLabel = `Cancelado: ${localDateString}`;
                  } else {
                    const isPast = new Date(item.departureDateTime) < new Date();
                    dateLabel = isPast
                      ? `Concluido: ${localDateString}`
                      : `Salida: ${localDateString}`;
                  }

                  let uiStatus = "UPCOMING";
                  if (isCancelled) uiStatus = "CANCELLED";
                  else if (new Date(item.departureDateTime) < new Date()) uiStatus = "COMPLETED";

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
