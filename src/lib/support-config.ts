/**
 * Canales de soporte de TripAgent para las páginas públicas (/registro, /terminos, /privacidad,
 * /contacto). El WhatsApp sale de `NEXT_PUBLIC_SUPPORT_WHATSAPP` en E.164 ("+522281598139"); 10
 * dígitos sin "+" se toman como México, igual que `toInternationalDigits`. Sin la variable no se
 * dibujan los botones de WhatsApp (nunca un número falso).
 */
import { toInternationalDigits } from "@/shared/utils/phone.util";

export const SUPPORT_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.trim() ?? "";

/** Correo oficial de soporte y solicitudes legales (Términos y Condiciones). */
export const SUPPORT_EMAIL = "soporte@tripagent.mx";

/** `https://wa.me/<lada+número>?text=…` del soporte, o `null` si no hay número configurado. */
export const buildSupportWhatsAppUrl = (message: string): string | null => {
  const digits = toInternationalDigits(SUPPORT_WHATSAPP);
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : null;
};
