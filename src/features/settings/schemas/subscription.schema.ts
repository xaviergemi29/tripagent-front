import z from "zod";
import { subscriptionStatusSchema } from "./agency.schema";

/**
 * Respuesta de `GET /agencies/subscription`. Lo calcula la API (días de prueba en hora de CDMX,
 * métricas y referencia SPEI): el front no lo recalcula. Los canales de pago son de TripAgent y
 * llegan en `null` si no están configurados (el front oculta ese botón).
 */
export const subscriptionOutputSchema = z.object({
  status: subscriptionStatusSchema,
  trialDaysTotal: z.number(),
  trialDaysConsumed: z.number(),
  trialDaysRemaining: z.number(),
  /** Verdadero desde el instante de vencimiento (el estado en BD sigue en "trialing"). */
  trialExpired: z.boolean(),
  /**
   * Modo Solo Lectura (2026-11-18): prueba vencida, pago pendiente o plan cancelado. La API rechaza
   * toda mutación de negocio con 402; el front oculta o deshabilita esas acciones sin recalcular.
   */
  isReadOnly: z.boolean(),
  /** ISO. Si la agencia no tenía fecha guardada, la API usa el alta + 30 días. */
  trialEndsAt: z.string(),
  priceMxn: z.number(),
  metrics: z.object({
    activeToursCount: z.number(),
    registeredTravelersCount: z.number(),
  }),
  speiDetails: z
    .object({
      bank: z.string(),
      beneficiary: z.string(),
      /** 18 dígitos sin separadores. */
      clabe: z.string(),
      reference: z.string(),
    })
    .nullable(),
  stripePaymentLink: z.string().nullable(),
  /** Con lada (p. ej. `522281234567`). */
  whatsappSupportNumber: z.string().nullable(),
});

export type SubscriptionOutput = z.infer<typeof subscriptionOutputSchema>;
