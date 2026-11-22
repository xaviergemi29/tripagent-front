import { API_BASE_URL } from "@/lib/api-config";
import { toInternationalDigits } from "./phone.util";

/**
 * @description Deja únicamente los dígitos de un teléfono (quita espacios, guiones, "+", paréntesis).
 * @param {string | null | undefined} phone - Teléfono en cualquier formato.
 * @returns {string} Solo dígitos, o string vacío si la entrada es nula.
 * @example
 * toPhoneDigits("+52 (228) 123-4567") // "522281234567"
 */
export const toPhoneDigits = (phone?: string | null): string => (phone || "").replace(/\D/g, "");

interface WhatsAppUrlOptions {
  /** Texto prellenado del chat. Se codifica con `encodeURIComponent`. */
  message?: string;
  /**
   * Prefijo de país que se antepone a los dígitos. Si se omite, se usa el número tal como viene:
   * un E.164 ya trae su lada y un registro anterior de 10 dígitos se toma como mexicano (+52).
   */
  countryCode?: string;
}

/**
 * Teléfono para mostrar: México en formato nacional ("228 849 2011"), otros países en formato
 * internacional ("+1 212 555 1234"). Implementación en `phone.util.ts`.
 * @example formatPhoneForDisplay("+522288492011") // "228 849 2011"
 */
export { formatPhoneForDisplay } from "./phone.util";

/**
 * @description Construye un enlace `wa.me` para abrir un chat de WhatsApp.
 * No hay integración con la API de WhatsApp; solo enlaces.
 *
 * @param {string | null | undefined} phone - Teléfono del destinatario: E.164 ("+522281234567") o
 * los 10 dígitos de un registro anterior.
 * @param {WhatsAppUrlOptions} [options] - Mensaje prellenado y prefijo de país opcionales.
 * @returns {string} URL `https://wa.me/...`.
 * `wa.me` exige la lada. Desde el 2026-11-16 los teléfonos se guardan en E.164 con su país, así que
 * la lada sale del propio número: antes se anteponía "52" a todo número de 10 dígitos y un número de
 * EE. UU. o Canadá (también de 10 dígitos) abría el chat de otro número en México. Solo un registro
 * anterior (10 dígitos sin "+") se sigue tomando como mexicano.
 * @example
 * buildWhatsAppUrl("+12125551234", { message: "Hola" }) // "https://wa.me/12125551234?text=Hola"
 * buildWhatsAppUrl("2281234567") // "https://wa.me/522281234567" (registro anterior)
 */
export const buildWhatsAppUrl = (
  phone: string | null | undefined,
  { message, countryCode }: WhatsAppUrlOptions = {},
): string => {
  const number = countryCode
    ? `${countryCode}${toPhoneDigits(phone)}`
    : toInternationalDigits(phone);
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
};

/**
 * @description URL pública del magic link con el que el cliente registra a su grupo.
 * Solo se puede usar en el cliente (depende de `window.location.origin`).
 * @param {string} token - Token del magic link.
 * @returns {string} URL absoluta `/register?token=...`.
 */
export const buildMagicLinkUrl = (token: string): string =>
  `${window.location.origin}/register?token=${token}`;

/**
 * @description URL pública del folleto digital del tour.
 * Solo se puede usar en el cliente (depende de `window.location.origin`).
 * @param {string | undefined} tourId - Id del tour.
 * @returns {string} URL absoluta `/p/<tourId>`.
 */
export const buildBrochureUrl = (tourId: string | undefined): string =>
  `${window.location.origin}/p/${tourId}`;

/**
 * @description URL pública (solo lectura, sin cuenta) del croquis y la lista de pasajeros para el
 * coordinador del tour. Solo se puede usar en el cliente (depende de `window.location.origin`).
 * @param {string} token - Token del enlace para staff.
 * @returns {string} URL absoluta `/s/<token>`.
 */
export const buildStaffShareUrl = (token: string): string => `${window.location.origin}/s/${token}`;

/**
 * @description URL pública de un archivo servido por la API (p. ej. el folleto PDF).
 * La API guarda rutas como `/uploads/brochures/x.pdf` y las sirve en `<origen API>/public/...`,
 * **fuera** del prefijo `/api` que trae `NEXT_PUBLIC_API_URL`.
 *
 * @param {string} storedPath - Ruta guardada por la API (empieza con `/uploads/...`).
 * @returns {string} URL absoluta del archivo.
 * @example
 * // NEXT_PUBLIC_API_URL = "http://localhost:3001/api"
 * buildApiPublicFileUrl("/uploads/brochures/tour-1.pdf")
 * // "http://localhost:3001/public/uploads/brochures/tour-1.pdf"
 */
export const buildApiPublicFileUrl = (storedPath: string): string => {
  const apiBase = API_BASE_URL;
  const normalizedPath = storedPath.startsWith("/") ? storedPath : `/${storedPath}`;
  return new URL(`/public${normalizedPath}`, apiBase).toString();
};
