import { parseDateOnly } from "@/shared/utils/tour-date.util";

const MS_PER_DAY = 86_400_000;

export interface TourDuration {
  days: number;
  nights: number;
  /** Texto para mostrar: "3 días / 2 noches" o "1 día (regreso el mismo día)". */
  label: string;
}

/**
 * Duración del viaje a partir de salida y regreso (`YYYY-MM-DD`). Con regreso posterior a la
 * salida: N días (inclusive) y N−1 noches; sin regreso, igual a la salida o anterior: 1 día.
 * Devuelve `null` sin fecha de salida válida.
 */
export function getTourDuration(
  departureDate?: string | null,
  returnDate?: string | null,
): TourDuration | null {
  if (!departureDate) return null;
  const departure = parseDateOnly(departureDate);
  if (Number.isNaN(departure.getTime())) return null;

  const returnDay = returnDate ? parseDateOnly(returnDate) : null;
  const hasLaterReturn =
    returnDay !== null && !Number.isNaN(returnDay.getTime()) && returnDay > departure;
  if (!hasLaterReturn) return { days: 1, nights: 0, label: "1 día (regreso el mismo día)" };

  const nights = Math.round((returnDay.getTime() - departure.getTime()) / MS_PER_DAY);
  const days = nights + 1;
  return {
    days,
    nights,
    label: `${days} días / ${nights} ${nights === 1 ? "noche" : "noches"}`,
  };
}
