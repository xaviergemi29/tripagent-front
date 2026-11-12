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
  /** Prefijo de país que se antepone a los dígitos (ej. "52"). Por defecto no se agrega. */
  countryCode?: string;
}

/**
 * @description Construye un enlace `wa.me` para abrir un chat de WhatsApp.
 * No hay integración con la API de WhatsApp; solo enlaces.
 *
 * @param {string | null | undefined} phone - Teléfono del destinatario (se limpia a dígitos).
 * @param {WhatsAppUrlOptions} [options] - Mensaje prellenado y prefijo de país opcionales.
 * @returns {string} URL `https://wa.me/...`.
 * @example
 * buildWhatsAppUrl("228 123 4567", { countryCode: "52", message: "Hola" })
 * // "https://wa.me/522281234567?text=Hola"
 */
export const buildWhatsAppUrl = (
  phone: string | null | undefined,
  { message, countryCode = "" }: WhatsAppUrlOptions = {},
): string => {
  const base = `https://wa.me/${countryCode}${toPhoneDigits(phone)}`;
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
