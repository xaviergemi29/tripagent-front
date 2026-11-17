/**
 * Búsqueda de texto en los listados del panel (`/tours`, Viajeros y pasajeros del Centro de
 * Control). Única regla (2026-11-16; antes cada pantalla comparaba con `toLowerCase().includes` y
 * "zacatlan" no encontraba "Zacatlán" ni "228 123 4567" a un WhatsApp guardado como 2281234567).
 */

/** Minúsculas, sin acentos ni diéresis y sin espacios a los lados: "  José Ñúñez " → "jose nunez". */
export const normalizeSearchText = (value: string | null | undefined): string =>
  (value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** La búsqueda parece un teléfono: solo dígitos, espacios, guiones, paréntesis o "+". */
const PHONE_QUERY = /^[\d\s()+-]+$/;

/**
 * ¿La búsqueda coincide con alguno de los textos o teléfonos? Búsqueda vacía → siempre.
 * - Textos (nombre, correo, título): sin distinguir acentos ni mayúsculas.
 * - Teléfonos: si la búsqueda parece un teléfono, se comparan solo los dígitos.
 */
export function matchesSearch(
  query: string,
  {
    texts = [],
    phones = [],
  }: { texts?: (string | null | undefined)[]; phones?: (string | null | undefined)[] },
): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  if (texts.some((text) => normalizeSearchText(text).includes(normalizedQuery))) return true;

  const queryDigits = normalizedQuery.replace(/\D/g, "");
  if (!queryDigits || !PHONE_QUERY.test(normalizedQuery)) return false;
  return phones.some((phone) => (phone ?? "").replace(/\D/g, "").includes(queryDigits));
}
