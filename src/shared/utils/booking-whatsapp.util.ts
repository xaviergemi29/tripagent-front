import type { Currency } from "@/shared/constants/domain.constants";
import { formatClabeForDisplay } from "./bank-account.util";
import { formatCurrency } from "./currency.util";
import { buildWhatsAppUrl } from "./share-links.util";
import { toInternationalDigits } from "./phone.util";

/** Datos de transferencia de la agencia que viajan en el mensaje (sin número de tarjeta, regla del PM). */
export interface BookingWhatsAppBankDetails {
  bankName?: string | null;
  bankAccountHolder?: string | null;
  clabeNumber?: string | null;
}

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
  bankDetails?: BookingWhatsAppBankDetails;
  /**
   * El grupo ya completó su registro en el Magic Link (reserva `PENDING`): el mensaje se enfoca en
   * el pago y el portal se ofrece como estado de cuenta. Por defecto, mensaje de registro.
   */
  isRegistered?: boolean;
}

const clean = (value?: string | null): string => (value ?? "").trim();

/**
 * @description Mensaje de WhatsApp del operador al titular: saludo, Magic Link, anticipo y, si hay
 * CLABE, datos de transferencia. Omite cualquier línea cuyo valor falte. Con `isRegistered`
 * (reserva `PENDING`) se enfoca en el pago en lugar del registro.
 */
export function buildBookingWhatsAppMessage({
  travelerName,
  tourName,
  magicLinkUrl,
  requiredDeposit,
  currency,
  bankDetails,
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

  const clabe = clean(bankDetails?.clabeNumber);
  if (clabe) {
    const bank = clean(bankDetails?.bankName);
    const holder = clean(bankDetails?.bankAccountHolder);
    lines.push("", "Datos para transferencia:");
    if (bank) lines.push(`Banco: ${bank}`);
    if (holder) lines.push(`Titular: ${holder}`);
    lines.push(`CLABE: ${formatClabeForDisplay(clabe)}`);
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
