import z from "zod";

export const baseAgencySchema = z.object({
  name: z.string().trim().min(3, "La agencia debe tener al menos 3 caracteres"),
  phone: z
    .string()
    .trim()
    .regex(/^(\+)?\d{10,14}$/, "Debe ser un teléfono válido de al menos 10 dígitos"),
  isActive: z.boolean().default(true),
  bankName: z.string().optional().nullable(),
  bankAccountHolder: z.string().optional().nullable(),
  clabeNumber: z.string().max(18, "Máximo 18 dígitos").optional().nullable(),
});

export const createAgencyBodySchema = baseAgencySchema;
export const updateAgencyBodySchema = baseAgencySchema.partial();

export const getAgencybyIdParamSchema = z.object({
  id: z.uuid("El ID de la agencia debe ser un UUID válido"),
});

export type CreateAgencyBody = z.infer<typeof createAgencyBodySchema>;
export type UpdateAgencyBody = z.infer<typeof updateAgencyBodySchema>;
export type GetAgencyByIdParams = z.infer<typeof getAgencybyIdParamSchema>;
