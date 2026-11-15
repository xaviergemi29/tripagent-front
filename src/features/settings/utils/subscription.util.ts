/**
 * Utilidades de la pestaña Suscripción. Los días y la referencia los calcula la API; aquí solo se
 * arman URLs y textos de presentación.
 */

/** Porcentaje de la prueba consumido (0–100), para la barra de progreso. */
export const getTrialConsumedPercent = (consumed: number, total: number): number =>
  total > 0 ? Math.min(100, Math.max(0, Math.round((consumed / total) * 100))) : 100;

/**
 * Payment Link de Stripe con `client_reference_id` = id de la agencia, para conciliar el pago.
 * Respeta los parámetros que ya traiga el enlace.
 */
export const buildStripeCheckoutUrl = (paymentLink: string, agencyId: string): string => {
  const url = new URL(paymentLink);
  url.searchParams.set("client_reference_id", agencyId);
  return url.toString();
};

/** Mensaje prellenado para enviar el comprobante SPEI por WhatsApp. */
export const buildSpeiReceiptMessage = (agencyName: string, reference: string): string =>
  `¡Hola TripAgent! Adjunto mi comprobante de pago SPEI para activar el Plan PRO de mi agencia: ${agencyName} (Referencia: ${reference}).`;

/** Fecha `YYYY-MM-DD` en hora de CDMX (para `formatSpanishLongDate`), no la fecha UTC del ISO. */
export const toMexicoDateString = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
