import type { Currency } from "@/shared/constants/domain.constants";
import { formatClabeForDisplay } from "./bank-account.util";
import { formatCurrency } from "./currency.util";
import { buildWhatsAppUrl } from "./share-links.util";
import { toInternationalDigits } from "./phone.util";

/**
 * Cuentas de transferencia de la agencia que viajan en el mensaje, en orden (`bankAccounts` de
 * `GET /agencies`). Sin número de tarjeta (regla del PM): se ignora aunque venga.
 */
export type BookingWhatsAppBankAccounts = readonly {
  bankName: string;
  accountHolder: string;
  clabeNumber: string;
}[];

export interface BookingWhatsAppParams {
  /** WhatsApp del titular tal como está guardado (E.164 o los 10 dígitos de un registro anterior). */
  phone: string | null | undefined;
  travelerName: string;
  tourName: string;
  /** Magic Link ya construido (la util es pura: no toca `window`). */
  magicLinkUrl: string;
  /** Anticipo por cubrir; con 0 o un valor no positivo se omite la línea. */
  requiredDeposit: number;
  currency: Currency;
  bankAccounts?: BookingWhatsAppBankAccounts;
  /**
   * El grupo ya completó su registro en el Magic Link (reserva `PENDING`): el mensaje se enfoca en
   * el pago y el portal se ofrece como estado de cuenta. Por defecto, mensaje de registro.
   */
  isRegistered?: boolean;
}

const clean = (value?: string | null): string => (value ?? "").trim();

/**
 * @description Mensaje de WhatsApp del operador al titular: saludo, Magic Link, anticipo y, si la
 * agencia tiene cuentas, los datos de transferencia de todas (numeradas si hay más de una). Omite cualquier línea cuyo valor falte. Con `isRegistered`
 * (reserva `PENDING`) se enfoca en el pago en lugar del registro.
 */
export function buildBookingWhatsAppMessage({
  travelerName,
  tourName,
  magicLinkUrl,
  requiredDeposit,
  currency,
  bankAccounts = [],
  isRegistered = false,
}: Omit<BookingWhatsAppParams, "phone">): string {
  const hasDeposit = Number.isFinite(requiredDeposit) && requiredDeposit > 0;
  const deposit = hasDeposit ? formatCurrency(requiredDeposit, { currency }) : "";
  const lines: string[] = isRegistered
    ? [
        `¡Hola ${clean(travelerName)}! Gracias por completar tu registro para el tour "${clean(tourName)}".`,
        "",
        hasDeposit
          ? `Para confirmar tus lugares solo falta tu anticipo de ${deposit}.`
          : "Para confirmar tus lugares solo falta tu pago.",
        "",
        "En tu portal puedes consultar tu estado de cuenta y las opciones de pago:",
        magicLinkUrl,
      ]
    : [
        `¡Hola ${clean(travelerName)}! Ya apartamos tus lugares para el tour "${clean(tourName)}".`,
        "",
        "Entra a tu portal para registrar los datos de tus acompañantes y elegir tu punto de abordaje:",
        magicLinkUrl,
        ...(hasDeposit ? ["", `Para asegurar tus lugares, el anticipo es de ${deposit}.`] : []),
      ];

  const accounts = bankAccounts.filter((account) => clean(account.clabeNumber));
  if (accounts.length > 0) {
    lines.push(
      "",
      accounts.length > 1
        ? "Puedes transferir a cualquiera de estas cuentas:"
        : "Datos para transferencia:",
    );
    accounts.forEach((account, index) => {
      const bank = clean(account.bankName);
      const holder = clean(account.accountHolder);
      if (accounts.length > 1) lines.push(...(index > 0 ? [""] : []), `Cuenta ${index + 1}:`);
      if (bank) lines.push(`Banco: ${bank}`);
      if (holder) lines.push(`Titular: ${holder}`);
      lines.push(`CLABE: ${formatClabeForDisplay(account.clabeNumber)}`);
    });
  }

  if (isRegistered)
    lines.push("", "Si ya realizaste tu pago, envíanos tu comprobante por este medio.");
  lines.push("", "Cualquier duda, aquí estamos. ¡Gracias!");
  return lines.join("\n");
}

/**
 * @description Enlace `wa.me` con el mensaje de despacho de acceso y cobro. Reutiliza
 * `buildWhatsAppUrl` (regla 21: E.164 tal cual, 10 dígitos anteriores → México).
 * @returns La URL, o `null` si el teléfono no es válido (para deshabilitar el botón).
 * @example
 * buildBookingWhatsAppUrl({ phone: "+522281234567", ... }) // "https://wa.me/522281234567?text=..."
 */
export function buildBookingWhatsAppUrl({
  phone,
  ...message
}: BookingWhatsAppParams): string | null {
  // "Sin teléfono" (texto de la API) no tiene dígitos; uno demasiado corto tampoco es un WhatsApp.
  if (toInternationalDigits(phone).length < 8) return null;
  return buildWhatsAppUrl(phone, { message: buildBookingWhatsAppMessage(message) });
}
