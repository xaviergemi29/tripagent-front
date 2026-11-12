import z from "zod";

export const subscriptionStatusSchema = z.enum(["trialing", "active", "past_due", "canceled"]);
const emptyStringToUndefined = z.literal("").transform(() => undefined);

const agencyFormFields = {
  name: z.string().trim().min(3, "La agencia debe tener al menos 3 caracteres"),
  phone: z
    .string()
    .trim()
    .regex(/^(\+)?\d{10,}$/, "El teléfono debe contener solo números (mínimo 10 dígitos)"),
  bankName: z.string().trim().nullish().or(emptyStringToUndefined),
  email: z.email("Debe ser un correo electrónico válido").trim(),
  bankAccountHolder: z.string().trim().nullish().or(emptyStringToUndefined),
  address: z.string().trim().nullish().or(emptyStringToUndefined),
  clabeNumber: z
    .string("La CLABE es obligatoria")
    .trim()
    .min(1, "La CLABE no puede estar vacía")
    .regex(/^\d{18}$/, "La CLABE debe contener exactamente 18 números sin espacios"),

  cardNumber: z
    .string("El número de tarjeta es obligatorio")
    .trim()
    .min(1, "El número de tarjeta no puede estar vacío")
    .regex(/^\d{16}$/, "La tarjeta debe contener exactamente 16 números sin espacios"),
};

export const agencyOutputSchema = z.object({
  id: z.uuid(),
  isActive: z.boolean().default(true),
  logoUrl: z.url().nullable().or(z.string().nullable()),
  subscriptionStatus: subscriptionStatusSchema,
  trialEndsAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  ...agencyFormFields,
});

export const updateAgencyFormSchema = z.object(agencyFormFields);

export type AgencyOutput = z.infer<typeof agencyOutputSchema>;
export type AgencyInput = z.infer<typeof updateAgencyFormSchema>;
