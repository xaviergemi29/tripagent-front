import { Calendar, Plus, CalendarX2, Share2 } from "lucide-react";
import { formatLocalDate } from "@/shared/utils/tour-date.util";
import { GuidedTourButton } from "@/features/onboarding/components/GuidedTourButton";
import { TOUR_TARGET } from "@/features/onboarding/constants/guided-tours";

interface MobileHeaderProps {
  tourTitle: string;
  departureDateTime: string;
  onOpenNewBookingModal?: () => void;
  /** Sin acción (tour finalizado o cancelado) no se ofrece cancelar el tour. */
  onCancelTour?: () => void;
  /** Abre "Compartir con staff"; sin acción (tour cerrado o sin permiso) no se ofrece. */
  onShareWithStaff?: () => void;
  /** Repite la guía interactiva del Centro de Control («Ver guía»). */
  onStartGuide?: () => void;
}

export function MobileHeader({
  tourTitle,
  departureDateTime,
  onOpenNewBookingModal,
  onCancelTour,
  onShareWithStaff,
  onStartGuide,
}: MobileHeaderProps) {
  const dateString = departureDateTime.split("T")[0];
  const formattedDate = formatLocalDate(dateString);

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            Centro de Control Logístico
          </span>
          {onStartGuide && (
            <GuidedTourButton onClick={onStartGuide} className="h-8 rounded-lg px-2.5 text-xs" />
          )}
        </div>
        <h1 className="text-2xl leading-tight font-black text-slate-900">{tourTitle}</h1>
        <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-600">
          <Calendar className="h-4 w-4 text-indigo-500" />
          <span>Salida: {formattedDate}</span>
        </div>
      </div>

      {onOpenNewBookingModal && (
        <button
          onClick={onOpenNewBookingModal}
          data-tour={TOUR_TARGET.DASHBOARD_NEW_BOOKING}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 font-semibold text-white shadow-sm shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Nueva Reserva
        </button>
      )}
      {onShareWithStaff && (
        <button
          onClick={onShareWithStaff}
          data-tour={TOUR_TARGET.DASHBOARD_STAFF_SHARE}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-95 sm:w-auto"
        >
          <Share2 className="h-4 w-4" />
          Compartir con staff
        </button>
      )}
      {onCancelTour && (
        <button
          onClick={onCancelTour}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 font-semibold text-red-600 transition-all hover:bg-red-50 active:scale-95 sm:w-auto"
        >
          <CalendarX2 className="h-4 w-4" />
          Cancelar tour
        </button>
      )}
    </div>
  );
}
