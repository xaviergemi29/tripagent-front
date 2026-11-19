"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/shared/utils/currency.util";
import { type Currency, DEFAULT_CURRENCY } from "@/shared/constants/domain.constants";

interface RegistrationFooterProps {
  totalAmount: number;
  /**
   * Anticipo del grupo (anticipo por persona × lugares apartados), el mismo que muestra
   * `TourSummaryCard`. Sin anticipo ($0 o `null`) la cifra principal es el total del viaje.
   */
  depositAmount?: number | null;
  currency?: Currency;
  travelersCount: number;
  isSubmitting?: boolean;
  disabled?: boolean;
  onSubmit: () => void;
}

/**
 * Barra fija inferior del registro del Magic Link: el anticipo como cifra principal, el total y
 * el número de viajeros como contexto, y "Completar Registro" (rediseño del 2026-11-19).
 */
export function RegistrationFooter({
  totalAmount,
  depositAmount,
  currency = DEFAULT_CURRENCY,
  travelersCount,
  isSubmitting = false,
  disabled = false,
  onSubmit,
}: RegistrationFooterProps) {
  const travelersLabel = travelersCount === 1 ? "1 viajero" : `${travelersCount} viajeros`;
  const hasDeposit = Boolean(depositAmount && depositAmount > 0);

  return (
    <div className="- fixed inset-x-0 bottom-0 border-t border-slate-200/80 bg-white/95 px-4 pt-3 pb-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-md sm:px-6">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        {/* Importes: el anticipo destaca; total y viajeros como contexto. */}
        <div className="flex min-w-0 flex-col">
          <span className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            {hasDeposit ? "Anticipo hoy" : "Total del viaje"}
          </span>
          <span className="mt-0.5 text-lg leading-tight font-extrabold tracking-tight text-slate-900 sm:text-xl">
            {formatCurrency(hasDeposit ? depositAmount : totalAmount, { currency })}
          </span>
          <span className="mt-0.5 block truncate text-[11px] leading-tight font-medium text-slate-500">
            {hasDeposit && <>Total: {formatCurrency(totalAmount, { currency })} </>}
            <span className="text-slate-400">({travelersLabel})</span>
          </span>
        </div>

        {/* CTA principal: mismo handler y mismas condiciones de deshabilitado que antes. */}
        <Button
          type="button"
          onClick={onSubmit}
          disabled={disabled || isSubmitting}
          className="h-12 shrink-0 gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              <span>Procesando...</span>
            </>
          ) : (
            <>
              <span>Completar Registro</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
