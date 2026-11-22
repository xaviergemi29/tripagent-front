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

/**
 * Responsable del tratamiento de los datos de las cuentas de agencia (aviso de privacidad de
 * TripAgent, LFPDPPP art. 15 fr. I; PM, 2026-11-22). Pendiente: la razón social o el nombre legal
 * del titular (sección G de ../CLAUDE.md).
 */
export const TRIPAGENT_LEGAL_NAME = "TripAgent MX";
export const TRIPAGENT_ADDRESS = "Xalapa, Veracruz, México";
