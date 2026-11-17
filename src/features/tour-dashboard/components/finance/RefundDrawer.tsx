"use client";

import { useState } from "react";
import { RotateCcw, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RefundRowOutput } from "@/features/tour-dashboard/schemas/tour-dashboard.schema";
import type { Currency } from "@/shared/constants/domain.constants";
import { formatCurrency } from "@/shared/utils/currency.util";
import { formatShortDateTime } from "@/shared/utils/tour-date.util";
import { PAYMENT_METHOD_DICT } from "@/shared/utils/config/status-dictionaries.config";
import { RegisterPaymentModal } from "@/features/tour-dashboard/components/finance/RegisterPaymentModal";
import { REFUND_STATUS } from "@/shared/constants/domain.constants";

interface RefundDrawerProps {
  tourId: string;
  currency: Currency;
  refund: RefundRowOutput | null;
  canRegisterRefunds: boolean;
  onClose: () => void;
}

/**
 * Drawer financiero en modo "Egreso / Reembolso" (decisión del PM, 2026-11-14): para una reserva
 * cancelada solo permite registrar devoluciones (montos que salen), no abonos ni anulaciones.
 */
export function RefundDrawer({
  tourId,
  currency,
  refund,
  canRegisterRefunds,
  onClose,
}: RefundDrawerProps) {
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  if (!refund) return null;

  const summary = [
    { label: "Total abonado", value: refund.paidAmount, tone: "text-slate-900" },
    ...(refund.retainedAmount > 0
      ? [{ label: "Retención", value: refund.retainedAmount, tone: "text-slate-900" }]
      : []),
    { label: "Reembolsado", value: refund.refundedAmount, tone: "text-emerald-700" },
    { label: "Saldo a reembolsar", value: refund.refundableAmount, tone: "text-rose-700" },
  ];

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex justify-end bg-slate-900/20 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-label={`Reembolso de ${refund.fullName}`}
          className="animate-in slide-in-from-right flex h-full w-full max-w-md flex-col bg-white shadow-2xl duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between border-b p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{refund.fullName}</h2>
                <p className="text-xs font-semibold text-slate-500 uppercase">
                  Reserva cancelada · {refund.whatsapp}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            <section className="space-y-3">
              <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase">
                Devolución
              </h3>
              <dl className="grid grid-cols-2 gap-3">
                {summary.map((item) => (
                  <div key={item.label} className="rounded-lg border bg-slate-50 p-3">
                    <dt className="text-xs font-semibold text-slate-500">{item.label}</dt>
                    <dd className={`text-lg font-bold ${item.tone}`}>
                      {formatCurrency(item.value, { currency })}
                    </dd>
                  </div>
                ))}
              </dl>

              {canRegisterRefunds && refund.refundableAmount > 0 && (
                <Button
                  className="h-12 w-full bg-rose-600 text-base font-bold text-white hover:bg-rose-700"
                  onClick={() => setIsRefundModalOpen(true)}
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> Registrar reembolso
                </Button>
              )}
              {refund.refundStatus === REFUND_STATUS.COMPLETED && (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
                  Reembolso completo: el neto de esta reserva es $0.00.
                </p>
              )}
            </section>

            <section className="space-y-2 border-t border-slate-200 pt-4">
              <h4 className="text-xs font-semibold text-slate-500 uppercase">
                Historial de movimientos
              </h4>
              {refund.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg border bg-white p-3 text-sm"
                >
                  <div>
                    <p className="text-xs text-slate-500">
                      {PAYMENT_METHOD_DICT[payment.method] || payment.method} •{" "}
                      {formatShortDateTime(payment.createdAt)}
                    </p>
                    {payment.referenceInfo && (
                      <p className="text-xs text-slate-400">{payment.referenceInfo}</p>
                    )}
                  </div>
                  <p
                    className={`font-semibold ${payment.amount < 0 ? "text-rose-600" : "text-slate-800"}`}
                  >
                    {formatCurrency(payment.amount, { currency })}
                  </p>
                </div>
              ))}
            </section>
          </div>
        </div>
      </div>

      <RegisterPaymentModal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        bookingId={refund.bookingId}
        tourId={tourId}
        tourCurrency={currency}
        balance={refund.refundableAmount}
        mode="REFUND"
      />
    </>
  );
}
