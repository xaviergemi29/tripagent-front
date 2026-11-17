"use client";

import { useState } from "react";
import { QueryErrorState } from "@/components/shared/QueryErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/features/auth/hooks/useSession";
import { useAgencySubscription } from "../../hooks/useAgencySubscription";
import { buildStripeCheckoutUrl } from "../../utils/subscription.util";
import { ProPlanCard } from "./ProPlanCard";
import { SpeiPaymentModal } from "./SpeiPaymentModal";
import { SubscriptionStatusCard } from "./SubscriptionStatusCard";
import { TrialLockInfo } from "./TrialLockInfo";

/**
 * Configuración → Suscripción (`?tab=subscription`): estado actual, Plan Agencia PRO, candado suave
 * y pago por tarjeta (Stripe Payment Link) o SPEI. Todo viene de `GET /agencies/subscription`.
 */
export function SubscriptionTab() {
  const { data: subscription, isLoading, isError, refetch, isFetching } = useAgencySubscription();
  const { data: session } = useSession();
  const [isSpeiOpen, setIsSpeiOpen] = useState(false);

  // Falló sin datos: motivo + Reintentar (2026-11-16; antes un aviso fijo sin forma de recuperarse).
  // Si falla una recarga con datos en caché, se siguen mostrando.
  if (isError && !subscription) {
    return (
      <QueryErrorState
        resourceArticle="tu"
        resourceName="suscripción"
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  if (isLoading || !subscription) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-[30rem] w-full rounded-3xl" />
        <Skeleton className="h-[30rem] w-full rounded-3xl" />
      </div>
    );
  }

  const { stripePaymentLink, speiDetails } = subscription;
  const agencyId = session?.agencyId;

  // Redirección con `client_reference_id` para conciliar el pago con la agencia.
  const handlePayWithCard =
    stripePaymentLink && agencyId
      ? () => window.location.assign(buildStripeCheckoutUrl(stripePaymentLink, agencyId))
      : undefined;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
        <SubscriptionStatusCard subscription={subscription} />
        <ProPlanCard
          subscription={subscription}
          onPayWithCard={handlePayWithCard}
          onPayWithSpei={speiDetails ? () => setIsSpeiOpen(true) : undefined}
        />
      </div>

      <TrialLockInfo />

      {speiDetails && (
        <SpeiPaymentModal
          open={isSpeiOpen}
          onOpenChange={setIsSpeiOpen}
          spei={speiDetails}
          amountMxn={subscription.priceMxn}
          agencyName={session?.agencyName ?? ""}
          whatsappNumber={subscription.whatsappSupportNumber}
        />
      )}
    </div>
  );
}
