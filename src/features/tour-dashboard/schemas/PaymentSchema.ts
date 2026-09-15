import { z } from "zod";

export const formSchema = z.object({
  amount: z.coerce.number().positive("El monto debe ser mayor a $0"),
  method: z.enum(["CASH", "TRANSFER", "CARD", "OTHER"], "Selecciona un método"),
  type: z.literal("PAYMENT"),
  referenceInfo: z.string().optional(),
});

export type FormData = z.infer<typeof formSchema>;