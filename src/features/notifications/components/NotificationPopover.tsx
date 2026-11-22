"use client";

import { useState } from "react";
import { Popover } from "radix-ui";
import type { NotificationFilter, NotificationOutput } from "../schemas/notification.schema";
import { filterNotifications } from "../utils/notification.util";
import { NotificationFilterTabs } from "./NotificationFilterTabs";
import { NotificationList } from "./NotificationList";
import { NotificationPanelHeader } from "./NotificationPanelHeader";

interface NotificationPopoverProps {
  items: NotificationOutput[];
  unreadCount: number;
  isLoading: boolean;
  isError: boolean;
  onSelect: (notification: NotificationOutput) => void;
  getWhatsAppUrl?: (notification: NotificationOutput) => string | null;
  onWhatsAppOpen?: (notification: NotificationOutput) => void;
  onMarkAllRead: () => void;
  isMarkingAll: boolean;
}

/**
 * Contenedor de escritorio (`Popover.Content` de Radix: cierra con clic fuera o Escape). Se monta
 * dentro de un `Popover.Root` que controla `NotificationCenter`.
 */
export function NotificationPopover({
  items,
  unreadCount,
  isLoading,
  isError,
  onSelect,
  getWhatsAppUrl,
  onWhatsAppOpen,
  onMarkAllRead,
  isMarkingAll,
}: NotificationPopoverProps) {
  const [filter, setFilter] = useState<NotificationFilter>("ALL");
  const filteredItems = filterNotifications(items, filter);

  return (
    <Popover.Portal>
      <Popover.Content
        align="end"
        sideOffset={12}
        aria-label="Notificaciones"
        className="animate-in fade-in-0 zoom-in-95 z-50 w-[390px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl duration-150"
      >
        <div className="px-4 pt-4">
          <NotificationPanelHeader
            title={<h2 className="text-sm font-bold text-slate-900">Notificaciones</h2>}
            unreadCount={unreadCount}
            onMarkAllRead={onMarkAllRead}
            isMarkingAll={isMarkingAll}
            markAllLabel="Marcar todas como leídas"
          />
        </div>
        <div className="mx-4 mt-3 mb-2">
          <NotificationFilterTabs
            value={filter}
            onChange={setFilter}
            totalCount={items.length}
            unreadCount={unreadCount}
          />
        </div>
        <div className="max-h-[400px] space-y-2.5 overflow-y-auto px-4 py-2 pb-4">
          <NotificationList
            items={filteredItems}
            onSelect={onSelect}
            getWhatsAppUrl={getWhatsAppUrl}
            onWhatsAppOpen={onWhatsAppOpen}
            isLoading={isLoading}
            isError={isError}
          />
        </div>
      </Popover.Content>
    </Popover.Portal>
  );
}
