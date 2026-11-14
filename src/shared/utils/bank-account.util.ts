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
