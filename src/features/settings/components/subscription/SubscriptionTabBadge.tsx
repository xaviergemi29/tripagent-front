"use client";

import { SUBSCRIPTION_STATUS } from "@/shared/constants/domain.constants";
import { useAgencySubscription } from "../../hooks/useAgencySubscription";

/**
 * Insignia de la pestaña Suscripción: ámbar "Prueba Nd" en prueba (roja "Prueba vencida" si ya
 * venció) y verde "Plan PRO" con el plan activo. En otros estados o mientras carga, nada.
 */
export function SubscriptionTabBadge() {
  const { data: subscription } = useAgencySubscription();
  if (!subscription) return null;

  if (subscription.status === SUBSCRIPTION_STATUS.ACTIVE) {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
        Plan PRO
      </span>
    );
  }

  if (subscription.status === SUBSCRIPTION_STATUS.CANCEL_SCHEDULED && !subscription.isReadOnly) {
    return (
      <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
        Baja programada
      </span>
    );
  }

  if (subscription.status === SUBSCRIPTION_STATUS.TRIALING) {
    return subscription.trialExpired ? (
      <span className="rounded-full border border-red-300 bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
        Prueba vencida
      </span>
    ) : (
      <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
        Prueba {subscription.trialDaysRemaining}d
      </span>
    );
  }

  return null;
}
