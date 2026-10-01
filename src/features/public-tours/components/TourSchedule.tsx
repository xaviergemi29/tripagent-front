import { Calendar, RefreshCw, Moon, Bus, Flag } from "lucide-react";
import { formatLocalDate } from "@/shared/utils/tour-date.util";

interface TourScheduleProps {
  startDate: string;
  endDate?: string | null;
  departureTime?: string | null;
  returnTime?: string | null;
}

/**
 * 🛡️ Helper para construir un Date local exacto incluyendo la hora (sin timezone offsets)
 */
function parseDateTimeLocal(dateStr: string, timeStr?: string | null): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  let hours = 0;
  let minutes = 0;

  if (timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    hours = h || 0;
    minutes = m || 0;
  }

  return new Date(year, month - 1, day, hours, minutes);
}

/**
 * Calcula la duración basándose en bloques reales de 24 horas y noches calendario
 */
function getTripDuration(
  startDate: string,
  endDate: string,
  departureTime?: string | null,
  returnTime?: string | null,
) {
  const start = parseDateTimeLocal(startDate, departureTime);
  // Asumimos 18:00 como hora de regreso default si no existe para mantener el cálculo de 24h realista
  const end = parseDateTimeLocal(endDate, returnTime);

  // Noches: Diferencia estricta de días calendario (medianoche a medianoche)
  const startMid = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endMid = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const nights = Math.round((endMid.getTime() - startMid.getTime()) / (1000 * 60 * 60 * 24));

  // Días: Bloques transcurridos de 24 horas
  const diffInHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  let days = Math.round(diffInHours / 24);

  // Regla de negocio defensiva: En excursiones, los días mostrados rara vez deben ser menores a las noches
  days = Math.max(days, nights, 1);

  return { days, nights };
}

// 🚀 Helper visual para capitalizar el resultado de formatLocalDate ("vie., 02 oct." -> "Vie., 02 oct.")
const capitalizeDate = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export function TourSchedule({ startDate, endDate, departureTime, returnTime }: TourScheduleProps) {
  const isSameDayTrip = !endDate || startDate === endDate;

  // CASO 1: Ida y vuelta el mismo día
  if (isSameDayTrip) {
    return (
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <div className="inline-flex items-center gap-2 rounded-xl border border-indigo-100/70 bg-indigo-50/70 px-3.5 py-2 text-xs font-semibold text-indigo-900 shadow-sm">
          <Calendar className="h-4 w-4 shrink-0 text-indigo-600" />
          <span>{capitalizeDate(formatLocalDate(startDate))}</span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-sm">
          <RefreshCw className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
          <span>Ida y vuelta el mismo día</span>
        </div>
      </div>
    );
  }

  // CASO 2: Tour de varios días con pernocta
  const { days, nights } = getTripDuration(startDate, endDate, departureTime, returnTime);

  return (
    <div className="space-y-2.5 pt-1">
      {/* Píldora de estancia */}
      {nights > 0 && (
        <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100/80 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-900">
          <Moon className="h-3.5 w-3.5 text-indigo-600" />
          <span>{nights === 1 ? "1 noche" : `${days} días / ${nights} noches`}</span>
        </div>
      )}

      {/* Tarjeta de Salida */}
      <div className="flex items-center gap-3 rounded-2xl border border-indigo-100/60 bg-indigo-50/40 p-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
          <Bus className="h-4 w-4" />
        </div>
        <div>
          <span className="mb-1 block text-[10px] leading-none font-bold tracking-wider text-slate-400 uppercase">
            Salida Programada
          </span>
          <p className="text-xs leading-tight font-bold text-slate-900">
            {capitalizeDate(formatLocalDate(startDate))}
            {departureTime ? ` • ${departureTime}` : ""}
          </p>
        </div>
      </div>

      {/* Tarjeta de Regreso */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200/60 bg-slate-50 p-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200/70 text-slate-600">
          <Flag className="h-4 w-4" />
        </div>
        <div>
          <span className="mb-1 block text-[10px] leading-none font-bold tracking-wider text-slate-400 uppercase">
            Regreso Estimado
          </span>
          <p className="text-xs leading-tight font-bold text-slate-900">
            {capitalizeDate(formatLocalDate(endDate))}
            {returnTime ? ` • ${returnTime}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
