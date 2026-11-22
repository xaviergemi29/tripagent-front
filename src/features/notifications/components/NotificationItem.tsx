import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { NOTIFICATION_TYPE } from "@/shared/constants/domain.constants";
import { ROW_ACTION_TONE } from "@/features/tour-dashboard/components/passengers/traveler-row-cells";
import { formatRelativeTime } from "@/shared/utils/tour-date.util";
import type { NotificationOutput } from "../schemas/notification.schema";
import { getNotificationInitials } from "../utils/notification.util";

interface NotificationItemProps {
  notification: NotificationOutput;
  onSelect: (notification: NotificationOutput) => void;
  /** Enlace `wa.me` ya armado; sin él no se dibuja el botón de WhatsApp. */
  whatsappUrl?: string | null;
  /** Se llama al abrir WhatsApp (marca la notificación como leída). */
  onWhatsAppOpen?: (notification: NotificationOutput) => void;
}

const BADGE_BASE =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold";

/** Tarjeta de una notificación: el área principal es un botón y lleva al grupo en el Centro de Control. */
export function NotificationItem({
  notification,
  onSelect,
  whatsappUrl,
  onWhatsAppOpen,
}: NotificationItemProps) {
  const { type, travelerName, tourTitle, seatsCount, isRead, createdAt } = notification;
  const isPreBooking = type === NOTIFICATION_TYPE.PRE_BOOKING;

  const badgeClass = isPreBooking
    ? "border-amber-200/80 bg-amber-50 text-amber-800"
    : isRead
      ? "border-slate-200/60 bg-slate-100 text-slate-600"
      : "border-emerald-200/70 bg-emerald-50 text-emerald-800";

  return (
    <div
      className={cn(
        "relative w-full rounded-xl transition-all focus-within:ring-2 focus-within:ring-indigo-500",
        isRead
          ? "border border-slate-100 bg-slate-50/60 opacity-90 hover:bg-slate-100/70"
          : "border border-slate-200/90 bg-white hover:border-indigo-200 hover:shadow-sm",
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(notification)}
        className="relative block w-full cursor-pointer rounded-xl p-3.5 text-left focus-visible:outline-none"
      >
        {!isRead && (
          <span
            className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-indigo-600"
            aria-label="Sin leer"
          />
        )}
        <div className="flex items-start gap-3">
          <div
            aria-hidden="true"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700"
          >
            {getNotificationInitials(travelerName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="pr-4 text-sm font-bold text-slate-900">{travelerName}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
              {isPreBooking
                ? `Apartó ${seatsCount} ${seatsCount === 1 ? "lugar" : "lugares"} en `
                : `Completó el registro de su booking (${seatsCount} ${seatsCount === 1 ? "viajero" : "viajeros"}) en `}
              <span className="font-semibold text-indigo-600">{tourTitle}</span>.
            </p>
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <span className={cn(BADGE_BASE, badgeClass)}>
                • {isPreBooking ? "Pre-reserva · Enviar Magic Link" : "Booking completado"}
              </span>
              <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-slate-400">
                <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                {formatRelativeTime(createdAt)}
              </span>
            </div>
          </div>
        </div>
      </button>
      {whatsappUrl && (
        // Hermano del botón principal (un <a> dentro de un <button> es HTML inválido).
        <div className="px-3.5 pb-3.5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => {
              event.stopPropagation();
              onWhatsAppOpen?.(notification);
            }}
            className={cn(
              "flex h-10 w-full items-center justify-center gap-2 rounded-lg border text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none",
              ROW_ACTION_TONE.whatsapp,
            )}
          >
            <WhatsAppIcon className="h-4 w-4" />
            Enviar acceso por WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
