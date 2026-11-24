import { z } from "zod";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  PAYMENT_METHODS,
  PAYMENT_TYPES,
} from "@/shared/constants/domain.constants";
import {
  EXCHANGE_RATE_DECIMALS,
  hasAtMostDecimals,
} from "@/features/tour-dashboard/utils/exchange-rate.util";

/** Formulario de `RegisterPaymentModal` (abono o reembolso). Única definición del front. */
export const paymentFormSchema = z.object({
  amount: z.number("Ingresa un monto").positive("El monto debe ser mayor a $0"),
  method: z.enum(PAYMENT_METHODS, "Selecciona un método"),
  // REFUND: devolución al cliente (monto positivo; la API lo guarda en negativo).
  type: z.enum(PAYMENT_TYPES),
  referenceInfo: z.string().optional(),
  // Solo tours en USD (RB-PAG-004). `0` = campo vacío (`NumericInput`).
  collectedAmount: z.number().optional(),
  exchangeRate: z.number().optional(),
});

/**
 * Reglas del formulario según la moneda del tour. En USD: pesos > 0 (2 decimales), tipo de cambio
 * > 0 (hasta 4 decimales) y dólares con 2 decimales (espejo de `createPaymentBodySchema` de la API).
 * En MXN no cambia nada.
 */
export const buildPaymentFormSchema = ({ isUSD }: { isUSD: boolean }) =>
  paymentFormSchema.superRefine((values, ctx) => {
    if (!isUSD) return;
    if (!hasAtMostDecimals(values.amount, 2)) {
      ctx.addIssue({ code: "custom", path: ["amount"], message: "Máximo 2 decimales" });
    }
    const collected = values.collectedAmount ?? 0;
    if (!(collected > 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["collectedAmount"],
        message: "Ingresa el monto en pesos",
      });
    } else if (!hasAtMostDecimals(collected, 2)) {
      ctx.addIssue({ code: "custom", path: ["collectedAmount"], message: "Máximo 2 decimales" });
    }
    const rate = values.exchangeRate ?? 0;
    if (!(rate > 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["exchangeRate"],
        message: "Ingresa el tipo de cambio",
      });
    } else if (!hasAtMostDecimals(rate, EXCHANGE_RATE_DECIMALS)) {
      ctx.addIssue({
        code: "custom",
        path: ["exchangeRate"],
        message: `Máximo ${EXCHANGE_RATE_DECIMALS} decimales`,
      });
    }
  });

export const createPaymentInputSchema = paymentFormSchema
  .omit({ collectedAmount: true, exchangeRate: true })
  .extend({
    currency: z.enum(CURRENCIES).default(DEFAULT_CURRENCY),
    collectedAmount: z.number().positive().optional(),
    collectedCurrency: z.enum(CURRENCIES).optional(),
    exchangeRate: z.number().positive().optional(),
  });

export const paymentRecordSchema = z.object({
  id: z.uuid(),
  agencyId: z.uuid(),
  bookingId: z.uuid(),
  createdByUserId: z.string(),
  type: z.string(),
  method: z.string(),
  amount: z.number(),
  currency: z.string(),
  collectedAmount: z.null(),
  collectedCurrency: z.null(),
  exchangeRate: z.null(),
  referenceInfo: z.string(),
  createdAt: z.string(),
});

export const bookingBalanceSchema = z.object({
  totalPrice: z.number(),
  amountPaid: z.number(),
  remainingBalance: z.number(),
  paymentStatus: z.string(), // Considera usar un z.enum() si tienes estados definidos ej: ["PAID", "PARTIAL", "PENDING"]
});

export const paymentInputSchema = z.object({
  bookingId: z.uuid(),
  payload: createPaymentInputSchema,
});

export const voidPaymentInputSchema = z.object({
  bookingId: z.uuid(),
  paymentId: z.uuid(),
  data: z.object({
    reason: z.string().min(5, "La razón de cancelación debe ser detallada"),
  }),
});

export const paymentOutputSchema = z.object({
  success: z.boolean(),
  data: z.object({
    payment: paymentRecordSchema,
    bookingBalance: bookingBalanceSchema,
  }),
});

export const voidPaymentOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    voidRecord: paymentRecordSchema,
    bookingBalance: bookingBalanceSchema,
  }),
});

export type VoidPaymentInput = z.input<typeof voidPaymentInputSchema>;
export type VoidPaymentOutput = z.input<typeof voidPaymentOutputSchema>;
export type PaymentInput = z.input<typeof paymentInputSchema>;
export type PaymentOutput = z.input<typeof paymentOutputSchema>;
export type PaymentFormInput = z.infer<typeof paymentFormSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentInputSchema>;
