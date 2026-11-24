import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUBSCRIPTION_STATUS } from "@/shared/constants/domain.constants";
import { formatSpanishLongDate } from "@/shared/utils/tour-date.util";
import type { SubscriptionOutput } from "../../schemas/subscription.schema";
import {
  formatSubscriptionDate,
  getTrialConsumedPercent,
  toMexicoDateString,
} from "../../utils/subscription.util";

type StatusTone = "amber" | "red" | "emerald" | "slate";

const TONE_STYLES: Record<StatusTone, { badge: string; dot: string }> = {
  amber: { badge: "border-amber-200 bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  red: { badge: "border-red-200 bg-red-50 text-red-700", dot: "bg-red-500" },
  emerald: { badge: "border-emerald-200 bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  slate: { badge: "border-slate-200 bg-slate-50 text-slate-600", dot: "bg-slate-400" },
};

interface StatusView {
  tone: StatusTone;
  badge: string;
  title: string;
  subtitle: string;
  showTrialProgress: boolean;
  metricsTitle: string;
}

/** Textos de la tarjeta según el estado que calcula la API (el verde solo con el plan activo). */
const getStatusView = (subscription: SubscriptionOutput): StatusView => {
  const endsOn = formatSpanishLongDate(toMexicoDateString(subscription.trialEndsAt));
  const remaining = subscription.trialDaysRemaining;
  const periodEndsOn = subscription.currentPeriodEndsAt
    ? formatSubscriptionDate(subscription.currentPeriodEndsAt)
    : null;

  switch (subscription.status) {
    case SUBSCRIPTION_STATUS.ACTIVE:
      return {
        tone: "emerald",
        badge: "Plan PRO activo",
        title: "Plan Agencia PRO",
        subtitle: periodEndsOn
          ? `Próximo vencimiento: ${periodEndsOn} · Método de pago: Transferencia bancaria`
          : "Tu suscripción está al corriente. ¡Gracias por confiar en TripAgent!",
        showTrialProgress: false,
        metricsTitle: "Tu operación en TripAgent",
      };
    case SUBSCRIPTION_STATUS.CANCEL_SCHEDULED:
      return subscription.isReadOnly
        ? {
            tone: "slate",
            badge: "Suscripción cancelada",
            title: "Tu suscripción está cancelada",
            subtitle: `Tu acceso completo terminó${periodEndsOn ? ` el ${periodEndsOn}` : ""}. Reactiva tu plan cuando quieras: tu información sigue intacta.`,
            showTrialProgress: false,
            metricsTitle: "Tu operación en TripAgent",
          }
        : {
            tone: "amber",
            badge: "Cancelación programada",
            title: periodEndsOn
              ? `Acceso completo hasta: ${periodEndsOn}`
              : "Cancelación programada",
            subtitle:
              "Después de esa fecha tu cuenta pasará a Modo Solo Lectura, sin perder información.",
            showTrialProgress: false,
            metricsTitle: "Tu operación en TripAgent",
          };
    case SUBSCRIPTION_STATUS.PAST_DUE:
      return {
        tone: "red",
        badge: "Pago pendiente",
        title: "Tu pago está pendiente",
        subtitle: "No hemos registrado tu último pago. Actívalo para seguir operando sin pausas.",
        showTrialProgress: false,
        metricsTitle: "Tu operación en TripAgent",
      };
    case SUBSCRIPTION_STATUS.CANCELED:
      return {
        tone: "slate",
        badge: "Suscripción cancelada",
        title: "Tu suscripción está cancelada",
        subtitle: "Reactiva tu plan cuando quieras: tu información sigue intacta.",
        showTrialProgress: false,
        metricsTitle: "Tu operación en TripAgent",
      };
    default:
      return subscription.trialExpired
        ? {
            tone: "red",
            badge: "Prueba vencida",
            title: `Venció: ${endsOn}`,
            subtitle: "Tu periodo de prueba terminó. Activa tu plan para seguir operando.",
            showTrialProgress: true,
            metricsTitle: "Valor obtenido en tu prueba",
          }
        : {
            tone: "amber",
            badge: "Periodo de Prueba",
            title: `Vence: ${endsOn}`,
            subtitle:
              remaining === 1
                ? "Queda 1 día de prueba gratuita"
                : `Quedan ${remaining} días de prueba gratuita`,
            showTrialProgress: true,
            metricsTitle: "Valor obtenido en tu prueba",
          };
  }
};

/** Tarjeta izquierda: estado de la suscripción, consumo de la prueba y métricas de uso. */
export function SubscriptionStatusCard({ subscription }: { subscription: SubscriptionOutput }) {
  const view = getStatusView(subscription);
  const tone = TONE_STYLES[view.tone];
  const { trialDaysConsumed, trialDaysTotal, metrics } = subscription;
  const percentConsumed = getTrialConsumedPercent(trialDaysConsumed, trialDaysTotal);

  return (
    <section className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            Estatus Actual
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold",
              tone.badge,
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                tone.dot,
                view.tone === "amber" && "animate-pulse",
              )}
              aria-hidden
            />
            {view.badge}
          </span>
        </div>

        <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl">{view.title}</h3>
        <p className="mt-1 text-sm text-slate-500">{view.subtitle}</p>

        {view.showTrialProgress && (
          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="mb-2 flex flex-wrap justify-between gap-1 text-xs font-semibold text-slate-600">
              <span>Tiempo de prueba consumido</span>
              <span>
                Día {trialDaysConsumed} de {trialDaysTotal} ({percentConsumed}%)
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Tiempo de prueba consumido"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percentConsumed}
              className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200"
            >
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${percentConsumed}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-6">
          <span className="mb-3 block text-xs font-bold tracking-wider text-slate-400 uppercase">
            {view.metricsTitle}
          </span>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-indigo-100/60 bg-indigo-50/50 p-4">
              <span className="block text-3xl font-extrabold text-indigo-950">
                {metrics.activeToursCount.toLocaleString("es-MX")}
              </span>
              <span className="text-xs font-medium text-slate-600">Tours activos</span>
            </div>
            <div className="rounded-2xl border border-indigo-100/60 bg-indigo-50/50 p-4">
              <span className="block text-3xl font-extrabold text-indigo-950">
                {metrics.registeredTravelersCount.toLocaleString("es-MX")}
              </span>
              <span className="text-xs font-medium text-slate-600">Viajeros registrados</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-start gap-3 border-t border-slate-100 pt-4 text-xs text-slate-600">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
        <p>
          <strong className="text-slate-800">Tus datos están protegidos:</strong> Siempre tendrás
          acceso permanente a tus bitácoras y registros en modo consulta, sin pérdida de
          información.
        </p>
      </div>
    </section>
  );
}
