import { z } from "zod";

export const paymentFormSchema = z.object({
  amount: z.coerce.number().positive("El monto debe ser mayor a $0"),
  method: z.enum(["CASH", "TRANSFER", "CARD", "OTHER"], "Selecciona un método"),
  type: z.literal("PAYMENT").default("PAYMENT"),
  referenceInfo: z.string().optional(),
});

export const createPaymentPayloadSchema = paymentFormSchema.extend({
  currency: z.enum(["MXN", "USD"]).default("MXN"),
  collectedAmount: z.number().positive().optional(),
  collectedCurrency: z.enum(["MXN", "USD"]).optional(),
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
  payload: createPaymentPayloadSchema,
});

export const voidPaymentSchema = z.object({
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

export type VoidPaymentInput = z.input<typeof voidPaymentSchema>;
export type VoidPaymentOutput = z.input<typeof voidPaymentOutputSchema>;
export type PaymentInput = z.input<typeof paymentInputSchema>;
export type PaymentOutput = z.input<typeof paymentOutputSchema>;
export type PaymentFormValues = z.infer<typeof paymentFormSchema>;
export type CreatePaymentPayload = z.infer<typeof createPaymentPayloadSchema>;
