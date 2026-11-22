import { CheckCheck } from "lucide-react";

interface NotificationPanelHeaderProps {
  unreadCount: number;
  onMarkAllRead: () => void;
  isMarkingAll: boolean;
  /** Texto del botón: completo en escritorio, corto en celular. */
  markAllLabel: string;
  /** Título accesible del contenedor (Dialog/Popover). */
  title: React.ReactNode;
  /** Botón de cerrar del drawer (celular). */
  closeButton?: React.ReactNode;
}

/** Título, píldora "N nuevas" y "Marcar todas como leídas" (solo con pendientes). */
export function NotificationPanelHeader({
  unreadCount,
  onMarkAllRead,
  isMarkingAll,
  markAllLabel,
  title,
  closeButton,
}: NotificationPanelHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        {title}
        {unreadCount > 0 && (
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-indigo-700">
            • {unreadCount} {unreadCount === 1 ? "nueva" : "nuevas"}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            disabled={isMarkingAll}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline disabled:opacity-60"
          >
            <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {markAllLabel}
          </button>
        )}
        {closeButton}
      </div>
    </div>
  );
}
