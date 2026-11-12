import { z } from "zod";
import { PAYMENT_METHODS } from "@/shared/constants/domain.constants";

export const paymentFormSchema = z.object({
  amount: z.number("Ingresa un monto").positive("El monto debe ser mayor a $0"),
  method: z.enum(PAYMENT_METHODS, "Selecciona un método"),
  type: z.literal("PAYMENT"),
  referenceInfo: z.string().optional(),
});

export type PaymentFormInput = z.infer<typeof paymentFormSchema>;
