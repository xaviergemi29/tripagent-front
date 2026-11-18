"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CURRENCY, SUBSCRIPTION_STATUS } from "@/shared/constants/domain.constants";
import { formatCurrency } from "@/shared/utils/currency.util";
import {
  SUBSCRIPTION_SETTINGS_HREF,
  useSubscriptionAccess,
} from "../../hooks/useSubscriptionAccess";

/**
 * Banner superior fijo del panel en Modo Solo Lectura (feedback del PM, 2026-11-18). Explica qué se
 * puede seguir haciendo y lleva a Suscripción para activar el plan. No se dibuja si la cuenta opera.
 */
export function SubscriptionReadOnlyBanner() {
  const { isReadOnly, subscription } = useSubscriptionAccess();
  if (!isReadOnly || !subscription) return null;

  const title =
    subscription.status === SUBSCRIPTION_STATUS.PAST_DUE
      ? "Tu plan tiene un pago pendiente"
      : subscription.status === SUBSCRIPTION_STATUS.CANCELED
        ? "Tu plan está cancelado"
        : "Tu prueba gratuita terminó";

  return (
    <div
      role="status"
      className="flex flex-col gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-6"
    >
      <div className="flex items-start gap-2.5">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
        <p className="text-sm text-amber-900">
          <span className="font-semibold">{title}.</span> Tu cuenta está en modo solo lectura:
          puedes consultar tus tours, manifiestos y viajeros, pero no crear ni modificar nada.
        </p>
      </div>
      <Button
        asChild
        size="sm"
        className="w-full shrink-0 bg-amber-600 text-white hover:bg-amber-700 sm:w-auto"
      >
        <Link href={SUBSCRIPTION_SETTINGS_HREF}>
          Activar plan por {formatCurrency(subscription.priceMxn, { currency: CURRENCY.MXN })}/mes
        </Link>
      </Button>
    </div>
  );
}
