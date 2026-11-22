import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { NOTIFICATION_TYPE } from "@/shared/constants/domain.constants";
import { formatRelativeTime } from "@/shared/utils/tour-date.util";
import type { NotificationOutput } from "../schemas/notification.schema";
import { getNotificationInitials } from "../utils/notification.util";

interface NotificationItemProps {
  notification: NotificationOutput;
  onSelect: (notification: NotificationOutput) => void;
}

const BADGE_BASE =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold";

/** Tarjeta de una notificación: toda la tarjeta es clicable y lleva al grupo en el Centro de Control. */
export function NotificationItem({ notification, onSelect }: NotificationItemProps) {
  const { type, travelerName, tourTitle, seatsCount, isRead, createdAt } = notification;
  const isPreBooking = type === NOTIFICATION_TYPE.PRE_BOOKING;

  const badgeClass = isPreBooking
    ? "border-amber-200/80 bg-amber-50 text-amber-800"
    : isRead
      ? "border-slate-200/60 bg-slate-100 text-slate-600"
      : "border-emerald-200/70 bg-emerald-50 text-emerald-800";

  return (
    <button
      type="button"
      onClick={() => onSelect(notification)}
      className={cn(
        "relative w-full cursor-pointer rounded-xl p-3.5 text-left transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none",
        isRead
          ? "border border-slate-100 bg-slate-50/60 opacity-90 hover:bg-slate-100/70"
          : "border border-slate-200/90 bg-white hover:border-indigo-200 hover:shadow-sm",
      )}
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
  );
}
