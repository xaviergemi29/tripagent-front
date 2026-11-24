"use client";

import { Check, CheckCircle2, CreditCard, Hourglass, ReceiptText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/shared/utils/currency.util";
import { formatForDateInput, formatSpanishLongDate } from "@/shared/utils/tour-date.util";
import { getPaymentMethodText } from "@/shared/utils/config/status-dictionaries.config";
import type { Currency } from "@/shared/constants/domain.constants";
import { DownloadStatementButton } from "../DownloadStatementButton";
import { buildStatementPayments } from "@/features/statements/pdf/payment-receipt.pdf";
import type { PartialPaymentViewProps } from "./types";

type PaymentSummaryCardProps = Pick<
  PartialPaymentViewProps,
  "tourInfo" | "groupSize" | "financials" | "paymentHistory" | "passengers" | "agency"
> & {
  tourCurrency: Currency;
  totalCost: number;
  totalPaid: number;
  remaining: number;
  percentagePaid: number;
  isFullyPaid: boolean;
};

/** "Tus pagos": total, pagado, saldo, avance, abonos registrados y descarga del estado de cuenta. */
export function PaymentSummaryCard({
  tourInfo,
  groupSize,
  financials,
  paymentHistory,
  passengers,
  agency,
  tourCurrency,
  totalCost,
  totalPaid,
  remaining,
  percentagePaid,
  isFullyPaid,
}: PaymentSummaryCardProps) {
  // Orden cronológico, el mismo del estado de cuenta PDF: "Abono N" coincide en ambos.
  const orderedPayments = buildStatementPayments(paymentHistory);
  return (
    <Card className="overflow-hidden rounded-2xl border-indigo-100/70 bg-white shadow-sm">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-indigo-900 uppercase">
          <CreditCard className="h-4 w-4 text-indigo-600" /> Tus Pagos
        </div>

        <div className="space-y-2.5">
          {/* Costo Total */}
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
            <div>
              <span className="block text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                Costo total del viaje
              </span>
              <span className="text-xl font-extrabold text-slate-900">
                {formatCurrency(totalCost, { currency: tourCurrency })}
              </span>
            </div>
            <div className="rounded-xl bg-slate-200/60 p-2 text-slate-600">
              <ReceiptText className="h-5 w-5" />
            </div>
          </div>

          {/* Lo que llevas pagado */}
          <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold tracking-wider text-emerald-800 uppercase">
                  Lo que llevas pagado
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Abonado
                </span>
              </div>
              <span className="text-xl font-extrabold text-emerald-700">
                +{formatCurrency(totalPaid, { currency: tourCurrency })}
              </span>
            </div>
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          {/* Te falta por pagar / Liquidado */}
          <div
            className={`flex items-center justify-between rounded-xl border p-3.5 ${
              isFullyPaid ? "border-slate-200 bg-slate-50/60" : "border-indigo-100 bg-indigo-50/40"
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold tracking-wider text-slate-600 uppercase">
                  Te falta por pagar
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isFullyPaid
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-indigo-100 text-indigo-700"
                  }`}
                >
                  {isFullyPaid ? "Completado" : "Pendiente"}
                </span>
              </div>
              <span
                className={`text-xl font-extrabold ${
                  isFullyPaid ? "text-slate-700" : "text-indigo-900"
                }`}
              >
                {formatCurrency(remaining, { currency: tourCurrency })}
              </span>
            </div>
            <div
              className={`rounded-xl p-2 ${
                isFullyPaid ? "bg-slate-200/60 text-slate-500" : "bg-indigo-100 text-indigo-700"
              }`}
            >
              {isFullyPaid ? <Check className="h-5 w-5" /> : <Hourglass className="h-5 w-5" />}
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700">
              {isFullyPaid ? "Viaje 100% pagado" : `Llevas cubierto el ${percentagePaid}%`}
            </span>
            <span className="font-bold text-indigo-600">{percentagePaid}% liquidado</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-500 ease-out"
              style={{ width: `${percentagePaid}%` }}
            />
          </div>
        </div>

        {/* 2. SECCIÓN: TUS ABONOS REGISTRADOS */}
        <div className="space-y-3 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-700 uppercase">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Tus Abonos Registrados
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
              {paymentHistory.length} {paymentHistory.length === 1 ? "pago" : "pagos"}
            </span>
          </div>

          {paymentHistory.length === 0 ? (
            <p className="py-3 text-center text-xs text-slate-400">
              Aún no se han registrado abonos en esta reservación.
            </p>
          ) : (
            <div className="space-y-2 pt-1">
              {orderedPayments.map((p, index) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 rounded-lg bg-indigo-50 p-2 text-indigo-600">
                      <ReceiptText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Abono {index + 1} • {getPaymentMethodText(p.method)}
                      </p>
                      <p className="text-[11px] text-slate-500 capitalize">
                        {formatSpanishLongDate(formatForDateInput(p.date))}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold whitespace-nowrap text-emerald-600">
                    +{formatCurrency(p.amount, { currency: tourCurrency })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* BOTÓN DESCARGAR COMPROBANTE EN PDF */}
          <div className="pt-2">
            <DownloadStatementButton
              source={{
                tourInfo,
                groupSize,
                financials,
                paymentHistory,
                passengers,
                agency,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
