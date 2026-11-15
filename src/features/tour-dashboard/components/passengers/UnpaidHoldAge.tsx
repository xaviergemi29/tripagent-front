"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { UNPAID_HOLD_REVIEW_HOURS } from "@/features/tour-dashboard/constants/unpaid-hold";

const MS_PER_HOUR = 60 * 60 * 1000;

/** Horas completas transcurridas desde `fromIso` (0 si la fecha no es válida o está en el futuro). */
export function getElapsedHours(fromIso: string, nowMs: number): number {
  const from = new Date(fromIso).getTime();
  if (Number.isNaN(from)) return 0;
  return Math.max(0, Math.floor((nowMs - from) / MS_PER_HOUR));
}

const plural = (count: number, singular: string, pluralForm: string) =>
  `${count} ${count === 1 ? singular : pluralForm}`;

/**
 * Texto de la antigüedad: horas mientras es menos de un día y, desde las 24 h, días y horas
 * ("Apartado hace 2 días y 3 horas sin pago"; sin horas sobrantes, solo los días).
 */
export function formatUnpaidHoldAge(hours: number): string {
  if (hours < 1) return "Apartado hace menos de 1 hora sin pago";
  if (hours < 24) return `Apartado hace ${plural(hours, "hora", "horas")} sin pago`;
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  const daysText = plural(days, "día", "días");
  return rest > 0
    ? `Apartado hace ${daysText} y ${plural(rest, "hora", "horas")} sin pago`
    : `Apartado hace ${daysText} sin pago`;
}

interface UnpaidHoldAgeProps {
  /** `bookedAt` del dashboard (fecha en que se apartaron los lugares). */
  bookedAt: string;
  className?: string;
}

/**
 * Antigüedad de un apartado sin ningún pago: "Apartado hace 5 horas sin pago" o, desde las 24 h,
 * "Apartado hace 2 días y 3 horas sin pago". Desde las 48 h se pinta
 * en rojo para que el operador decida si lo cancela (no hay cancelación automática).
 */
export function UnpaidHoldAge({ bookedAt, className }: UnpaidHoldAgeProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  // La etiqueta se actualiza sola mientras el Centro de Control sigue abierto.
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const hours = getElapsedHours(bookedAt, nowMs);
  const isOverdue = hours >= UNPAID_HOLD_REVIEW_HOURS;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px]",
        isOverdue ? "font-semibold text-red-600" : "font-medium text-slate-500",
        className,
      )}
    >
      <Clock className="h-3 w-3 shrink-0" aria-hidden />
      {formatUnpaidHoldAge(hours)}
    </span>
  );
}
