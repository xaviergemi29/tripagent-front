import { useAgencySubscription } from "./useAgencySubscription";

/** Destino del banner y de las pantallas de alta o edición en Modo Solo Lectura. */
export const SUBSCRIPTION_SETTINGS_HREF = "/settings?tab=subscription";

/**
 * Modo Solo Lectura por suscripción (feedback del PM, 2026-11-18). Con la prueba vencida o el pago
 * pendiente la agencia consulta todo, pero no hace cambios: la API responde 402 a toda mutación de
 * negocio y la interfaz oculta o deshabilita esas acciones. Usa `isReadOnly` de
 * `GET /agencies/subscription` tal cual (no recalcula la regla).
 *
 * - `isReadOnly`: la API confirmó el Modo Solo Lectura (banner y redirecciones).
 * - `canWrite`: ya se sabe que la cuenta opera. Mientras carga es falso, para no mostrar un instante
 *   acciones que la API rechazaría; si la consulta falla es verdadero (la API sigue siendo el candado
 *   real y un 402 llega al toast con su mensaje).
 */
export function useSubscriptionAccess() {
  const { data, isLoading } = useAgencySubscription();
  const isReadOnly = data?.isReadOnly ?? false;
  return {
    isReadOnly,
    isLoading,
    canWrite: !isLoading && !isReadOnly,
    subscription: data,
  };
}
