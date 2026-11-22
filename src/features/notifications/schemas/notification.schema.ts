import { z } from "zod";
import { NOTIFICATION_TYPES } from "@/shared/constants/domain.constants";

/**
 * Notificación in-app de la agencia (`GET /notifications`, 2026-11-22). Espejo de la proyección de
 * `NotificationService.list` en `tripagent-api`. `isRead` es compartido por toda la agencia.
 */
export const notificationOutputSchema = z.object({
  id: z.uuid(),
  tourId: z.uuid(),
  bookingId: z.uuid(),
  type: z.enum(NOTIFICATION_TYPES),
  travelerName: z.string(),
  tourTitle: z.string(),
  seatsCount: z.number().int(),
  isRead: z.boolean(),
  createdAt: z.string(),
});

/** Respuesta ya desenvuelta por el interceptor: últimas 20 + total de no leídas. */
export const notificationsOutputSchema = z.object({
  items: z.array(notificationOutputSchema),
  unreadCount: z.number().int(),
});

export type NotificationOutput = z.infer<typeof notificationOutputSchema>;
export type NotificationsOutput = z.infer<typeof notificationsOutputSchema>;

/** Filtro segmentado del popover/drawer. */
export const NOTIFICATION_FILTERS = ["ALL", "UNREAD"] as const;
export type NotificationFilter = (typeof NOTIFICATION_FILTERS)[number];
