import z from "zod";

export const subscriptionStatusSchema = z.enum(["trialing", "active", "past_due", "canceled"]);

const agencyFormFields = {
  name: z.string().trim().min(3, "La agencia debe tener al menos 3 caracteres"),
  phone: z
    .string()
    .trim()
    .regex(/^(\+)?\d{10}$/, "Debe ser un teléfono válido de al menos 10 dígitos"),
  bankName: z.string().trim().nullish(),
  email: z.email("Debe ser un correo electrónico válido").trim(),
  bankAccountHolder: z.string().optional().nullable(),
  clabeNumber: z
    .string()
    .trim()
    .regex(/^\d{18}$/, "La CLABE debe tener exactamente 18 dígitos")
    .nullish()
    .or(z.literal("")),
};

export const agencySchema = z.object({
  id: z.uuid(),
  isActive: z.boolean().default(true),
  slug: z.string(),
  logoUrl: z.url().nullable().or(z.string().nullable()),
  subscriptionStatus: subscriptionStatusSchema,
  trialEndsAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  ...agencyFormFields,
});

export const updateAgencyFormSchema = z.object(agencyFormFields).partial();

export type AgencyOutput = z.infer<typeof agencySchema>;
export type AgencyInput = z.infer<typeof updateAgencyFormSchema>;
