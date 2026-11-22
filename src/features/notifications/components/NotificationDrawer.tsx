"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import type { NotificationFilter, NotificationOutput } from "../schemas/notification.schema";
import { filterNotifications } from "../utils/notification.util";
import { NotificationFilterTabs } from "./NotificationFilterTabs";
import { NotificationList } from "./NotificationList";
import { NotificationPanelHeader } from "./NotificationPanelHeader";

interface NotificationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: NotificationOutput[];
  unreadCount: number;
  isLoading: boolean;
  isError: boolean;
  onSelect: (notification: NotificationOutput) => void;
  onMarkAllRead: () => void;
  isMarkingAll: boolean;
}

/**
 * Contenedor móvil: bottom sheet sobre `Dialog` de Radix (cierra con el fondo, ✕ o Escape; atrapa
 * el foco y no deja que el scroll pase a la página).
 */
export function NotificationDrawer({
  open,
  onOpenChange,
  items,
  unreadCount,
  isLoading,
  isError,
  onSelect,
  onMarkAllRead,
  isMarkingAll,
}: NotificationDrawerProps) {
  const [filter, setFilter] = useState<NotificationFilter>("ALL");
  const filteredItems = filterNotifications(items, filter);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="animate-in fade-in-0 fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="animate-in slide-in-from-bottom fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl duration-300"
        >
          <div className="mx-auto mt-2.5 mb-1 h-1.5 w-12 rounded-full bg-slate-300" />
          <div className="space-y-3 px-4 pt-2 pb-2">
            <NotificationPanelHeader
              title={
                <Dialog.Title className="text-base font-bold text-slate-900">
                  Notificaciones
                </Dialog.Title>
              }
              unreadCount={unreadCount}
              onMarkAllRead={onMarkAllRead}
              isMarkingAll={isMarkingAll}
              markAllLabel="Marcar todas"
              closeButton={
                <Dialog.Close
                  aria-label="Cerrar"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Dialog.Close>
              }
            />
            <NotificationFilterTabs
              value={filter}
              onChange={setFilter}
              totalCount={items.length}
              unreadCount={unreadCount}
              touch
            />
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-4 pb-8">
            <NotificationList
              items={filteredItems}
              onSelect={onSelect}
              isLoading={isLoading}
              isError={isError}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
