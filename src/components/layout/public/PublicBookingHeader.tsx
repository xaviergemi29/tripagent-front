import { CalendarDays } from "lucide-react";
import { AgencyLogo } from "@/components/shared/AgencyLogo";
import { cn } from "@/lib/utils";
import { formatSpanishLongDate } from "@/shared/utils/tour-date.util";

export type PublicBookingStatusVariant = "neutral" | "warning" | "success" | "brand";

export interface PublicBookingHeaderProps {
  agencyName: string;
  /** Ruta del logotipo en la API (`meta.agency.logoPath`); sin logo se muestra la brújula. */
  agencyLogoPath?: string | null;
  statusBadgeText: string;
  statusVariant?: PublicBookingStatusVariant;
  tourTitle: string;
  /** Fecha de salida `YYYY-MM-DD`. */
  departureDate?: string | null;
}

const BADGE_STYLES: Record<PublicBookingStatusVariant, { pill: string; dot: string }> = {
  brand: { pill: "border-indigo-200/60 bg-indigo-50 text-indigo-700", dot: "bg-indigo-600" },
  neutral: { pill: "border-slate-200 bg-slate-100 text-slate-700", dot: "bg-slate-500" },
  warning: {
    pill: "border-amber-200/80 bg-amber-50 text-amber-800",
    dot: "animate-pulse bg-amber-500",
  },
  success: { pill: "border-emerald-200/80 bg-emerald-50 text-emerald-800", dot: "bg-emerald-500" },
};

/**
 * Encabezado común de las vistas del Magic Link: marca de la agencia, estado de la reserva,
 * nombre del tour y fecha de salida. Sin hooks ni callbacks: se usa también desde Server
 * Components (`PaidBookingView`).
 */
export function PublicBookingHeader({
  agencyName,
  agencyLogoPath,
  statusBadgeText,
  statusVariant = "brand",
  tourTitle,
  departureDate,
}: PublicBookingHeaderProps) {
  const styles = BADGE_STYLES[statusVariant];
  const formattedDate = formatSpanishLongDate(departureDate);

  return (
    <header className="flex w-full flex-col items-center px-1 pt-6 pb-4 text-center">
      {/* 1. Identidad de la agencia */}
      <div className="mb-3 flex items-center gap-2">
        <AgencyLogo
          logoPath={agencyLogoPath}
          agencyName={agencyName}
          className="h-9 w-9 rounded-xl"
          fallbackClassName="bg-indigo-50 text-indigo-600"
          iconClassName="h-4 w-4"
        />
        <span className="text-sm font-semibold tracking-tight text-slate-800">{agencyName}</span>
      </div>

      {/* 2. Estado de la reserva */}
      <div
        className={cn(
          "mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase shadow-xs",
          styles.pill,
        )}
      >
        <span className={cn("h-2 w-2 shrink-0 rounded-full", styles.dot)} aria-hidden />
        <span>{statusBadgeText}</span>
      </div>

      {/* 3. Nombre del tour */}
      <h1 className="mx-auto max-w-md text-2xl leading-tight font-extrabold tracking-tight break-words text-slate-900 sm:text-3xl">
        {tourTitle}
      </h1>

      {/* 4. Fecha de salida */}
      {formattedDate && (
        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-slate-200/60 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 sm:text-sm">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-indigo-600" aria-hidden />
          <span>Salida: {formattedDate}</span>
        </div>
      )}
    </header>
  );
}
