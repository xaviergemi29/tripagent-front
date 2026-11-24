import { buildWhatsAppUrl, toPhoneDigits } from "@/shared/utils/share-links.util";
import { formatSpanishLongDate } from "@/shared/utils/tour-date.util";
import type { PublicTourOutput } from "../public-tour.schema";

/**
 * Estado de reserva del folleto, con la misma prioridad que la etiqueta del botón: el tour ya salió
 * ("Finalizado") > la agencia está en Modo Solo Lectura ("Reservas en pausa") > sin lugares
 * ("Agotado") > disponible.
 */
export type BrochureBookingState = "AVAILABLE" | "SOLD_OUT" | "FINISHED" | "PAUSED";

/** Deriva el estado de `availability` de la API (no recalcula cupos). */
export function getBrochureBookingState(
  availability: Pick<
    PublicTourOutput["availability"],
    "isBookable" | "hasDeparted" | "acceptsOnlineBookings"
  >,
): BrochureBookingState {
  if (availability.hasDeparted) return "FINISHED";
  if (availability.acceptsOnlineBookings === false) return "PAUSED";
  if (!availability.isBookable) return "SOLD_OUT";
  return "AVAILABLE";
}

/** Texto del botón "Iniciar Reserva" cuando no se puede reservar. */
export const BROCHURE_UNAVAILABLE_LABEL: Record<
  Exclude<BrochureBookingState, "AVAILABLE">,
  string
> = {
  FINISHED: "Finalizado",
  PAUSED: "Reservas en pausa",
  SOLD_OUT: "Agotado",
};

interface BrochureWhatsAppMessageParams {
  tourTitle: string;
  /** Fecha de salida `YYYY-MM-DD`. */
  departureDate: string;
  state: BrochureBookingState;
}

/**
 * @description Mensaje de WhatsApp del viajero a la agencia desde el folleto, según el estado del
 * tour: reservar (disponible), lista de espera (agotado), próximas salidas (ya salió) o pedir
 * información para reservar (reservas en línea en pausa).
 * @example
 * buildBrochureWhatsAppMessage({ tourTitle: "Zacatlán", departureDate: "2026-12-12", state: "SOLD_OUT" })
 * // "¡Hola! Me interesa el tour *Zacatlán* (sábado, 12 de diciembre), pero vi que ya no hay lugares. ¿Podrían avisarme si se libera algún lugar?"
 */
export function buildBrochureWhatsAppMessage({
  tourTitle,
  departureDate,
  state,
}: BrochureWhatsAppMessageParams): string {
  // A mitad de la oración va en minúsculas ("sábado, 12 de diciembre").
  const date = formatSpanishLongDate(departureDate).toLowerCase();
  const tour = `*${tourTitle.trim()}*${date ? ` (${date})` : ""}`;
  switch (state) {
    case "SOLD_OUT":
      return `¡Hola! Me interesa el tour ${tour}, pero vi que ya no hay lugares. ¿Podrían avisarme si se libera algún lugar?`;
    case "FINISHED":
      return `¡Hola! Vi el folleto del tour ${tour}, pero esa salida ya pasó. ¿Tienen próximas salidas de este tour?`;
    case "PAUSED":
      // Sin mencionar la pausa: es un estado interno de la agencia (suscripción) y el mismo texto
      // sirve cuando el modal recibe BOOKINGS_CLOSED.
      return `¡Hola! Me interesa el tour ${tour}. ¿Me pueden dar información para reservar?`;
    case "AVAILABLE":
      return `¡Hola! Vi el folleto del tour ${tour} y me interesa reservar. ¿Me pueden ayudar?`;
  }
}

/**
 * @description Enlace `wa.me` a la agencia con el mensaje del estado (`buildWhatsAppUrl`: lada del
 * número E.164 guardado).
 * @returns `null` si la agencia no tiene teléfono (no se dibuja el botón).
 */
export function buildBrochureWhatsAppUrl({
  agencyPhone,
  ...message
}: BrochureWhatsAppMessageParams & { agencyPhone: string | null | undefined }): string | null {
  if (!toPhoneDigits(agencyPhone)) return null;
  return buildWhatsAppUrl(agencyPhone, { message: buildBrochureWhatsAppMessage(message) });
}
