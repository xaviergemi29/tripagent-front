/**
 * Tours en USD (RB-PAG-004): la agencia recibe o devuelve pesos y aplica un tipo de cambio; a la
 * reserva se acreditan (o descuentan) los dólares equivalentes.
 */

/** Decimales que admite el tipo de cambio (columna `exchange_rate`, escala 4). */
export const EXCHANGE_RATE_DECIMALS = 4;

/**
 * ¿El número tiene a lo más `decimals` decimales? Tolera el ruido de coma flotante
 * (19.354 × 10⁴ no es entero exacto en binario). Espejo de `hasAtMostDecimals` de la API.
 */
export const hasAtMostDecimals = (value: number, decimals: number): boolean => {
  const scaled = value * 10 ** decimals;
  return Math.abs(scaled - Math.round(scaled)) < 1e-6;
};

/** Dólares equivalentes a los pesos con el tipo de cambio, redondeados a centavos. */
export const convertMxnToUsd = (amountMxn: number, exchangeRate: number): number | null => {
  if (!(amountMxn > 0) || !(exchangeRate > 0)) return null;
  return Math.round((amountMxn / exchangeRate) * 100) / 100;
};

/** Tipo de cambio para mostrar: al menos 2 decimales y hasta 4 ("19.30", "19.354"). */
export const formatExchangeRate = (exchangeRate: number): string =>
  exchangeRate.toFixed(EXCHANGE_RATE_DECIMALS).replace(/0{1,2}$/, "");
