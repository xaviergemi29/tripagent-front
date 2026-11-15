import { CheckCircle2, Clock, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPickupTime } from "@/shared/utils/tour-date.util";
import type { PassengerDTO } from "./types";

function parseBoardingPoint(rawString: string | null | undefined) {
  if (!rawString) return { location: "Punto de abordaje por confirmar", time: null };
  const match = rawString.match(/(.*?)\s*\((.*?)\)/);
  if (match) {
    return { location: match[1].trim(), time: match[2].trim() };
  }
  return { location: rawString, time: null };
}

/** Paso 1 completado: "¡Lugares Apartados!" con los viajeros registrados y su punto de abordaje. */
export function ReservationConfirmedCard({
  passengers,
  hasAdvancePayment,
}: {
  passengers: PassengerDTO[];
  hasAdvancePayment: boolean;
}) {
  const totalRegistered = passengers.length;

  return (
    <div className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      {/* Bloque de Confirmación */}
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black tracking-widest text-emerald-600 uppercase">
            Paso 1 de 2 Completado
          </span>
          <span
            className={`rounded-full border px-3 py-0.5 text-[10px] font-bold ${hasAdvancePayment ? "border-amber-200 bg-amber-50 text-amber-700" : "border-indigo-200 bg-indigo-50 text-indigo-700"}`}
          >
            {hasAdvancePayment ? "• Anticipo Pendiente" : "• Pago Pendiente"}
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">¡Lugares Apartados!</h1>
      </div>

      {/* DESGLOSE DE VIAJEROS REGISTRADOS */}
      <div className="text-left">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-indigo-900/80 uppercase">
            <Users className="h-4 w-4 text-indigo-600" />
            <span>Viajeros Registrados ({totalRegistered})</span>
          </div>
        </div>

        <div className="space-y-2.5">
          {passengers.map((passenger, idx) => {
            const bp = parseBoardingPoint(passenger.boardingPoint);
            const formattedTime = formatPickupTime(bp.time);

            return (
              <div
                key={idx}
                className={`flex flex-col gap-1.5 rounded-xl border p-3.5 ${passenger.isTitular ? "border-indigo-100 bg-indigo-50/30" : "border-slate-100 bg-slate-50/80"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">{passenger.name}</span>
                  <Badge
                    variant="secondary"
                    className={`px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase shadow-none ${passenger.isTitular ? "border-indigo-200 bg-indigo-100 text-indigo-700" : "border-slate-300 bg-slate-200 text-slate-600"}`}
                  >
                    {passenger.isTitular ? "Titular" : "Acompañante"}
                  </Badge>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-white/60 bg-white/70 p-2.5 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="text-xs font-medium text-slate-600">{bp.location}</span>
                  </div>
                  {bp.time && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-900">{formattedTime}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-center text-[11px] font-medium text-slate-500">
          * Te sugerimos llegar 15 minutos antes de tu hora de cita.
        </p>
      </div>

      <div className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 text-xs font-bold text-amber-800">
        <Clock className="h-4 w-4 text-amber-600" />
        {/* El enlace y el apartado no vencen (decisión del PM); la confirmación llega con el anticipo. */}
        <span>
          {hasAdvancePayment
            ? "Tus lugares están apartados. Tu viaje se confirma al cubrir el anticipo."
            : "Tus lugares están apartados."}
        </span>
      </div>
    </div>
  );
}
