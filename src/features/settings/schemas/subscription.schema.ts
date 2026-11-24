import z from "zod";
import {
  SUBSCRIPTION_CANCELLATION_COMMENT_MAX,
  SUBSCRIPTION_CANCELLATION_REASONS,
} from "@/shared/constants/domain.constants";
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
  /**
   * ISO. Fin del periodo pagado con el plan activo o la baja programada (la registrada por TripAgent
   * o, sin fecha, el fin del mes en curso). `null` en prueba o con el plan vencido.
   */
  currentPeriodEndsAt: z.string().nullable(),
  /** Baja programada (`cancel_scheduled`); `null` en cualquier otro estado. */
  cancellation: z
    .object({
      canceledAt: z.string().nullable(),
      reason: z.string().nullable(),
      comment: z.string().nullable(),
    })
    .nullable(),
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

/** Formulario y cuerpo de `POST /agencies/subscription/cancel`. */
export const cancelSubscriptionInputSchema = z.object({
  reason: z.enum(SUBSCRIPTION_CANCELLATION_REASONS, "Selecciona un motivo"),
  comments: z
    .string()
    .trim()
    .max(
      SUBSCRIPTION_CANCELLATION_COMMENT_MAX,
      `Máximo ${SUBSCRIPTION_CANCELLATION_COMMENT_MAX} caracteres`,
    )
    .optional(),
});

export type CancelSubscriptionInput = z.input<typeof cancelSubscriptionInputSchema>;
