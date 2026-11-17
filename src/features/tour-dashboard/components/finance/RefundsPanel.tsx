"use client";

import { useState } from "react";
import { ChevronRight, RotateCcw } from "lucide-react";
import type { RefundRowOutput } from "@/features/tour-dashboard/schemas/tour-dashboard.schema";
import type { Currency, RefundStatus } from "@/shared/constants/domain.constants";
import { formatCurrency } from "@/shared/utils/currency.util";
import { cn } from "@/lib/utils";
import { RefundDrawer } from "@/features/tour-dashboard/components/finance/RefundDrawer";
import { REFUND_STATUS } from "@/shared/constants/domain.constants";

interface RefundsPanelProps {
  tourId: string;
  currency: Currency;
  refunds: RefundRowOutput[];
  /** Si se pueden registrar reembolsos (no en un tour FINALIZADO). */
  canRegisterRefunds: boolean;
}

export const REFUND_STATUS_BADGE: Record<RefundStatus, { label: string; className: string }> = {
  PENDING: { label: "Por reembolsar", className: "border-amber-200 bg-amber-50 text-amber-800" },
  COMPLETED: {
    label: "Reembolsado",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  NONE: { label: "Retenido", className: "border-slate-200 bg-slate-50 text-slate-600" },
};

/**
 * Reservas canceladas con dinero abonado (decisión del PM, 2026-11-14). Cada fila abre el Drawer en
 * modo "Egreso / Reembolso" para registrar la devolución conforme se transfiere por SPEI.
 */
export function RefundsPanel({ tourId, currency, refunds, canRegisterRefunds }: RefundsPanelProps) {
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const selected = refunds.find((row) => row.bookingId === selectedBookingId) ?? null;
  const pendingRows = refunds.filter((row) => row.refundStatus === REFUND_STATUS.PENDING);
  const pendingTotal = pendingRows.reduce((sum, row) => sum + row.refundableAmount, 0);

  if (refunds.length === 0) return null;

  return (
    <section
      aria-label="Reembolsos"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <RotateCcw className="h-4 w-4 text-rose-600" /> Reembolsos
        </h3>
        <span className="text-xs text-slate-600">
          {pendingRows.length > 0 ? (
            <>
              {pendingRows.length} pendiente(s):{" "}
              <strong className="text-slate-900">
                {formatCurrency(pendingTotal, { currency })}
              </strong>
            </>
          ) : (
            "Todos los reembolsos están registrados"
          )}
        </span>
      </header>

      <ul className="divide-y divide-slate-100">
        {refunds.map((row) => {
          const badge = REFUND_STATUS_BADGE[row.refundStatus];
          return (
            <li key={row.bookingId}>
              <button
                type="button"
                onClick={() => setSelectedBookingId(row.bookingId)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{row.fullName}</p>
                  <p className="text-xs text-slate-500">
                    Abonó {formatCurrency(row.paidAmount, { currency })}
                    {row.retainedAmount > 0 &&
                      ` · Retención ${formatCurrency(row.retainedAmount, { currency })}`}
                    {row.refundedAmount > 0 &&
                      ` · Reembolsado ${formatCurrency(row.refundedAmount, { currency })}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {row.refundStatus === REFUND_STATUS.PENDING && (
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(row.refundableAmount, { currency })}
                    </span>
                  )}
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                      badge.className,
                    )}
                  >
                    {badge.label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <RefundDrawer
        tourId={tourId}
        currency={currency}
        refund={selected}
        canRegisterRefunds={canRegisterRefunds}
        onClose={() => setSelectedBookingId(null)}
      />
    </section>
  );
}
