export type SupportedCurrency = "MXN" | "USD";

interface FormatCurrencyOptions {
  /**
   * Código ISO de la divisa (MXN o USD). Por defecto: 'MXN'
   */
  currency?: SupportedCurrency;
  /**
   * Locale para el formato regional. Por defecto: 'es-MX'
   */
  locale?: string;
}

/**
 * Convierte un valor numérico o string cuantitativo a un formato de moneda localizado.
 *
 * @example
 * formatCurrency(2000) => "$2,000.00"
 * formatCurrency(1500.5, { currency: "USD" }) => "USD 1,500.50" (o $1,500.50 según locale)
 */
export function formatCurrency(
  value: number | string | null | undefined,
  options: FormatCurrencyOptions = {},
): string {
  const { currency = "MXN", locale = "es-MX" } = options;

  // 1. Manejo defensivo contra nulos o indefinidad
  if (value === null || value === undefined) {
    return "$0.00";
  }

  const numericValue = typeof value === "number" ? value : Number(value);

  if (isNaN(numericValue)) {
    return "$0.00";
  }

  // 2. Uso eficiente del motor nativo Intl.NumberFormat
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}
