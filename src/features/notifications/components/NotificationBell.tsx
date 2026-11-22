import type { ComponentProps } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatUnreadBadge } from "../utils/notification.util";

interface NotificationBellProps extends ComponentProps<"button"> {
  unreadCount: number;
  isOpen: boolean;
}

/**
 * Botón de la campana con su contador. Acepta las props de un `<button>` (y su `ref`) para usarse
 * como `Popover.Trigger asChild`. En celular mide 40 px con un área táctil de 44 px.
 */
export function NotificationBell({
  unreadCount,
  isOpen,
  className,
  ...props
}: NotificationBellProps) {
  const label =
    unreadCount > 0
      ? `Notificaciones: ${unreadCount} sin leer`
      : "Notificaciones: no tienes avisos nuevos";

  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-xl border transition-colors after:absolute after:-inset-0.5 after:content-[''] md:h-9 md:w-9 md:after:inset-0",
        isOpen
          ? "border-indigo-200/70 bg-indigo-50 text-indigo-600"
          : "border-transparent bg-slate-100/80 text-slate-600 hover:bg-slate-200/80",
        className,
      )}
      {...props}
    >
      <Bell className="h-5 w-5" aria-hidden="true" />
      {unreadCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-indigo-600 px-1.5 py-0.5 text-[10px] leading-none font-bold text-white shadow-sm"
        >
          {formatUnreadBadge(unreadCount)}
        </span>
      )}
    </button>
  );
}
