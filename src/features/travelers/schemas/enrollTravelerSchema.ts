import { z } from "zod";

export const paymentFormSchema = z.object({
  amount: z.number("Ingresa un monto").positive("El monto debe ser mayor a $0"),
  method: z.enum(["CASH", "TRANSFER", "CARD", "OTHER"],  "Selecciona un método"),
  type: z.literal("PAYMENT"),
  referenceInfo: z.string().optional(),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;
