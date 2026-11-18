import type { ReactNode, MouseEvent } from "react";
import { ArrowLeftRight, Lock, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SeatWithoutDepositBadge } from "@/features/tour-dashboard/components/passengers/SeatWithoutDepositBadge";
import type { FormStatus } from "@/features/tour-dashboard/schemas/tour-dashboard.schema";
import type { BookingPaymentStatus } from "@/shared/constants/domain.constants";
import { copyToClipboard } from "@/shared/utils/clipboard";
import {
  FORM_STATUS_DICT,
  PAYMENT_STATUS_DICT,
} from "@/shared/utils/config/status-dictionaries.config";
import { buildMagicLinkUrl } from "@/shared/utils/share-links.util";
import { resolveGroupPaymentStatus } from "@/features/tour-dashboard/utils/dashboard-travelers.util";
import { FORM_STATUS } from "@/shared/constants/domain.constants";

/**
 * Piezas comunes de las filas de la tabla de pasajeros (`TravelerGroup`): la celda de asiento,
 * las insignias de estado, el botón con tooltip y "copiar Magic Link". Las usan la fila del
 * titular, la de cada acompañante y la de cada lugar pendiente.
 */

/** Copia el Magic Link del grupo (registro y estado de cuenta) sin propagar el clic a la fila. */
export async function copyMagicLink(event: MouseEvent, token?: string | null): Promise<void> {
  event.stopPropagation();
  if (!token) return;
  const success = await copyToClipboard(buildMagicLinkUrl(token));
  if (success) toast.success("Enlace copiado");
  else toast.error("Error al copiar");
}

/** Estado financiero del grupo (los valores los calcula la API; aquí solo se elige la etiqueta). */
export function FinancialStatusBadge({
  status,
  paidAmount,
  balance,
}: {
  status: BookingPaymentStatus;
  paidAmount: number;
  balance: number;
}) {
  // Misma regla que el filtro de pagos del Centro de Control.
  const resolved = resolveGroupPaymentStatus({ paymentStatus: status, paidAmount, balance });
  const config = PAYMENT_STATUS_DICT[resolved === "UNPAID" ? "PENDING" : resolved];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide whitespace-nowrap uppercase ${config.style}`}
    >
      {config.label}
    </span>
  );
}

/** Estado del formulario del Magic Link (completo / pendiente). */
export function RegistrationStatusBadge({ status }: { status: FormStatus | string }) {
  const safeStatus = (status as FormStatus) || "PENDING";
  const config = FORM_STATUS_DICT[safeStatus] || FORM_STATUS_DICT.PENDING;
  const isCompleted = safeStatus === FORM_STATUS.COMPLETED;

  return (
    <span className={`flex items-center gap-1.5 text-xs font-medium ${config.style}`}>
      <span
        className={`h-2 w-2 rounded-full ${isCompleted ? "bg-emerald-500" : "animate-pulse bg-red-500"}`}
      />
      {config.label}
    </span>
  );
}

interface SeatCellProps {
  /** Derecho a asiento del grupo (`titular.hasSeatRight`, regla 8; lo calcula la API). */
  hasSeatRight: boolean;
  seatLabel?: string | null;
  isAuditMode?: boolean;
  onAssign: () => void;
  /** Sombra sutil en "Requiere anticipo" (solo la fila del titular). */
  elevated?: boolean;
}

/**
 * Contenido de la celda de asiento, igual para titular, acompañantes y lugares pendientes:
 * - con derecho: el asiento, "Sin asiento" (Modo Auditoría) o "[ Asignar Asiento ]";
 * - sin derecho pero con asiento: se conserva y se señala (decisión del PM, regla 8);
 * - sin derecho ni asiento: "Requiere anticipo".
 */
export function SeatCell({
  hasSeatRight,
  seatLabel,
  isAuditMode,
  onAssign,
  elevated,
}: SeatCellProps) {
  if (hasSeatRight) {
    if (seatLabel) {
      return (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-xs font-bold text-indigo-700">
          {seatLabel}
        </span>
      );
    }
    if (isAuditMode) {
      return <span className="text-xs font-medium text-slate-400">Sin asiento</span>;
    }
    return (
      <Badge
        variant="outline"
        className="cursor-pointer border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-50"
        onClick={(event) => {
          event.stopPropagation();
          onAssign();
        }}
      >
        [ Asignar Asiento ]
      </Badge>
    );
  }

  if (seatLabel) return <SeatWithoutDepositBadge seatLabel={seatLabel} />;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800${elevated ? "shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]" : ""}`}
    >
      <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600" />
      <span>Requiere anticipo</span>
    </span>
  );
}

/**
 * Colores de los botones de acciones de la fila (escritorio y celular). Cada acción tiene su tono
 * en reposo (borde, fondo, ícono y sombra) y uno más intenso al pasar el cursor:
 * - receipt (Comprobante PDF): azul cielo, un documento.
 * - magicLink (Copiar Magic Link): índigo, el color de la marca para compartir.
 * - payments (Registrar abonos): esmeralda, dinero.
 * - remove (Dar de baja): rojo suave; es destructiva, así que en reposo no compite con las demás.
 */
export const ROW_ACTION_TONE = {
  receipt:
    "border-sky-200 bg-sky-50/60 text-sky-700 shadow-xs shadow-sky-100 hover:border-sky-300 hover:bg-sky-100 hover:text-sky-800",
  magicLink:
    "border-indigo-200 bg-indigo-50/60 text-indigo-600 shadow-xs shadow-indigo-100 hover:border-indigo-300 hover:bg-indigo-100 hover:text-indigo-700",
  payments:
    "border-emerald-200 bg-emerald-50/60 text-emerald-700 shadow-xs shadow-emerald-100 hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800",
  remove:
    "border-red-100 bg-white text-red-400 shadow-xs shadow-red-50 hover:border-red-200 hover:bg-red-50 hover:text-red-600",
} as const;

/** Botón de icono con tooltip de las columnas de acciones (requiere un `TooltipProvider` arriba). */
export function RowActionButton({
  tooltip,
  ariaLabel,
  title,
  guideTarget,
  className,
  onClick,
  children,
}: {
  tooltip: string;
  ariaLabel?: string;
  title?: string;
  /** Marca para la guía interactiva (`data-tour`, ver `features/onboarding`). */
  guideTarget?: string;
  className: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
          onClick={onClick}
          aria-label={ariaLabel}
          title={title}
          data-tour={guideTarget}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white"
      >
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

/** Menú ⋮ con la única acción "Transferir…" (titular o acompañante). */
export function TransferMenu({
  label,
  triggerAriaLabel,
  guideTarget,
  onSelect,
}: {
  label: string;
  triggerAriaLabel?: string;
  /** Marca para la guía interactiva (`data-tour`, ver `features/onboarding`). */
  guideTarget?: string;
  onSelect: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          aria-label={triggerAriaLabel}
          data-tour={guideTarget}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
      >
        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-indigo-50/70 hover:text-indigo-600"
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
        >
          <ArrowLeftRight className="h-4 w-4 text-indigo-600" />
          <span>{label}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
