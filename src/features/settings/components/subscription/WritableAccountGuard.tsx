"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SUBSCRIPTION_SETTINGS_HREF,
  useSubscriptionAccess,
} from "../../hooks/useSubscriptionAccess";

/**
 * Pantallas que solo sirven para crear o editar (Nuevo tour, Editar tour). En Modo Solo Lectura
 * redirigen a Suscripción, donde el banner superior explica por qué (feedback del PM, 2026-11-18).
 * Mientras se consulta la suscripción no dibuja el formulario, para no mostrarlo un instante.
 */
export function WritableAccountGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isReadOnly, isLoading } = useSubscriptionAccess();

  useEffect(() => {
    if (isReadOnly) router.replace(SUBSCRIPTION_SETTINGS_HREF);
  }, [isReadOnly, router]);

  if (isLoading) {
    return <div className="animate-pulse p-10 text-center text-slate-500">Cargando…</div>;
  }
  if (isReadOnly) return null;
  return <>{children}</>;
}
