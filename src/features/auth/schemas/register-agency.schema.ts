import { z } from "zod";
import { phoneCountrySchema, refinePhone } from "@/shared/schemas/phone.schema";

/**
 * Formulario de /registro (alta de agencia, 2026-11-22). Replica `registerAgencyBodySchema` de la
 * API (`tripagent-api/src/modules/auth/auth.schema.ts`). El WhatsApp es internacional (regla 21):
 * número nacional + país en `PhoneField`; se envía en E.164 con `toE164`.
 */
export const registerAgencyFormSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, "Ingresa tu nombre completo")
      .max(80, "Nombre demasiado largo"),
    agencyName: z
      .string()
      .trim()
      .min(2, "Ingresa el nombre comercial de tu agencia")
      .max(100, "Nombre de agencia demasiado largo"),
    whatsapp: z.string().trim(),
    whatsappCountry: phoneCountrySchema,
    email: z.string().trim().toLowerCase().pipe(z.email("Ingresa un correo electrónico válido")),
    password: z
      .string()
      .min(8, "La contraseña debe tener mínimo 8 caracteres")
      .max(72, "La contraseña es demasiado larga"),
    plan: z.string().default("todo-incluido"),
  })
  .superRefine((data, ctx) =>
    refinePhone(
      ctx,
      data.whatsapp,
      data.whatsappCountry,
      ["whatsapp"],
      "Ingresa tu número de WhatsApp",
    ),
  );

export type RegisterAgencyFormInput = z.input<typeof registerAgencyFormSchema>;

/** Cuerpo de `POST /auth/register-agency`: `whatsapp` ya en E.164. */
export type RegisterAgencyInput = z.output<typeof registerAgencyFormSchema>;
