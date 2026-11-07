export type SupportedCurrency = "MXN" | "USD";

interface FormatCurrencyOptions {
  /**
   * Código ISO de la divisa. Soporta "MXN" o "USD".
   * @default "MXN"
   */
  currency?: SupportedCurrency;
  /**
   * Locale BCP 47 para el formato regional.
   * @default "es-MX"
   */
  locale?: string;
}

/**
 * @description Convierte un valor numérico o string cuantitativo a un formato de moneda localizado.
 * Utiliza la API nativa Intl.NumberFormat para evitar librerías pesadas como numeral.js.
 *
 * @param {number | string | null | undefined} value - El monto a formatear.
 * @param {FormatCurrencyOptions} [options] - Opciones de configuración de moneda y locale.
 * @returns {string} String formateado con símbolo de moneda y separadores de miles.
 *
 * @example
 * formatCurrency(2000) // "$2,000.00"
 * formatCurrency(1500.5, { currency: "USD" }) // "USD 1,500.50" (o $1,500.50 según locale)
 */
export function formatCurrency(
  value: number | string | null | undefined,
  options: FormatCurrencyOptions = {},
): string {
  const { currency = "MXN", locale = "es-MX" } = options;

  // 🛡️ Patrón de Programación Defensiva: Evitamos crashear la UI si el backend envía nulls
  if (value === null || value === undefined) {
    return "$0.00";
  }

  const numericValue = typeof value === "number" ? value : Number(value);

  if (isNaN(numericValue)) {
    return "$0.00";
  }

  // Uso eficiente del motor nativo Intl.NumberFormat (C-level performance en V8)
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}
