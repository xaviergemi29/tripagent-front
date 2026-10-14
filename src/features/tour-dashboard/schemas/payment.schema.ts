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

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;
export type CreatePaymentPayload = z.infer<typeof createPaymentPayloadSchema>;
