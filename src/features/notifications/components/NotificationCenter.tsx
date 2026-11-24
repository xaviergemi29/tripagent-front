"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Popover } from "radix-ui";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../hooks/useNotifications";
import { useIsDesktop } from "../hooks/useIsDesktop";
import type { NotificationOutput } from "../schemas/notification.schema";
import { useAgency } from "@/features/settings/hooks/useAgency";
import { useSubscriptionAccess } from "@/features/settings/hooks/useSubscriptionAccess";
import { buildNotificationHref, buildNotificationWhatsAppUrl } from "../utils/notification.util";
import { TOUR_TARGET } from "@/features/onboarding/constants/guided-tours";
import { NotificationBell } from "./NotificationBell";
import { NotificationDrawer } from "./NotificationDrawer";
import { NotificationPopover } from "./NotificationPopover";

/**
 * Campana de notificaciones del panel (2026-11-22). Una sola campana en el `Header` global: en
 * escritorio abre un popover y en celular un bottom sheet. Clic en una notificación → la marca como
 * leída (optimista, para toda la agencia), cierra y abre `/tours/[tourId]?bookingId=[bookingId]`.
 */
export function NotificationCenter() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const [isOpen, setIsOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useNotifications();
  // Skeleton solo al abrir: el polling de fondo no lo activa (el panel abierto no parpadea).
  const [isRefreshingOnOpen, setIsRefreshingOnOpen] = useState(false);
  const { mutate: markAsRead } = useMarkNotificationRead();
  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllNotificationsRead();

  const { canWrite } = useSubscriptionAccess();
  // La consulta de la agencia ya está en caché por el panel; sin ella el mensaje sale sin bloque bancario.
  const { data: agency } = useAgency();
  const bankAccounts = agency?.bankAccounts;

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const handleOpenChange = (open: boolean): void => {
    setIsOpen(open);
    if (!open) return;
    // `refetch()` no lanza (throwOnError=false): si falla, se conservan los datos en caché.
    setIsRefreshingOnOpen(true);
    void refetch().finally(() => setIsRefreshingOnOpen(false));
  };

  const handleSelect = (notification: NotificationOutput): void => {
    if (!notification.isRead) markAsRead(notification.id);
    setIsOpen(false);
    router.push(buildNotificationHref(notification));
  };

  // Sin escritura (Modo Solo Lectura, regla 20) no se ofrece el despacho del acceso.
  const getWhatsAppUrl = (notification: NotificationOutput): string | null =>
    canWrite ? buildNotificationWhatsAppUrl(notification, bankAccounts) : null;

  // El panel se deja abierto: el enlace se abre en otra pestaña y desmontar el <a> durante el
  // clic puede cancelar la navegación; además permite despachar varios avisos seguidos.
  const handleWhatsAppOpen = (notification: NotificationOutput): void => {
    if (!notification.isRead) markAsRead(notification.id);
  };

  const panelProps = {
    items,
    unreadCount,
    isLoading: isLoading || isRefreshingOnOpen,
    isError: isError && !data,
    onSelect: handleSelect,
    getWhatsAppUrl,
    onWhatsAppOpen: handleWhatsAppOpen,
    onMarkAllRead: () => markAllAsRead(),
    isMarkingAll,
  };

  if (isDesktop) {
    return (
      <Popover.Root open={isOpen} onOpenChange={handleOpenChange}>
        <Popover.Trigger asChild>
          <NotificationBell
            unreadCount={unreadCount}
            isOpen={isOpen}
            data-tour={TOUR_TARGET.NOTIFICATIONS_BELL}
          />
        </Popover.Trigger>
        <NotificationPopover {...panelProps} />
      </Popover.Root>
    );
  }

  return (
    <>
      <NotificationBell
        unreadCount={unreadCount}
        isOpen={isOpen}
        onClick={() => handleOpenChange(true)}
        aria-haspopup="dialog"
        data-tour={TOUR_TARGET.NOTIFICATIONS_BELL}
      />
      <NotificationDrawer open={isOpen} onOpenChange={handleOpenChange} {...panelProps} />
    </>
  );
}
