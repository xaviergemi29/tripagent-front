import { Calendar, Plus } from "lucide-react";
import { formatLocalDate } from "@/shared/utils/tour-date.util";

interface MobileHeaderProps {
  tourTitle: string;
  departureDateTime: string;
  onOpenNewBookingModal?: () => void;
}

export function MobileHeader({
  tourTitle,
  departureDateTime,
  onOpenNewBookingModal,
}: MobileHeaderProps) {
  const dateString = departureDateTime.split("T")[0];
  const formattedDate = formatLocalDate(dateString);

  return (
    <div className="space-y-3">
      <div>
        <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
          Centro de Control Logístico
        </span>
        <h1 className="text-2xl leading-tight font-black text-slate-900">{tourTitle}</h1>
        <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-600">
          <Calendar className="h-4 w-4 text-indigo-500" />
          <span>Salida: {formattedDate}</span>
        </div>
      </div>

      {onOpenNewBookingModal && (
        <button
          onClick={onOpenNewBookingModal}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 font-semibold text-white shadow-sm shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Nueva Reserva
        </button>
      )}
    </div>
  );
}
