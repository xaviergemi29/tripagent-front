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
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
          Completado
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
        Próximo viaje
      </span>
    );
  }

  if (status === "CANCELLED") {
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
        Cancelado
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
      {status}
    </span>
  );
};

export function TravelerHistoryDrawer({ travelerId, onClose }: Props) {
  const { data: traveler, isLoading } = useTravelerHistory(travelerId);

  if (!travelerId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header estático */}
        <div className="flex justify-between items-center p-6 border-b shrink-0 bg-slate-50/50">
           <div>
             <h2 className="font-bold text-lg text-slate-900">Perfil del Viajero</h2>
             <p className="text-xs text-slate-500 font-medium">Historial y valor acumulado</p>
           </div>
           <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
             <X className="w-5 h-5 text-slate-500" />
           </Button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            
            {/* A. IDENTIDAD DEL CLIENTE (Primero en la jerarquía) */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
                {traveler?.fullName?.substring(0, 2).toUpperCase() || <User className="w-6 h-6" />}
              </div>
              <div className="overflow-hidden space-y-1">
                <h3 className="font-bold text-lg text-slate-900 leading-snug truncate">
                  {traveler?.fullName}
                </h3>
                <p className="text-xs text-slate-600 flex items-center gap-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {traveler?.whatsappPhone || "Sin teléfono registrado"}
                </p>
              </div>
            </div>

            {/* B. MÉTRICAS HERO (Tropicalizadas) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-50/60 border border-indigo-100 p-4 rounded-xl text-center space-y-1">
                <p className="text-[11px] text-indigo-700 font-bold uppercase tracking-wider">Viajes Totales</p>
                <p className="text-2xl font-black text-indigo-950">{traveler?.metrics?.totalTrips ?? 0}</p>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-xl text-center space-y-1">
                {/* 🇲🇽 LTV renombrado a término comercial intuitivo */}
                <p className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider">Total Comprado</p>
                <p className="text-2xl font-black text-emerald-950">
                  ${(traveler?.metrics?.lifetimeValue ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            {/* C. HISTORIAL DE VIAJES (Formato local es-MX + Badges) */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Historial de Excursiones
              </h4>
              
              <div className="space-y-3">
                {traveler?.bookings?.map((booking: any) => {
                  const departureDate = booking.tour?.departureDateTime;
                  
                  return (
                    <div 
                      key={booking.id} 
                      className="border-l-2 border-indigo-500 pl-4 py-2 hover:bg-slate-50/80 rounded-r-lg transition-colors space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-slate-800 text-sm leading-tight">
                          {booking.tour?.title}
                        </p>
                        {getBookingStatusBadge(booking.status, departureDate)}
                      </div>

                      <p className="text-xs text-slate-500 font-medium">
                        {departureDate ? (
                          new Date(departureDate).toLocaleDateString("es-MX", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })
                        ) : "Fecha no disponible"}
                      </p>
                    </div>
                  );
                })}

                {(!traveler?.bookings || traveler.bookings.length === 0) && (
                  <p className="text-xs text-slate-400 italic text-center py-6 border border-dashed rounded-xl">
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