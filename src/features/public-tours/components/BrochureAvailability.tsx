import { Bus, CalendarX2, Sparkles, Users } from "lucide-react";
import type { PublicTourOutput } from "../public-tour.schema";

interface BrochureAvailabilityProps {
  availability: PublicTourOutput["availability"];
}

/** Lugares disponibles a partir de los cuales la tarjeta pasa a "Quedan pocos lugares". */
const LOW_AVAILABILITY_SEATS = 6;
/** O cuando queda este porcentaje o menos de la capacidad vendible. */
const LOW_AVAILABILITY_PERCENT = 30;
/** Ocupación desde la que la insignia dice "Mitad reservado" (en lugar de "Lugares disponibles"). */
const HALF_RESERVED_PERCENT = 45;

type AvailabilityLevel = "ALL_AVAILABLE" | "HALF_AVAILABLE" | "LOW_AVAILABILITY" | "SOLD_OUT";

const LEVEL_STYLES: Record<
  AvailabilityLevel,
  { card: string; icon: string; badge: string; bar: string; percent: string }
> = {
  ALL_AVAILABLE: {
    card: "border-slate-100 bg-white",
    icon: "bg-emerald-50 text-emerald-600",
    badge: "border-emerald-200/80 bg-emerald-50 text-emerald-700",
    bar: "bg-emerald-500",
    percent: "font-bold text-emerald-700",
  },
  HALF_AVAILABLE: {
    card: "border-slate-100 bg-white",
    icon: "bg-indigo-50 text-indigo-600",
    badge: "border-indigo-200/80 bg-indigo-50 text-indigo-700",
    bar: "bg-indigo-600",
    percent: "font-semibold text-indigo-700",
  },
  LOW_AVAILABILITY: {
    card: "border-amber-200 bg-linear-to-b from-amber-50/40 to-white",
    icon: "bg-amber-50 text-amber-700",
    badge: "border-amber-200 bg-amber-50 text-amber-800",
    bar: "bg-linear-to-r from-indigo-600 to-amber-500",
    percent: "font-bold text-amber-800",
  },
  SOLD_OUT: {
    card: "border-slate-200 bg-slate-50/60",
    icon: "bg-slate-100 text-slate-500",
    badge: "border-slate-200 bg-slate-100 text-slate-700",
    bar: "bg-slate-400",
    percent: "font-medium text-slate-600",
  },
};

const seatsWord = (count: number) => (count === 1 ? "lugar" : "lugares");

/**
 * Ocupación en vivo del folleto con urgencia amable (tono cálido, sin alarmas). Muestra los números
 * que calcula la API (`BookingCapacityService`, regla 12) sin recalcularlos: solo deriva los
 * porcentajes y el nivel para la presentación.
 */
export function BrochureAvailability({ availability }: BrochureAvailabilityProps) {
  const { sellableCapacity, occupiedSeats, availableSeats, hasDeparted } = availability;

  // El tour ya salió: la logística está cerrada, así que no se muestra la urgencia de lugares.
  if (hasDeparted) {
    return (
      <section
        aria-label="Disponibilidad de lugares"
        className="flex items-center gap-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <CalendarX2 className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-base leading-tight font-bold text-slate-900">Viaje finalizado</h3>
          <p className="text-xs text-slate-500">
            Esta salida ya no admite reservas. Consulta a la agencia por sus próximas fechas.
          </p>
        </div>
      </section>
    );
  }

  // Solo para mostrar: una sobreventa o un dato raro no deben dar porcentajes fuera de 0–100.
  const total = Math.max(0, sellableCapacity);
  const reserved = Math.max(0, occupiedSeats);
  const available = Math.max(0, availableSeats);
  const percentOccupied = total > 0 ? Math.min(100, Math.round((reserved / total) * 100)) : 100;
  const percentAvailable = total > 0 ? Math.min(100, Math.round((available / total) * 100)) : 0;

  const level: AvailabilityLevel =
    available === 0
      ? "SOLD_OUT"
      : reserved === 0
        ? "ALL_AVAILABLE"
        : available <= LOW_AVAILABILITY_SEATS || percentAvailable <= LOW_AVAILABILITY_PERCENT
          ? "LOW_AVAILABILITY"
          : "HALF_AVAILABLE";

  // "Apartaron" y no "aseguraron": los lugares ocupados incluyen apartados aún sin pago (regla 12).
  const socialProof = `${reserved} ${
    reserved === 1 ? "persona ya apartó su lugar" : "personas ya apartaron su lugar"
  } en este viaje.`;

  const content: Record<AvailabilityLevel, { title: string; badge: string; message: string }> = {
    ALL_AVAILABLE: {
      title: `${available} ${seatsWord(available)} ${available === 1 ? "disponible" : "disponibles"}`,
      badge: "¡Salida abierta!",
      message: "¡Sé de los primeros en apartar y elegir tus asientos favoritos!",
    },
    HALF_AVAILABLE: {
      title: `Quedan ${available} ${seatsWord(available)}`,
      badge: percentOccupied >= HALF_RESERVED_PERCENT ? "Mitad reservado" : "Lugares disponibles",
      message: socialProof,
    },
    LOW_AVAILABILITY: {
      title: available === 1 ? "¡Solo queda 1 lugar!" : `¡Solo quedan ${available} lugares!`,
      badge: "Quedan pocos lugares",
      message: socialProof,
    },
    SOLD_OUT: {
      title: "¡Lugares agotados!",
      badge: "Cupo lleno",
      message: "Este tour ha completado su capacidad de reservaciones.",
    },
  };

  const { title, badge, message } = content[level];
  const styles = LEVEL_STYLES[level];
  const Icon = level === "ALL_AVAILABLE" ? Sparkles : level === "LOW_AVAILABILITY" ? Bus : Users;

  return (
    <section
      aria-label="Disponibilidad de lugares"
      data-level={level}
      className={`w-full rounded-3xl border p-4 shadow-sm transition-colors duration-300 sm:p-5 ${styles.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${styles.icon}`}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <h3 className="text-base leading-snug font-extrabold tracking-tight text-slate-900 sm:text-lg">
            {title}
          </h3>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles.badge}`}
        >
          {badge}
        </span>
      </div>

      <p className="mt-2.5 text-xs leading-relaxed text-slate-600 sm:text-sm">{message}</p>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={Math.min(reserved, total)}
        aria-label="Lugares reservados"
        className="relative mt-3.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${styles.bar}`}
          style={{ width: `${percentOccupied}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 text-xs font-medium">
        <span className="text-slate-500">
          {reserved} de {total} {seatsWord(total)} reservados
        </span>
        <span className={`shrink-0 ${styles.percent}`}>{percentAvailable}% disponible</span>
      </div>
    </section>
  );
}
