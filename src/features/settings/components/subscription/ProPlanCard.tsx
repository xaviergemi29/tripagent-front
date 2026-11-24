import { BadgeCheck, Check, CreditCard, Landmark, Lock } from "lucide-react";
import { SUBSCRIPTION_STATUS } from "@/shared/constants/domain.constants";
import { formatCurrency } from "@/shared/utils/currency.util";
import type { SubscriptionOutput } from "../../schemas/subscription.schema";

const PRO_BENEFITS = [
  "Tours y folletos ilimitados",
  "Mapeo de asientos en vivo",
  "Comprobantes PDF personalizados",
  "Soporte directo por WhatsApp",
] as const;

interface ProPlanCardProps {
  subscription: SubscriptionOutput;
  /** Sin Payment Link configurado en la API no se recibe y el botón queda deshabilitado. */
  onPayWithCard?: () => void;
  /** Sin datos SPEI configurados en la API no se recibe y el botón queda deshabilitado. */
  onPayWithSpei?: () => void;
}

/**
 * Separa el importe de su divisa para el bloque de precio ("$999.00" grande, "MXN/mes" chico)
 * sin dejar de usar el formato oficial de `formatCurrency` ("$999.00 MXN").
 */
const splitCurrency = (formatted: string): { amount: string; code: string } => {
  const lastSpace = formatted.lastIndexOf(" ");
  return lastSpace > 0
    ? { amount: formatted.slice(0, lastSpace), code: formatted.slice(lastSpace + 1) }
    : { amount: formatted, code: "" };
};

/** Tarjeta derecha: Plan Agencia PRO, beneficios y botones de pago (tarjeta o SPEI). */
export function ProPlanCard({ subscription, onPayWithCard, onPayWithSpei }: ProPlanCardProps) {
  // Una baja programada conserva el plan hasta la fecha de corte: no se ofrece volver a pagar.
  const isActive =
    subscription.status === SUBSCRIPTION_STATUS.ACTIVE ||
    (subscription.status === SUBSCRIPTION_STATUS.CANCEL_SCHEDULED && !subscription.isReadOnly);
  const hasAllPaymentOptions = Boolean(onPayWithCard && onPayWithSpei);
  const price = splitCurrency(formatCurrency(subscription.priceMxn, { currency: "MXN" }));

  return (
    <section className="relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-indigo-500/20 bg-white p-6 shadow-lg shadow-indigo-100/40 sm:p-8">
      <div>
        <div className="mb-2 flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
            Recomendado para tu agencia
          </span>
          <div className="sm:text-right">
            <p>
              <span className="text-3xl font-extrabold text-slate-900">{price.amount}</span>
              <span className="text-xs font-medium text-slate-500"> {price.code}/mes</span>
            </p>
            <p className="text-[11px] text-slate-400">IVA incluido • Sin plazos forzosos</p>
          </div>
        </div>

        <h3 className="mt-2 text-2xl font-black text-slate-900">Plan Agencia PRO</h3>
        <p className="mt-1 text-sm text-slate-600">
          Todo lo que necesitas para llenar tus salidas y cobrar sin caos.
        </p>

        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PRO_BENEFITS.map((benefit) => (
            <li
              key={benefit}
              className="flex items-center gap-2 text-xs font-semibold text-slate-700"
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
              </span>
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 space-y-3">
        {isActive ? (
          <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700">
            {subscription.status === SUBSCRIPTION_STATUS.CANCEL_SCHEDULED
              ? "Tu Plan Agencia PRO sigue activo hasta tu fecha de corte."
              : "Tu Plan Agencia PRO está activo."}
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={onPayWithCard}
              disabled={!onPayWithCard}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:bg-indigo-600 disabled:active:scale-100"
            >
              <CreditCard className="h-5 w-5" aria-hidden />
              <span>Activar Plan con Tarjeta</span>
              <span className="text-indigo-200" aria-hidden>
                →
              </span>
            </button>
            <button
              type="button"
              onClick={onPayWithSpei}
              disabled={!onPayWithSpei}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50 px-6 py-3.5 text-sm font-bold text-indigo-700 transition-all hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-indigo-50"
            >
              <Landmark className="h-5 w-5 text-indigo-600" aria-hidden />
              <span>Pagar por Transferencia SPEI</span>
            </button>
            {/* Un canal sin configurar en la API (`SUBSCRIPTION_*`) se ve, pero deshabilitado. */}
            {!hasAllPaymentOptions && (
              <p className="text-center text-[11px] text-slate-500">
                {onPayWithCard || onPayWithSpei
                  ? "Uno de los medios de pago aún no está disponible."
                  : "Los medios de pago aún no están disponibles. Contacta a TripAgent para activar tu plan."}
              </p>
            )}
            <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-slate-400">
              <Lock className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
              <span>Pagos seguros con tarjeta o transferencia SPEI</span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
