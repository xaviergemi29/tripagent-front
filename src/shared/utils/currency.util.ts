import { type Currency, DEFAULT_CURRENCY } from "@/shared/constants/domain.constants";

interface FormatCurrencyOptions {
  /**
   * Código ISO de la divisa del importe ("MXN" o "USD"). Pásalo siempre que se conozca
   * (moneda del tour, del pago o de la reserva): el importe NO se convierte, solo se etiqueta.
   * @default DEFAULT_CURRENCY ("MXN")
   */
  currency?: Currency;
}

/**
 * Formateador numérico compartido: dos decimales fijos, comas para miles y punto decimal.
 * Se usa `en-US` (no `es-MX`) porque garantiza el separador de miles también en cifras de
 * 4 dígitos ("1,000.00") en cualquier motor; el símbolo y el código se agregan a mano.
 */
const AMOUNT_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * @description Única función de formateo de importes de TripAgent (pantallas, modales, drawers,
 * KPIs, textos para compartir y comprobantes PDF). Formato estándar:
 * `"$1,000.00 MXN"` / `"$1,000.00 USD"`: símbolo `$` al inicio, comas de miles, dos decimales
 * y el código de la divisa al final.
 *
 * - Negativos: el signo va antes del símbolo (`"-$500.00 USD"`). Los importes que se redondean
 *   a cero se muestran sin signo (`-0.001` → `"$0.00 MXN"`).
 * - `null`, `undefined`, cadenas vacías o valores no numéricos se muestran como `"$0.00 <divisa>"`
 *   para no romper la UI si la API omite un campo.
 * - Acepta cadenas numéricas (`"1500.5"`), como las que devuelven los inputs.
 * - Solo presenta el valor: no redondea ni modifica el importe almacenado o calculado.
 *   Un signo `+` decorativo (abonos) se antepone fuera: `` `+${formatCurrency(x, { currency })}` ``.
 *
 * @param {number | string | null | undefined} value - Importe a formatear.
 * @param {FormatCurrencyOptions} [options] - Divisa del importe.
 * @returns {string} Importe con símbolo, separadores, dos decimales y código de divisa.
 *
 * @example
 * formatCurrency(1000, { currency: "USD" })  // "$1,000.00 USD"
 * formatCurrency(1500.5, { currency: "MXN" }) // "$1,500.50 MXN"
 * formatCurrency(0)                           // "$0.00 MXN"
 * formatCurrency(-500, { currency: "USD" })  // "-$500.00 USD"
 * formatCurrency(null, { currency: "USD" })  // "$0.00 USD"
 */
export function formatCurrency(
  value: number | string | null | undefined,
  options: FormatCurrencyOptions = {},
): string {
  const { currency = DEFAULT_CURRENCY } = options;

  // 🛡️ Programación defensiva: null/undefined/"" → 0 y NaN/Infinity → 0.
  const numericValue = typeof value === "number" ? value : Number(value ?? 0);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;

  const absolute = AMOUNT_FORMATTER.format(Math.abs(safeValue));
  const sign = safeValue < 0 && absolute !== "0.00" ? "-" : "";

  return `${sign}$${absolute} ${currency}`;
}
