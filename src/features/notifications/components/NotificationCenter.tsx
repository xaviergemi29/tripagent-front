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
import { buildNotificationHref } from "../utils/notification.util";
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
  const { data, isLoading, isError } = useNotifications();
  const { mutate: markAsRead } = useMarkNotificationRead();
  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllNotificationsRead();

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const handleSelect = (notification: NotificationOutput): void => {
    if (!notification.isRead) markAsRead(notification.id);
    setIsOpen(false);
    router.push(buildNotificationHref(notification));
  };

  const panelProps = {
    items,
    unreadCount,
    isLoading,
    isError: isError && !data,
    onSelect: handleSelect,
    onMarkAllRead: () => markAllAsRead(),
    isMarkingAll,
  };

  if (isDesktop) {
    return (
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger asChild>
          <NotificationBell unreadCount={unreadCount} isOpen={isOpen} />
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
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
      />
      <NotificationDrawer open={isOpen} onOpenChange={setIsOpen} {...panelProps} />
    </>
  );
}
