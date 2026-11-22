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
