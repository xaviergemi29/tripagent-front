import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SeatWithoutDepositBadgeProps {
  seatLabel: string;
  /** Texto corto "Sin anticipo" (espacios angostos); el texto completo queda en `title` y para lectores de pantalla. */
  compact?: boolean;
  className?: string;
}

const WARNING_TEXT = "Asiento asignado sin anticipo cubierto";

/**
 * Asiento que el grupo conserva aunque ya no cubre el anticipo requerido (se anuló un abono o el
 * anticipo subió). Decisión del PM: el sistema no lo libera; solo lo señala para que el operador
 * decida si lo reasigna o espera el pago.
 */
export function SeatWithoutDepositBadge({
  seatLabel,
  compact = false,
  className,
}: SeatWithoutDepositBadgeProps) {
  return (
    <span
      title={WARNING_TEXT}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800",
        className,
      )}
    >
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
      <span className="font-bold">{seatLabel}</span>
      {compact ? (
        <>
          <span aria-hidden>Sin anticipo</span>
          <span className="sr-only">{WARNING_TEXT}</span>
        </>
      ) : (
        <span>{WARNING_TEXT}</span>
      )}
    </span>
  );
}
