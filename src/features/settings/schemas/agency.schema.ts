import z from "zod";
import { POLICIES_MAX_LENGTH } from "@/shared/constants/domain.constants";

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

  // Opcional (decisión del PM): las agencias cobran sobre todo por SPEI/CLABE. Vacío → sin tarjeta.
  cardNumber: z
    .string()
    .trim()
    .regex(/^\d{16}$/, "La tarjeta debe contener exactamente 16 números sin espacios")
    .nullish()
    .or(z.literal("")),
};

export const agencyOutputSchema = z.object({
  id: z.uuid(),
  isActive: z.boolean().default(true),
  /** Ruta del logotipo subido (`/uploads/logos/…`); se edita en "Identidad Visual & PDFs". */
  logoPath: z.string().nullable(),
  /** Políticas generales de la agencia (estado de cuenta PDF). Se editan en la pestaña Políticas. */
  policies: z.string().nullable().optional(),
  subscriptionStatus: subscriptionStatusSchema,
  trialEndsAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  ...agencyFormFields,
});

/** Formulario de "Políticas": texto libre; vacío → `null` (sin políticas). */
export const agencyPoliciesFormSchema = z.object({
  policies: z
    .string()
    .max(POLICIES_MAX_LENGTH, `Máximo ${POLICIES_MAX_LENGTH} caracteres`)
    .transform((value) => value.trim() || null),
});

export const updateAgencyFormSchema = z.object(agencyFormFields);

export type AgencyOutput = z.infer<typeof agencyOutputSchema>;
export type AgencyPoliciesFormInput = z.input<typeof agencyPoliciesFormSchema>;
/** Cuerpo de `PATCH /agencies/policies`. */
export type AgencyPoliciesInput = z.output<typeof agencyPoliciesFormSchema>;
export type AgencyInput = z.infer<typeof updateAgencyFormSchema>;
