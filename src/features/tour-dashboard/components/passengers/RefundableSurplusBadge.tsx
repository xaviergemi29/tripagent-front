import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Currency } from "@/shared/constants/domain.constants";
import { formatCurrency } from "@/shared/utils/currency.util";

interface RefundableSurplusBadgeProps {
  amount: number;
  tourCurrency?: Currency;
  className?: string;
}

/**
 * Saldo a devolver al titular (`refundableSurplus` del dashboard): lo abonado supera el total de la
 * reserva, p. ej. tras dar de baja a un acompañante con una retención menor al costo del lugar
 * (FLUJO-RES-004, 2026-11-17). Se salda con "Registrar devolución" en el Drawer financiero.
 */
export function RefundableSurplusBadge({
  amount,
  tourCurrency,
  className,
}: RefundableSurplusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-amber-800",
        className,
      )}
    >
      <RotateCcw className="h-3 w-3 shrink-0 text-amber-600" aria-hidden />A devolver:{" "}
      {formatCurrency(amount, { currency: tourCurrency })}
    </span>
  );
}
