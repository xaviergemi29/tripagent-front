import z from "zod";
import { POLICIES_MAX_LENGTH, SUBSCRIPTION_STATUSES } from "@/shared/constants/domain.constants";
import { phoneCountrySchema, refinePhone } from "@/shared/schemas/phone.schema";

export const subscriptionStatusSchema = z.enum(SUBSCRIPTION_STATUSES);
const emptyStringToUndefined = z.literal("").transform(() => undefined);
/** Quita espacios y guiones de una CLABE o tarjeta ("012 180-…" → "012180…"). */
const stripAccountSeparators = (value: string): string => value.replace(/[\s-]/g, "");

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
  bankName: z
    .string()
    .trim()
    .max(100, "Máximo 100 caracteres")
    .nullish()
    .or(emptyStringToUndefined),
  email: z.email("Debe ser un correo electrónico válido").trim().max(255, "Máximo 255 caracteres"),
  bankAccountHolder: z
    .string()
    .trim()
    .max(255, "Máximo 255 caracteres")
    .nullish()
    .or(emptyStringToUndefined),
  address: z.string().trim().nullish().or(emptyStringToUndefined),
  // `privacyNoticeUrl` ya no se captura en Configuración (petición del usuario, 2026-11-14): el
  // formulario no lo envía y la API conserva el valor guardado (sin enviar → no cambia).

  // Se aceptan espacios y guiones (así se copian de la app del banco) y se quitan ANTES de validar:
  // la API recibe solo dígitos. Antes se validaba primero y un "4123 4567 …" nunca se guardaba.
  clabeNumber: z
    .string("La CLABE es obligatoria")
    .transform(stripAccountSeparators)
    .pipe(
      z
        .string()
        .min(1, "La CLABE no puede estar vacía")
        .regex(/^\d{18}$/, "La CLABE debe contener exactamente 18 números"),
    ),

  // Opcional (decisión del PM): las agencias cobran sobre todo por SPEI/CLABE. Vacío → sin tarjeta.
  cardNumber: z
    .string()
    .transform(stripAccountSeparators)
    .pipe(z.string().regex(/^(\d{16})?$/, "La tarjeta debe contener exactamente 16 números"))
    .nullish(),
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
});

/** Formulario de "Políticas": texto libre; vacío → `null` (sin políticas). */
/**
 * Modal "Configurar cuenta ahora" del formulario de tours (OBS-038, 2026-11-17): solo banco, titular
 * y CLABE, con las mismas reglas que Configuración → Agencia. Cuerpo de `PATCH /agencies/bank-account`.
 */
export const bankAccountFormSchema = z.object({
  bankName: agencyFormFields.bankName,
  bankAccountHolder: agencyFormFields.bankAccountHolder,
  clabeNumber: agencyFormFields.clabeNumber,
});

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
export type BankAccountFormInput = z.input<typeof bankAccountFormSchema>;
/** Cuerpo de `PATCH /agencies/bank-account`. */
export type BankAccountInput = z.output<typeof bankAccountFormSchema>;
/** Respuesta de `PATCH /agencies/bank-account` (ya desenvuelta). */
export interface BankAccountOutput {
  bankName: string | null;
  bankAccountHolder: string | null;
  /** Siempre presente después de guardar (la API exige 18 dígitos). */
  clabeNumber: string;
}
