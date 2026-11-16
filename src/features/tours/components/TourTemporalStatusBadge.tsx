import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TOUR_TEMPORAL_STATUS, type TourTemporalStatus } from "@/shared/constants/domain.constants";

const STATUS_VIEW: Record<TourTemporalStatus, { label: string; className: string }> = {
  // Cancelado por la agencia (decisión del PM, 2026-11-14). "Pausado" ya no existe.
  [TOUR_TEMPORAL_STATUS.CANCELLED]: {
    label: "Cancelado",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  [TOUR_TEMPORAL_STATUS.IN_PROGRESS]: {
    label: "En Curso",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  [TOUR_TEMPORAL_STATUS.FINISHED]: {
    label: "Finalizado",
    className: "border-slate-200 bg-slate-100 text-slate-600",
  },
  [TOUR_TEMPORAL_STATUS.UPCOMING]: {
    label: "Próximo",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
};

/**
 * Estado temporal del tour (`temporalStatus` de la API, regla 9). Única insignia para la tabla de
 * escritorio y las tarjetas del celular; sin estado se muestra "Próximo", como antes.
 */
export function TourTemporalStatusBadge({
  status,
  className,
}: {
  status?: TourTemporalStatus | null;
  className?: string;
}) {
  const view = STATUS_VIEW[status ?? TOUR_TEMPORAL_STATUS.UPCOMING];
  return (
    <Badge variant="outline" className={cn(view.className, className)}>
      {view.label}
    </Badge>
  );
}
