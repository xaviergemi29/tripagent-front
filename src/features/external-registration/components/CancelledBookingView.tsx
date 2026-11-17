import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { AgencyLogo } from "@/components/shared/AgencyLogo";
import type {
  Currency,
  RefundStatus,
  TourCancellationReason,
} from "@/shared/constants/domain.constants";
import { TOUR_CANCELLATION_REASON_DICT } from "@/shared/utils/config/status-dictionaries.config";
import { formatCurrency } from "@/shared/utils/currency.util";
import { REFUND_STATUS } from "@/shared/constants/domain.constants";

/** Payload de `flowState = CANCELLED` del Magic Link (props serializables: Server Component). */
export interface CancelledBookingData {
  tourInfo?: { title: string; departureDateTime: string; currency: Currency };
  cancellation?: {
    byAgency: boolean;
    reason: TourCancellationReason | null;
    cancelledAt: string | null;
  };
  /** Solo cuando canceló la agencia; null si canceló el cliente (no hay devolución). */
  refund?: {
    paidAmount: number;
    retainedAmount: number;
    refundedAmount: number;
    refundableAmount: number;
    refundStatus: RefundStatus;
  } | null;
}

interface CancelledBookingViewProps {
  agency: { name: string; logoPath: string | null } | null;
  data?: CancelledBookingData | null;
}

/**
 * Reserva cancelada en el Magic Link. Si la canceló la agencia (decisión del PM, 2026-11-14) muestra
 * el aviso con el motivo y el estado de la devolución de su dinero; si no, el mensaje genérico.
 */
export function CancelledBookingView({ agency, data }: CancelledBookingViewProps) {
  const cancellation = data?.cancellation;
  const refund = data?.refund;
  const currency = data?.tourInfo?.currency;
  const byAgency = Boolean(cancellation?.byAgency);
  const reasonLabel = cancellation?.reason
    ? TOUR_CANCELLATION_REASON_DICT[cancellation.reason]
    : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 p-4">
      {agency && (
        <div className="flex items-center gap-2.5">
          <AgencyLogo
            logoPath={agency.logoPath}
            agencyName={agency.name}
            className="h-10 w-10 rounded-xl"
            fallbackClassName="bg-indigo-50 text-indigo-600"
          />
          <span className="text-sm font-bold text-slate-800">{agency.name}</span>
        </div>
      )}
      <div className="w-full max-w-md space-y-4 rounded-2xl border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <XCircle className="h-7 w-7" />
        </div>

        {byAgency ? (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">Viaje cancelado por la agencia</h2>
            {data?.tourInfo?.title && (
              <p className="text-sm font-semibold text-slate-700">{data.tourInfo.title}</p>
            )}
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-sm text-amber-900"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>
                Este viaje ha sido cancelado por la agencia
                {reasonLabel ? (
                  <>
                    . Motivo: <strong>{reasonLabel}</strong>.
                  </>
                ) : (
                  "."
                )}
              </span>
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Reservación cancelada</h2>
            {/* Decisión del PM (2026-11-14): si canceló el cliente no hay devolución en efectivo; no
                se muestran montos para no generar expectativas de reembolso. */}
            <p className="text-sm leading-relaxed text-slate-500">
              Tu reservación fue cancelada y se aplicó la penalización correspondiente según las
              políticas de {agency?.name ?? "la agencia"}.
            </p>
          </div>
        )}

        {byAgency && refund && refund.paidAmount > 0 && (
          <dl className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Total abonado</dt>
              <dd className="font-semibold text-slate-900">
                {formatCurrency(refund.paidAmount, { currency })}
              </dd>
            </div>
            {refund.refundedAmount > 0 && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Reembolsado</dt>
                <dd className="font-semibold text-emerald-700">
                  {formatCurrency(refund.refundedAmount, { currency })}
                </dd>
              </div>
            )}
            <div className="flex items-start justify-between gap-3 border-t border-slate-200 pt-2">
              <dt className="text-slate-500">Estado de devolución</dt>
              <dd className="text-right font-semibold">
                {refund.refundStatus === REFUND_STATUS.COMPLETED ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Reembolsado con éxito
                  </span>
                ) : refund.refundStatus === REFUND_STATUS.PENDING ? (
                  <span className="inline-flex flex-col items-end text-amber-700">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-4 w-4" /> En proceso de transferencia SPEI
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      Pendiente: {formatCurrency(refund.refundableAmount, { currency })}
                    </span>
                  </span>
                ) : (
                  <span className="text-slate-600">Sin devolución pendiente</span>
                )}
              </dd>
            </div>
          </dl>
        )}

        {byAgency && (
          <p className="text-xs text-slate-500">
            Si tienes dudas sobre tu devolución, contacta directamente a{" "}
            {agency?.name ?? "la agencia"}.
          </p>
        )}
      </div>
    </div>
  );
}
