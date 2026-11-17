import { API_BASE_URL } from "@/lib/api-config";

/**
 * @description Deja únicamente los dígitos de un teléfono (quita espacios, guiones, "+", paréntesis).
 * @param {string | null | undefined} phone - Teléfono en cualquier formato.
 * @returns {string} Solo dígitos, o string vacío si la entrada es nula.
 * @example
 * toPhoneDigits("+52 (228) 123-4567") // "522281234567"
 */
export const toPhoneDigits = (phone?: string | null): string => (phone || "").replace(/\D/g, "");

/** Lada de México: se antepone a los teléfonos de 10 dígitos en los enlaces `wa.me`. */
const MEXICO_COUNTRY_CODE = "52";

interface WhatsAppUrlOptions {
  /** Texto prellenado del chat. Se codifica con `encodeURIComponent`. */
  message?: string;
  /**
   * Prefijo de país que se antepone a los dígitos. Si se omite, se agrega "52" a un número de 10
   * dígitos (México); uno más largo se considera ya internacional y se deja igual.
   */
  countryCode?: string;
}

/**
 * @description Teléfono para mostrar, sin prefijo de país: los últimos 10 dígitos agrupados
 * 3-3-4. Si no hay 10 dígitos, devuelve el valor tal cual.
 * @example formatPhoneForDisplay("+522288492011") // "228 849 2011"
 */
export const formatPhoneForDisplay = (phone?: string | null): string => {
  const digits = toPhoneDigits(phone);
  if (digits.length < 10) return (phone || "").trim();
  const local = digits.slice(-10);
  return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
};

/**
 * @description Construye un enlace `wa.me` para abrir un chat de WhatsApp.
 * No hay integración con la API de WhatsApp; solo enlaces.
 *
 * @param {string | null | undefined} phone - Teléfono del destinatario (se limpia a dígitos).
 * @param {WhatsAppUrlOptions} [options] - Mensaje prellenado y prefijo de país opcionales.
 * @returns {string} URL `https://wa.me/...`.
 * Los teléfonos se capturan a 10 dígitos y `wa.me` exige la lada del país: sin ella,
 * `wa.me/2281234567` se lee como +228 (Togo). Por eso un número de 10 dígitos lleva "52" por
 * defecto (2026-11-16; antes cada pantalla debía pasarlo y cuatro botones no lo hacían).
 * @example
 * buildWhatsAppUrl("228 123 4567", { message: "Hola" }) // "https://wa.me/522281234567?text=Hola"
 * buildWhatsAppUrl("522281234567") // "https://wa.me/522281234567"
 */
export const buildWhatsAppUrl = (
  phone: string | null | undefined,
  { message, countryCode }: WhatsAppUrlOptions = {},
): string => {
  const digits = toPhoneDigits(phone);
  const prefix = countryCode ?? (digits.length === 10 ? MEXICO_COUNTRY_CODE : "");
  const base = `https://wa.me/${prefix}${digits}`;
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
