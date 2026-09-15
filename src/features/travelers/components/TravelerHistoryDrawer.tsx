"use client";

import { useTravelerHistory } from "../hooks/useTravelers";
import { Loader2, X, Phone, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  travelerId: string | null;
  onClose: () => void;
}

const getBookingStatusBadge = (status: string, departureDate: string) => {
  const isPast = new Date(departureDate) < new Date();

  if (status === "CONFIRMED" || status === "PENDING") {
    if (isPast) {
      return (
        <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
          Completado
        </span>
      );
    }
    return (
      <span className="rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
        Próximo viaje
      </span>
    );
  }

  if (status === "CANCELLED") {
    return (
      <span className="rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
        Cancelado
      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
      {status}
    </span>
  );
};

export function TravelerHistoryDrawer({ travelerId, onClose }: Props) {
  const { data: traveler, isLoading } = useTravelerHistory(travelerId);

  if (!travelerId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-in slide-in-from-right flex h-full w-full max-w-md flex-col bg-white shadow-2xl duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header estático */}
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
            {/* A. IDENTIDAD DEL CLIENTE (Primero en la jerarquía) */}
            <div className="flex items-start gap-4 rounded-xl border border-slate-200/80 bg-slate-50 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white shadow-sm">
                {traveler?.fullName?.substring(0, 2).toUpperCase() || <User className="h-6 w-6" />}
              </div>
              <div className="space-y-1 overflow-hidden">
                <h3 className="truncate text-lg leading-snug font-bold text-slate-900">
                  {traveler?.fullName}
                </h3>
                <p className="flex items-center gap-1.5 font-mono text-xs text-slate-600">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {traveler?.whatsappPhone || "Sin teléfono registrado"}
                </p>
              </div>
            </div>

            {/* B. MÉTRICAS HERO (Tropicalizadas) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-center">
                <p className="text-[11px] font-bold tracking-wider text-indigo-700 uppercase">
                  Viajes Totales
                </p>
                <p className="text-2xl font-black text-indigo-950">
                  {traveler?.metrics?.totalTrips ?? 0}
                </p>
              </div>

              <div className="space-y-1 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-center">
                {/* 🇲🇽 LTV renombrado a término comercial intuitivo */}
                <p className="text-[11px] font-bold tracking-wider text-emerald-700 uppercase">
                  Total Comprado
                </p>
                <p className="text-2xl font-black text-emerald-950">
                  $
                  {(traveler?.metrics?.lifetimeValue ?? 0).toLocaleString("es-MX", {
                    minimumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>

            {/* C. HISTORIAL DE VIAJES (Formato local es-MX + Badges) */}
            <div className="space-y-4 border-t border-slate-200 pt-4">
              <h4 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-400 uppercase">
                <Calendar className="h-4 w-4" /> Historial de Excursiones
              </h4>

              <div className="space-y-3">
                {traveler?.bookings?.map((booking: any) => {
                  const departureDate = booking.tour?.departureDateTime;

                  return (
                    <div
                      key={booking.id}
                      className="space-y-1.5 rounded-r-lg border-l-2 border-indigo-500 py-2 pl-4 transition-colors hover:bg-slate-50/80"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm leading-tight font-semibold text-slate-800">
                          {booking.tour?.title}
                        </p>
                        {getBookingStatusBadge(booking.status, departureDate)}
                      </div>

                      <p className="text-xs font-medium text-slate-500">
                        {departureDate
                          ? new Date(departureDate).toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "Fecha no disponible"}
                      </p>
                    </div>
                  );
                })}

                {(!traveler?.bookings || traveler.bookings.length === 0) && (
                  <p className="rounded-xl border border-dashed py-6 text-center text-xs text-slate-400 italic">
                    Este viajero no cuenta con historial de excursiones registradas.
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
