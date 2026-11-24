import { toPhoneDigits } from "@/shared/utils/share-links.util";

/**
 * @description Agrupa los dígitos de una cuenta para leerla con facilidad ("4152 3134 1234 5678").
 * Si la cantidad de dígitos no coincide con los grupos, devuelve el texto original recortado.
 */
const groupDigits = (value: string, groups: number[]): string => {
  const digits = toPhoneDigits(value);
  if (digits.length !== groups.reduce((a, b) => a + b, 0)) return value.trim();
  let start = 0;
  return groups
    .map((size) => {
      const part = digits.slice(start, start + size);
      start += size;
      return part;
    })
    .join(" ");
};

/** @description CLABE interbancaria (18 dígitos) agrupada 3-3-11-1. */
export const formatClabeForDisplay = (clabe: string): string => groupDigits(clabe, [3, 3, 11, 1]);

/** @description Número de tarjeta (16 dígitos) agrupado 4-4-4-4. */
export const formatCardNumberForDisplay = (cardNumber: string): string =>
  groupDigits(cardNumber, [4, 4, 4, 4]);

/** @description Últimos 4 dígitos de una tarjeta ("•••• 2345"), para listados del operador. */
export const maskCardNumber = (cardNumber: string): string =>
  `•••• ${toPhoneDigits(cardNumber).slice(-4)}`;

/**
 * @description Banco de una cuenta para mostrar. Las cuentas migradas pueden traerlo vacío: nunca
 * se dibuja un hueco.
 */
export const formatBankNameForDisplay = (bankName: string | null | undefined): string =>
  bankName?.trim() || "Banco sin capturar";

/** @description Titular de una cuenta para mostrar (vacío en cuentas migradas). */
export const formatAccountHolderForDisplay = (accountHolder: string | null | undefined): string =>
  accountHolder?.trim() || "Titular sin capturar";
