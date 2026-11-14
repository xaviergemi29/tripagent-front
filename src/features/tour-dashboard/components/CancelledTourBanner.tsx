import { CalendarX2 } from "lucide-react";
import type { TourCancellationOutput } from "../schemas/tour-dashboard.schema";
import { TOUR_CANCELLATION_REASON_DICT } from "@/shared/utils/config/status-dictionaries.config";
import { formatShortDateTime } from "@/shared/utils/tour-date.util";

interface CancelledTourBannerProps {
  cancellation: TourCancellationOutput;
}

/** Aviso del Centro de Control para un tour cancelado por la agencia: motivo, fecha y nota interna. */
export function CancelledTourBanner({ cancellation }: CancelledTourBannerProps) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
    >
      <CalendarX2 className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
      <div className="space-y-1">
        <p className="font-bold">
          Tour cancelado · {TOUR_CANCELLATION_REASON_DICT[cancellation.reason]}
        </p>
        <p className="text-xs text-red-800">
          Cancelado el {formatShortDateTime(cancellation.cancelledAt)}. Solo se pueden registrar
          reembolsos.
        </p>
        {cancellation.note && (
          <p className="text-xs text-red-800">
            <span className="font-semibold">Nota interna:</span> {cancellation.note}
          </p>
        )}
      </div>
    </div>
  );
}
