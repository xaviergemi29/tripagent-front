import { BOOKING_STATUS, NOTIFICATION_TYPE } from "@/shared/constants/domain.constants";
import {
  buildBookingWhatsAppUrl,
  type BookingWhatsAppBankDetails,
} from "@/shared/utils/booking-whatsapp.util";
import { buildMagicLinkUrl } from "@/shared/utils/share-links.util";
import type { NotificationFilter, NotificationOutput } from "../schemas/notification.schema";

/** Iniciales del viajero para el avatar: "Mariana Ruiz" → "MR"; "Ana" → "AN". */
export function getNotificationInitials(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return `${words[0]![0]}${words[1]![0]}`.toUpperCase();
}

/** Texto del contador de la campana: hasta 9, después "9+". */
export const formatUnreadBadge = (count: number): string => (count > 9 ? "9+" : String(count));

/** Aplica el filtro segmentado (Todas / Sin leer) sobre las últimas 20. */
export const filterNotifications = (
  items: NotificationOutput[],
  filter: NotificationFilter,
): NotificationOutput[] => (filter === "UNREAD" ? items.filter((item) => !item.isRead) : items);

/** Deep-link del Centro de Control al grupo de la notificación. */
export const buildNotificationHref = (notification: NotificationOutput): string =>
  `/tours/${notification.tourId}?bookingId=${notification.bookingId}`;

/**
 * @description Enlace `wa.me` para despachar el acceso y el cobro desde la campana. Solo para
 * pre-reservas cuya reserva sigue sin confirmar (`AWAITING_REGISTRATION` o `PENDING`, mismo criterio
 * que `canSendBookingWhatsApp` del Centro de Control) con Magic Link. Reutiliza el mensaje del
 * Sprint A; el anticipo es el `pendingDeposit` que ya calcula la API.
 * @returns La URL, o `null` si no aplica o el WhatsApp no es válido.
 */
export function buildNotificationWhatsAppUrl(
  notification: NotificationOutput,
  bankDetails?: BookingWhatsAppBankDetails,
): string | null {
  const { booking } = notification;
  if (notification.type !== NOTIFICATION_TYPE.PRE_BOOKING || !booking?.magicToken) return null;
  if (
    booking.status !== BOOKING_STATUS.AWAITING_REGISTRATION &&
    booking.status !== BOOKING_STATUS.PENDING
  ) {
    return null;
  }
  return buildBookingWhatsAppUrl({
    phone: booking.whatsappPhone,
    travelerName: notification.travelerName,
    tourName: notification.tourTitle,
    magicLinkUrl: buildMagicLinkUrl(booking.magicToken),
    requiredDeposit: booking.pendingDeposit,
    currency: booking.currency,
    bankDetails,
    isRegistered: booking.status === BOOKING_STATUS.PENDING,
  });
}
