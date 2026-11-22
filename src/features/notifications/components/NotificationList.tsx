import { BellOff } from "lucide-react";
import type { NotificationOutput } from "../schemas/notification.schema";
import { NotificationItem } from "./NotificationItem";
import { NotificationListSkeleton } from "./NotificationListSkeleton";

interface NotificationListProps {
  items: NotificationOutput[];
  onSelect: (notification: NotificationOutput) => void;
  isLoading?: boolean;
  isError?: boolean;
  getWhatsAppUrl?: (notification: NotificationOutput) => string | null;
  onWhatsAppOpen?: (notification: NotificationOutput) => void;
}

/** Lista de tarjetas con su estado vacío (compartida por el popover y el drawer). */
export function NotificationList({
  items,
  onSelect,
  isLoading,
  isError,
  getWhatsAppUrl,
  onWhatsAppOpen,
}: NotificationListProps) {
  if (isLoading) {
    return <NotificationListSkeleton />;
  }
  if (isError) {
    return (
      <p className="px-4 py-10 text-center text-xs text-slate-500">
        No pudimos cargar tus notificaciones. Volveremos a intentarlo en unos momentos.
      </p>
    );
  }
  if (items.length === 0) {
    return (
      <div className="px-4 py-10 text-center">
        <BellOff className="mx-auto mb-2 h-8 w-8 text-slate-300" aria-hidden="true" />
        <p className="text-sm font-semibold text-slate-700">Todo al día</p>
        <p className="mt-1 text-xs text-slate-400">
          Te avisaremos aquí cuando un viajero aparte lugares o complete su registro.
        </p>
      </div>
    );
  }
  return (
    <>
      {items.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onSelect={onSelect}
          whatsappUrl={getWhatsAppUrl?.(notification)}
          onWhatsAppOpen={onWhatsAppOpen}
        />
      ))}
    </>
  );
}
