"use client";

import { useState } from "react";
import { QueryErrorState } from "@/components/shared/QueryErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/features/auth/hooks/useSession";
import { CalendarClock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AGENCY_ROLE, SUBSCRIPTION_STATUS } from "@/shared/constants/domain.constants";
import {
  useAgencySubscription,
  useReactivateSubscription,
} from "../../hooks/useAgencySubscription";
import { buildStripeCheckoutUrl, formatSubscriptionDate } from "../../utils/subscription.util";
import { CancelSubscriptionDialog } from "./CancelSubscriptionDialog";
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
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const { mutate: reactivate, isPending: isReactivating } = useReactivateSubscription();

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
  // Baja y reactivación: solo el administrador de la agencia (la API responde 403 a otros roles).
  const isAdmin = session?.role === AGENCY_ROLE.ADMIN;
  const periodEndsOn = subscription.currentPeriodEndsAt
    ? formatSubscriptionDate(subscription.currentPeriodEndsAt)
    : null;
  const isCancelScheduled =
    subscription.status === SUBSCRIPTION_STATUS.CANCEL_SCHEDULED && !subscription.isReadOnly;
  const canCancel = isAdmin && subscription.status === SUBSCRIPTION_STATUS.ACTIVE && periodEndsOn;

  // Redirección con `client_reference_id` para conciliar el pago con la agencia.
  const handlePayWithCard =
    stripePaymentLink && agencyId
      ? () => window.location.assign(buildStripeCheckoutUrl(stripePaymentLink, agencyId))
      : undefined;

  return (
    <div className="space-y-6">
      {isCancelScheduled && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2.5">
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
            <p className="text-sm text-amber-900">
              <span className="font-semibold">Cancelación programada.</span> Tendrás acceso completo
              hasta el {periodEndsOn}.
            </p>
          </div>
          {isAdmin && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => reactivate()}
              disabled={isReactivating}
              className="w-full shrink-0 border-amber-300 bg-white text-amber-800 hover:bg-amber-100 sm:w-auto"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              {isReactivating ? "Reactivando..." : "Reactivar suscripción"}
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
        <SubscriptionStatusCard subscription={subscription} />
        <ProPlanCard
          subscription={subscription}
          onPayWithCard={handlePayWithCard}
          onPayWithSpei={speiDetails ? () => setIsSpeiOpen(true) : undefined}
        />
      </div>

      <TrialLockInfo />

      {canCancel && (
        <div className="text-center sm:text-right">
          <button
            type="button"
            onClick={() => setIsCancelOpen(true)}
            className="text-xs font-medium text-slate-400 underline-offset-4 hover:text-red-600 hover:underline"
          >
            Cancelar suscripción
          </button>
          <CancelSubscriptionDialog
            open={isCancelOpen}
            onOpenChange={setIsCancelOpen}
            periodEndsOn={periodEndsOn}
          />
        </div>
      )}

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
