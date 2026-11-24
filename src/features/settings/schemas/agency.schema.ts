import z from "zod";
import { POLICIES_MAX_LENGTH, SUBSCRIPTION_STATUSES } from "@/shared/constants/domain.constants";
import { phoneCountrySchema, refinePhone } from "@/shared/schemas/phone.schema";
import { bankAccountOutputSchema } from "./bank-account.schema";

export const subscriptionStatusSchema = z.enum(SUBSCRIPTION_STATUSES);
const emptyStringToUndefined = z.literal("").transform(() => undefined);

const agencyFormFields = {
  // Límites de longitud: mismos que `baseAgencySchema` de la API (antes solo los validaba la API).
  name: z
    .string()
    .trim()
    .min(3, "La agencia debe tener al menos 3 caracteres")
    .max(255, "Máximo 255 caracteres"),
  // WhatsApp oficial: en el formulario, número nacional + país (PhoneField; se envía en E.164).
  // En la respuesta, el E.164 guardado (o los 10 dígitos de un registro anterior).
  phone: z.string().trim(),
  email: z.email("Debe ser un correo electrónico válido").trim().max(255, "Máximo 255 caracteres"),
  address: z.string().trim().nullish().or(emptyStringToUndefined),
  // `privacyNoticeUrl` ya no se captura en Configuración (petición del usuario, 2026-11-14): el
  // formulario no lo envía y la API conserva el valor guardado (sin enviar → no cambia).
  // Las cuentas bancarias tienen su propia sección y endpoints (`/agencies/bank-accounts`).
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
  /** País del teléfono (ISO alfa-2); `null` = lada inferida, sin confirmar. */
  phoneCountry: z.string().nullable().optional(),
  /** Cuentas para transferencias, por `position`. "Tiene cuenta" = `bankAccounts.length > 0`. */
  bankAccounts: z.array(bankAccountOutputSchema),
});

/** Formulario de "Políticas": texto libre; vacío → `null` (sin políticas). */
export const agencyPoliciesFormSchema = z.object({
  policies: z
    .string()
    .max(POLICIES_MAX_LENGTH, `Máximo ${POLICIES_MAX_LENGTH} caracteres`)
    .transform((value) => value.trim() || null),
});

export const updateAgencyFormSchema = z
  .object({ ...agencyFormFields, phoneCountry: phoneCountrySchema })
  .superRefine((data, ctx) =>
    refinePhone(
      ctx,
      data.phone,
      data.phoneCountry,
      ["phone"],
      "El WhatsApp oficial es obligatorio",
    ),
  );

export type AgencyOutput = z.infer<typeof agencyOutputSchema>;
export type AgencyPoliciesFormInput = z.input<typeof agencyPoliciesFormSchema>;
/** Cuerpo de `PATCH /agencies/policies`. */
export type AgencyPoliciesInput = z.output<typeof agencyPoliciesFormSchema>;
export type AgencyInput = z.infer<typeof updateAgencyFormSchema>;
