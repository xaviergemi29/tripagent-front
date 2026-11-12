import { JSX, useState } from "react";
import { FormStatus, TitularRowOutput, TravelerRole } from "../schemas/tour-dashboard.schema";
import {
  ChevronDown,
  User,
  Users,
  Wallet,
  Link2,
  UserMinus,
  UserPlus,
  Trash2,
  MoreVertical,
  Lock,
  FileDown,
  CornerDownRight,
  ArrowLeftRight,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  FORM_STATUS_DICT,
  PAYMENT_STATUS_DICT,
} from "@/shared/utils/config/status-dictionaries.config";
import { formatCurrency } from "@/shared/utils/currency.util";
import { copyToClipboard } from "@/shared/utils/clipboard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { type Currency, DEFAULT_CURRENCY } from "@/shared/constants/domain.constants";
import { buildMagicLinkUrl } from "@/shared/utils/share-links.util";

interface TravelerGroupProps {
  titular: TitularRowOutput;
  isAuditMode?: boolean;
  tourCurrency?: Currency;
  isAdding?: boolean;
  isRemovingGhost?: boolean;
  freeSeatsCount?: number;
  requiresSeats?: boolean;
  onRowClick: (id: string) => void;
  onAssignSeatClick: (passengerId: string) => void;
  onAddPassengerClick: (titular: TitularRowOutput) => void;
  onRemovePassengerClick: (bookingId: string, passengerId: string, name: string) => void;
  onRemoveGhostSlotClick: (bookingId: string) => void;
  onTransferPassengerClick?: (
    bookingId: string,
    passengerId: string,
    role: TravelerRole,
    currentName: string,
    whatsapp: string,
  ) => void;
  onDownloadReceiptClick?: (titular: TitularRowOutput) => void;
}

const getFinancialBadge = (status: string, paidAmount: number, balance: number): JSX.Element => {
  let resolvedKey = "PENDING";

  if (status === "PAID" || (paidAmount > 0 && balance <= 0)) {
    resolvedKey = "PAID";
  } else if (paidAmount > 0 || ["ADVANCE", "PARTIAL", "PENDING_VALIDATION"].includes(status)) {
    resolvedKey = "PARTIAL";
  }

  const config = PAYMENT_STATUS_DICT[resolvedKey] || PAYMENT_STATUS_DICT.PENDING;

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase ${config.style}`}
    >
      {config.label}
    </span>
  );
};

const getRegistrationBadge = (status: FormStatus | string): JSX.Element => {
  const safeStatus = (status as FormStatus) || "PENDING";
  const config = FORM_STATUS_DICT[safeStatus] || FORM_STATUS_DICT.PENDING;
  const isCompleted = safeStatus === "COMPLETED";

  return (
    <span className={`flex items-center gap-1.5 text-xs font-medium ${config.style}`}>
      <span
        className={`h-2 w-2 rounded-full ${isCompleted ? "bg-emerald-500" : "animate-pulse bg-red-500"}`}
      />
      {config.label}
    </span>
  );
};

export function TravelerGroup({
  titular,
  isAuditMode,
  tourCurrency,
  isAdding,
  isRemovingGhost,
  freeSeatsCount,
  requiresSeats,
  onRemoveGhostSlotClick,
  onRowClick,
  onAssignSeatClick,
  onAddPassengerClick,
  onRemovePassengerClick,
  onTransferPassengerClick,
  onDownloadReceiptClick,
}: TravelerGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const registeredCount = 1 + (titular.companions?.length || 0);
  const missingCount = Math.max(0, titular.groupSize - registeredCount);
  const isGroupIncomplete = missingCount > 0;
  const hasPaid = titular.paidAmount > 0 || titular.paymentStatus !== "PENDING";
  const isGroup = titular.groupSize > 1;

  const handleCopyLink = async (e: React.MouseEvent, token?: string): Promise<void> => {
    e.stopPropagation();
    if (!token) return;
    const success = await copyToClipboard(buildMagicLinkUrl(token));
    if (success) toast.success("Enlace copiado");
    else toast.error("Error al copiar");
  };

  return (
    <>
      <tr
        className="cursor-pointer transition-colors hover:bg-slate-50/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <td
          className="px-4 py-3.5"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isGroup && (
            <button className="rounded p-0.5 text-slate-400 transition hover:text-slate-700">
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  isExpanded ? "rotate-0" : "-rotate-90"
                }`}
              />
            </button>
          )}
        </td>
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            {isGroup ? (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-indigo-100/70 bg-indigo-50 text-indigo-600">
                <Users className="h-4 w-4" />
              </div>
            ) : (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-100/70 bg-slate-50 text-slate-400">
                <User className="h-4 w-4" />
              </div>
            )}

            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-1.5 font-medium text-slate-900">
                <span>{titular.fullName}</span>
                {isGroup && <span className="text-xs font-normal text-slate-400">Titular</span>}
              </div>
              {isGroup && (
                <span className="mt-0.5 text-[11px] text-slate-500">
                  Grupo: {titular.groupSize} viajeros ({registeredCount} registrados)
                </span>
              )}
            </div>
          </div>
        </td>
        {requiresSeats && (
          <td className="px-6 py-3.5">
            {titular.hasSeatRight ? (
              titular.seatLabel ? (
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-xs font-bold text-indigo-700">
                  {titular.seatLabel}
                </span>
              ) : (
                <Badge
                  variant="outline"
                  className="cursor-pointer border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssignSeatClick(titular.id);
                  }}
                >
                  [ Asignar Asiento ]
                </Badge>
              )
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
                <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span>Requiere anticipo</span>
              </span>
            )}
          </td>
        )}
        <td className="px-6 py-3.5">
          {titular.boardingPoint ? (
            <span className="text-xs font-medium text-slate-700">{titular.boardingPoint}</span>
          ) : (
            <span className="text-xs font-medium text-slate-400">Por definir</span>
          )}
        </td>
        <td className="px-6 py-3.5 font-mono text-xs text-slate-600">{titular.whatsapp}</td>
        <td className="px-6 py-3.5">{getRegistrationBadge(titular.formStatus)}</td>
        <td className="px-6 py-3.5">
          <div className="flex flex-col items-start gap-1">
            {getFinancialBadge(titular.paymentStatus, titular.paidAmount, titular.balance)}
            {titular.balance > 0 ? (
              <span className="text-[11px] font-bold text-slate-500">
                Debe:{" "}
                {formatCurrency(titular.balance, { currency: tourCurrency || DEFAULT_CURRENCY })}
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-400">Sin adeudos</span>
            )}
          </div>
        </td>
        <td className="px-6 py-3.5 text-right whitespace-nowrap">
          <TooltipProvider delayDuration={150}>
            <div className="flex items-center justify-end gap-1.5">
              {hasPaid && onDownloadReceiptClick && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg border border-slate-200/80 text-slate-600 shadow-xs transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownloadReceiptClick(titular);
                      }}
                      aria-label="Descargar Comprobante PDF"
                    >
                      <FileDown className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white"
                  >
                    Descargar Comprobante PDF
                  </TooltipContent>
                </Tooltip>
              )}
              {/* MAGICAL LINK PERMANENTE (Registro y Estado de Cuenta) */}
              {titular.magicToken && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg border border-transparent text-slate-500 transition-colors hover:border-indigo-100 hover:bg-indigo-50 hover:text-indigo-600"
                      onClick={(e) => handleCopyLink(e, titular?.magicToken || "")}
                      aria-label="Copiar Magic Link"
                    >
                      <Link2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white"
                  >
                    Copiar Magic Link del viajero
                  </TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg border border-slate-200/80 text-slate-600 shadow-xs transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRowClick(titular.id);
                    }}
                    aria-label="Registrar abonos y pagos"
                  >
                    <Wallet className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white"
                >
                  Registrar abonos y pagos
                </TooltipContent>
              </Tooltip>

              {!isAuditMode && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
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
                      onClick={(e) => {
                        e.stopPropagation();
                        onTransferPassengerClick?.(
                          titular.bookingId,
                          titular.id,
                          "TITULAR",
                          titular.fullName,
                          titular.whatsapp,
                        );
                      }}
                    >
                      <ArrowLeftRight className="h-4 w-4 text-indigo-600" />
                      <span>Transferir titularidad</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </TooltipProvider>
        </td>
      </tr>

      {/* 2. FILAS SUBORDINADAS DE ACOMPAÑANTES */}
      {isExpanded &&
        titular.companions?.map((companion) => (
          <tr
            key={companion.id}
            className="cursor-pointer border-b border-slate-100/80 bg-slate-50/40 text-sm transition-colors hover:bg-slate-100/80"
            onClick={() => onRowClick(companion.id)}
          >
            <td className="px-4 py-3"></td>
            <td className="px-4 py-3 pl-9">
              <div className="flex items-start gap-2.5">
                <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                <div>
                  <span className="text-sm font-medium text-slate-800">{companion.fullName}</span>
                  <p className="mt-0.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                    Acompañante de {titular.fullName.split(" ")[0]}
                  </p>
                </div>
              </div>
            </td>
            {requiresSeats && (
              <td className="px-6 py-3">
                {titular.hasSeatRight ? (
                  companion.seatLabel ? (
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-xs font-bold text-indigo-700">
                      {companion.seatLabel}
                    </span>
                  ) : (
                    <Badge
                      variant="outline"
                      className="cursor-pointer border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAssignSeatClick(companion.id);
                      }}
                    >
                      [ Asignar Asiento ]
                    </Badge>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                    <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <span>Requiere anticipo</span>
                  </span>
                )}
              </td>
            )}
            <td className="px-6 py-3 text-xs text-slate-400">{companion.boardingPoint || "—"}</td>
            <td className="px-6 py-3 font-mono text-xs text-slate-500">
              {companion.whatsapp || "—"}
            </td>
            <td className="px-6 py-3">{getRegistrationBadge(companion.formStatus)}</td>
            <td className="px-6 py-3 text-xs text-slate-400 italic">Cubierto por titular</td>
            <td className="px-6 py-3 text-right whitespace-nowrap">
              <TooltipProvider delayDuration={150}>
                <div className="flex items-center justify-end gap-1.5">
                  {!isAuditMode && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-lg border border-slate-200/80 text-slate-400 shadow-xs transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemovePassengerClick(
                              companion.bookingId,
                              companion.id,
                              companion.fullName,
                            );
                          }}
                          title="Dar de baja pasajero"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white"
                      >
                        Dar de baja pasajero
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {!isAuditMode && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          aria-label="Más acciones del acompañante"
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
                          onClick={(e) => {
                            e.stopPropagation();
                            onTransferPassengerClick?.(
                              companion.bookingId,
                              companion.id,
                              "COMPANION",
                              companion.fullName,
                              companion.whatsapp,
                            );
                          }}
                        >
                          <ArrowLeftRight className="h-4 w-4 text-indigo-600" />
                          <span>Transferir lugar</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </TooltipProvider>
            </td>
          </tr>
        ))}

      {/* 3. PLACEHOLDERS (ASIENTOS PENDIENTES) */}
      {isExpanded &&
        isGroupIncomplete &&
        Array.from({ length: missingCount }).map((_, index) => (
          <tr
            key={`ghost-${titular.id}-${index}`}
            className="border-b border-slate-100/80 bg-slate-50/40 text-sm opacity-90"
          >
            <td className="px-4 py-3"></td>
            <td className="px-4 py-3 pl-9">
              <div className="flex items-start gap-2.5">
                <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                <div>
                  <span className="text-sm font-normal text-slate-500 italic">
                    Acompañante pendiente de registro
                  </span>
                  <p className="mt-0.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                    Lugar reservado #{registeredCount + index + 1}
                  </p>
                </div>
              </div>
            </td>
            {requiresSeats && (
              <td className="px-6 py-3">
                {titular.hasSeatRight ? (
                  <Badge
                    variant="outline"
                    className="cursor-pointer border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAssignSeatClick(titular.id);
                    }}
                  >
                    [ Asignar Asiento ]
                  </Badge>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                    <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <span>Requiere anticipo</span>
                  </span>
                )}
              </td>
            )}
            <td className="px-6 py-3 text-xs text-slate-400">—</td>
            <td className="px-6 py-3 text-xs text-slate-400">—</td>
            <td className="px-6 py-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Pendiente
              </span>
            </td>
            <td className="px-6 py-3 text-xs text-slate-400 italic">Cubierto por titular</td>
            <td className="flex items-center justify-end gap-2 px-6 py-3 text-right">
              {!isAuditMode && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-lg border border-slate-200/80 text-slate-400 shadow-xs transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  disabled={isRemovingGhost}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveGhostSlotClick(titular.bookingId);
                  }}
                  title="Liberar lugar apartado"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              {titular.magicToken && !isAuditMode && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 border-amber-200 bg-amber-50 px-2 text-[10px] text-amber-700 hover:bg-amber-100"
                  onClick={(e) => handleCopyLink(e, titular?.magicToken || "")}
                >
                  Enviar Link
                </Button>
              )}
            </td>
          </tr>
        ))}

      {/* 4. FILA DE ACCIÓN: AGREGAR LUGAR AL GRUPO */}
      {!isAuditMode && isExpanded && titular.formStatus === "PENDING" && (
        <tr className="border-b border-slate-100 bg-slate-50/20">
          <td colSpan={requiresSeats ? 8 : 7} className="px-4 py-2.5 pl-9">
            <button
              onClick={() => onAddPassengerClick(titular)}
              disabled={isAdding || (typeof freeSeatsCount === "number" && freeSeatsCount <= 0)}
              className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50/80 hover:text-indigo-700 active:scale-[0.98] disabled:opacity-50"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>+ Agregar lugar al grupo</span>

              {typeof freeSeatsCount === "number" && (
                <span className="inline-flex items-center rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                  {freeSeatsCount} libres en tour
                </span>
              )}
            </button>
          </td>
        </tr>
      )}
    </>
  );
}
