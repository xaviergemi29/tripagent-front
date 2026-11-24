import { MapPin, User, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { PartialPaymentPassenger } from "./types";
import { resolveBoardingPointDisplay } from "@/shared/utils/boarding-point.util";
import { formatPickupTime } from "@/shared/utils/tour-date.util";
import { BOOKING_STATUS } from "@/shared/constants/domain.constants";

/**
 * "Personas en este viaje": titular y acompañantes con su punto de abordaje. La insignia sigue el
 * estado de la reserva: "Confirmados" solo con `CONFIRMED` (anticipo cubierto + formulario lleno).
 */
export function TravelGroupCard({
  passengers,
  bookingStatus,
}: {
  passengers: PartialPaymentPassenger[];
  bookingStatus?: string;
}) {
  const isConfirmed = bookingStatus === BOOKING_STATUS.CONFIRMED;
  return (
    <Card className="rounded-2xl border-indigo-100/70 bg-white shadow-sm">
      <CardContent className="space-y-4 p-4 sm:p-5">
        {/* Header de la sección */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-800 uppercase">
            <Users className="h-4 w-4 text-indigo-700" />
            <span>Personas en este viaje ({passengers.length})</span>
          </div>
          {isConfirmed ? (
            <span className="flex items-center gap-1 rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
              Confirmados
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full border border-amber-200/60 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Por confirmar
            </span>
          )}
        </div>

        {/* Lista de Pasajeros */}
        <div className="space-y-3">
          {passengers.map((pass, idx) => {
            // `isTitular` es el dato de la API; el texto de `type` solo respalda payloads anteriores.
            const isLead = pass.isTitular ?? pass.type?.toLowerCase() === "titular";

            // Punto configurado en el tour (`boardingPointDetails`, misma regla que el pase de
            // abordaje y el PDF) con la hora en formato 12 h: "06:00 AM".
            const point = resolveBoardingPointDisplay(pass);
            const pointTime = point?.time ?? pass.departureTime;
            const meetingInfo =
              pass.pickupReference ||
              (point
                ? `${point.location}${pointTime ? ` • Salida: ${formatPickupTime(pointTime)}` : ""}`
                : "Punto de abordaje: Por coordinar");

            return (
              <div
                key={idx}
                className={`rounded-xl border p-3.5 transition-all sm:p-4 ${
                  isLead
                    ? "border-indigo-100 bg-gradient-to-r from-indigo-50/40 via-white to-white shadow-[0_2px_8px_-3px_rgba(99,102,241,0.08)]"
                    : "border-slate-100 bg-slate-50/70"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform ${
                        isLead
                          ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white ring-2 ring-indigo-200/80"
                          : "bg-slate-200/80 text-slate-700"
                      }`}
                    >
                      <User className="h-4 w-4" />
                    </div>

                    <div className="truncate">
                      <span className="block truncate text-sm font-bold text-slate-900">
                        {pass.name}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${
                      isLead
                        ? "border border-indigo-200/60 bg-indigo-100 text-indigo-800"
                        : "bg-slate-200/80 text-slate-700"
                    }`}
                  >
                    {pass.type}
                  </span>
                </div>

                <div className="mt-2.5 flex items-start gap-2 border-t border-slate-100/80 pt-2 text-xs text-slate-600">
                  <div className="mt-0.5 shrink-0 rounded-lg bg-emerald-50 p-1 text-emerald-700">
                    <MapPin className="h-3.5 w-3.5" />
                  </div>
                  <div className="leading-tight">
                    <span className="mb-0.5 block text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                      Punto de abordaje
                    </span>
                    <span className="font-medium text-slate-800">{meetingInfo}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
