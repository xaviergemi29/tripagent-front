import { z } from "zod";
import { getCountryCallingCode } from "libphonenumber-js";
import {
  getCountryName,
  isPhoneCountry,
  toE164,
  type PhoneCountry,
} from "@/shared/utils/phone.util";

/**
 * Validación de teléfonos internacionales en formularios (2026-11-16), espejo de
 * `tripagent-api/src/shared/schemas/phone.schema.ts`.
 *
 * Cada formulario guarda dos campos: el número tal como se escribe (`whatsapp`, nacional) y su país
 * (`whatsappCountry`). La validación se hace en el `superRefine` del objeto con `refinePhone`, y el
 * envío a la API convierte con `toE164` (número + país, siempre en E.164).
 */

/** País del teléfono elegido en `PhoneField`. */
export const phoneCountrySchema = z.custom<PhoneCountry>(
  isPhoneCountry,
  "Selecciona el país del teléfono",
);

/** "Número incompleto o inválido para México (+52)". */
export const invalidPhoneMessage = (country: PhoneCountry): string =>
  `Número incompleto o inválido para ${getCountryName(country)} (+${getCountryCallingCode(country)})`;

/**
 * Valida un par número + país dentro de un `superRefine`.
 * - Vacío: error solo si `requiredMessage` existe (campo obligatorio).
 * - Con valor: debe ser un número válido de ese país.
 */
export function refinePhone(
  ctx: z.RefinementCtx,
  value: string | null | undefined,
  country: PhoneCountry,
  path: (string | number)[],
  requiredMessage?: string,
): void {
  if (!(value ?? "").trim()) {
    if (requiredMessage) ctx.addIssue({ code: "custom", path, message: requiredMessage });
    return;
  }
  if (!toE164(value, country)) {
    ctx.addIssue({ code: "custom", path, message: invalidPhoneMessage(country) });
  }
}
