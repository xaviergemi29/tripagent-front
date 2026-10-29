import { JSX, useState } from "react";
import { FormStatus, TitularRowDTO } from "../schemas/tour-dashboard.schema";
import {
  ChevronDown,
  User,
  Users,
  Eye,
  LinkIcon,
  UserMinus,
  UserPlus,
  Trash2,
  Lock,
  CornerDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  FORM_STATUS_DICT,
  PAYMENT_STATUS_DICT,
} from "@/shared/utils/config/status-dictionaries.config";
import { formatCurrency } from "@/shared/utils/currency.util";
import { copyToClipboard } from "@/shared/utils/clipboard";

interface TravelerGroupProps {
  titular: TitularRowDTO;
  isAuditMode?: boolean;
  tourCurrency?: "MXN" | "USD";
  isAdding?: boolean;
  isRemovingGhost?: boolean;
  freeSeatsCount?: number;
  onRowClick: (id: string) => void;
  onAssignSeatClick: (passengerId: string) => void;
  onAddPassengerClick: (titular: TitularRowDTO) => void;
  onRemovePassengerClick: (bookingId: string, passengerId: string, name: string) => void;
  onRemoveGhostSlotClick: (bookingId: string) => void;
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
  onRemoveGhostSlotClick,
  onRowClick,
  onAssignSeatClick,
  onAddPassengerClick,
  onRemovePassengerClick,
}: TravelerGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const registeredCount = 1 + (titular.companions?.length || 0);
  const missingCount = Math.max(0, titular.groupSize - registeredCount);
  const isGroupIncomplete = missingCount > 0;
  const hasPaid = titular.paidAmount > 0 || titular.paymentStatus !== "PENDING";
  const isGroup = titular.groupSize > 1; // Helper derivado para legibilidad

  const handleCopyLink = async (e: React.MouseEvent, token?: string): Promise<void> => {
    e.stopPropagation();
    if (!token) return;
    const success = await copyToClipboard(`${window.location.origin}/register?token=${token}`);
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

            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-semibold text-slate-900">{titular.fullName}</span>

                {isGroup && (
                  <span className="inline-flex items-center rounded-md border border-indigo-200/60 bg-indigo-50 px-2 py-0.5 text-[11px] leading-none font-semibold text-indigo-700">
                    Titular
                  </span>
                )}
              </div>

              {isGroup && (
                <p className="mt-0.5 text-[11px] font-medium tracking-tight text-slate-500">
                  GRUPO: {registeredCount}/{titular.groupSize} REGISTRADOS
                </p>
              )}
            </div>
          </div>
        </td>
        <td className="px-6 py-3.5">
          {hasPaid ? (
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
                Debe: {formatCurrency(titular.balance, { currency: tourCurrency || "MXN" })}
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-400">Sin adeudos</span>
            )}
          </div>
        </td>
        <td className="space-x-2 px-6 py-3.5 text-right">
          {titular.formStatus === "PENDING" && titular.magicToken && (
            <Button
              variant="outline"
              size="icon"
              className="border-slate-200 text-slate-500 hover:text-indigo-600"
              onClick={(e) => handleCopyLink(e, titular?.magicToken || "")}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-indigo-600"
            onClick={(e) => {
              e.stopPropagation(); // 🛡️ Evita que se cierre el acordeón
              onRowClick(titular.id);
            }}
            title="Ver detalles del titular"
          >
            <Eye className="h-4 w-4" />
          </Button>
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
            <td className="px-6 py-3">
              {hasPaid ? (
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
            <td className="px-6 py-3 text-xs text-slate-400">{companion.boardingPoint || "—"}</td>
            <td className="px-6 py-3 font-mono text-xs text-slate-500">
              {companion.whatsapp || "—"}
            </td>
            <td className="px-6 py-3">{getRegistrationBadge(companion.formStatus)}</td>
            <td className="px-6 py-3 text-xs text-slate-400 italic">Cubierto por titular</td>
            <td className="space-x-1 px-6 py-3 text-right">
              {!isAuditMode && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePassengerClick(companion.bookingId, companion.id, companion.fullName);
                  }}
                  title="Dar de baja pasajero"
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-indigo-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onRowClick(companion.id);
                }}
                title="Ver detalles del acompañante"
              >
                <Eye className="h-4 w-4" />
              </Button>
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
            <td className="px-6 py-3">
              {hasPaid ? (
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
                  className="h-8 w-8 text-slate-400 hover:bg-red-50 hover:text-red-600"
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
          <td colSpan={8} className="px-4 py-2.5 pl-9">
            <button
              onClick={() => onAddPassengerClick(titular)}
              disabled={isAdding || (typeof freeSeatsCount === "number" && freeSeatsCount <= 0)}
              className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50/80 hover:text-indigo-700 active:scale-[0.98] disabled:opacity-50"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>+ Agregar lugar al grupo</span>

              {/* 🚀 Renderizado condicional del Badge de disponibilidad */}
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
