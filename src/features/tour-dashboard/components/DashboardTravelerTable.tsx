"use client";

import { Fragment, JSX, useMemo, useState } from "react";
import { ChevronRight, ChevronDown, User, Users, Eye, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { copyToClipboard } from "@/shared/utils/clipboard";
import { FormStatus, TitularRowDTO } from "../schemas/tour-dashboard.schema";
import { formatCurrency } from "@/shared/utils/currency.util";
import {
  FORM_STATUS_DICT,
  PAYMENT_STATUS_DICT,
} from "@/shared/utils/config/status-dictionaries.config";

export type PaymentFilter = "ALL" | "UNPAID" | "PARTIAL" | "PAID";
export type RegistrationFilter = "ALL" | "PENDING" | "COMPLETED";
export type SeatFilter = "ALL" | "UNASSIGNED" | "ASSIGNED";

interface DashboardTravelerTableProps {
  travelers: TitularRowDTO[];
  searchQuery: string;
  paymentFilter: PaymentFilter | string;
  formFilter: RegistrationFilter | string;
  seatFilter: SeatFilter | string;
  isAuditMode?: boolean;
  tourCurrency?: "MXN" | "USD";
  onRowClick: (id: string) => void;
  onAssignSeatClick: (passengerId: string) => void;
  onClearFilters?: () => void;
}

export function DashboardTravelerTable({
  travelers,
  searchQuery,
  paymentFilter,
  formFilter,
  seatFilter,
  isAuditMode,
  tourCurrency,
  onRowClick,
  onAssignSeatClick,
  onClearFilters,
}: DashboardTravelerTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string, e: React.MouseEvent): void => {
    e.stopPropagation();
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyLink = async (e: React.MouseEvent, token?: string): Promise<void> => {
    e.stopPropagation();
    if (!token) return;

    const magicLinkUrl = `${window.location.origin}/register?token=${token}`;
    const success = await copyToClipboard(magicLinkUrl);

    if (success) {
      toast.success("Enlace copiado", {
        description: "El enlace está listo para pegarse en WhatsApp.",
      });
    } else {
      toast.error("Error al copiar", { description: "Por favor, copia el enlace manualmente." });
    }
  };

  const filteredTravelers = useMemo(() => {
    if (!travelers) return [];

    return travelers.filter((titular) => {
      // Regla 1: Búsqueda. Verifica titular O acompañantes de manera aislada.
      const matchSearch = () => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase().trim();

        const titularMatch =
          titular.fullName.toLowerCase().includes(query) || titular.whatsapp.includes(query);

        if (titularMatch) return true;

        return (
          titular.companions?.some(
            (comp) => comp.fullName.toLowerCase().includes(query) || comp.whatsapp.includes(query),
          ) ?? false
        );
      };

      // Regla 2: Finanzas (Defensive Programming contra inconsistencias de DB)
      const matchPayment = () => {
        if (paymentFilter === "ALL") return true;

        let resolvedStatus = "UNPAID";
        if (titular.paymentStatus === "PAID" || (titular.paidAmount > 0 && titular.balance <= 0)) {
          resolvedStatus = "PAID";
        } else if (
          titular.paidAmount > 0 ||
          ["ADVANCE", "PARTIAL", "PENDING_VALIDATION"].includes(titular.paymentStatus)
        ) {
          resolvedStatus = "PARTIAL";
        }

        return resolvedStatus === paymentFilter;
      };

      // 🚀 Escenario 2 PM: Evaluación de Grupo para el Formulario
      const matchRegistration = () => {
        if (formFilter === "ALL") return true;

        const isTitularCompleted = titular.formStatus === "COMPLETED";
        const areCompanionsCompleted =
          titular.companions?.every((c) => c.formStatus === "COMPLETED") ?? true;

        // La cadena es tan fuerte como su eslabón más débil
        const groupStatus = isTitularCompleted && areCompanionsCompleted ? "COMPLETED" : "PENDING";

        return groupStatus === formFilter;
      };

      // Regla 4: Filtro de Asientos (Evaluación de Grupo)
      const matchSeat = () => {
        if (seatFilter === "ALL") return true;

        const groupMembers = [titular, ...(titular.companions || [])];

        if (seatFilter === "UNASSIGNED") {
          // Si AL MENOS UNO no tiene asiento, el grupo requiere atención
          return groupMembers.some((member) => !member.seatLabel);
        }

        if (seatFilter === "ASSIGNED") {
          // Solo si TODOS tienen asiento, el grupo está completo
          return groupMembers.every((member) => !!member.seatLabel);
        }

        return true;
      };

      // 🚀 Escenario 1 PM: Short-circuit evaluation estricta (AND)
      return matchSearch() && matchPayment() && matchRegistration() && matchSeat();
    });
  }, [travelers, searchQuery, paymentFilter, formFilter, seatFilter]);

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

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 font-semibold text-slate-600">
            <tr>
              <th className="w-10 px-4 py-4"></th>
              <th className="px-6 py-4">Viajero / Grupo</th>
              <th className="px-6 py-4">Asiento</th>
              <th className="px-6 py-4">Abordaje</th>
              <th className="px-6 py-4">Contacto</th>
              <th className="px-6 py-4">Registro</th>
              <th className="px-6 py-4">Estado Financiero</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTravelers.map((titular) => {
              const isExpanded = !!expandedGroups[titular.id];
              const hasCompanions = titular.companions && titular.companions.length > 0;
              const hasPaid = titular.paidAmount > 0 || titular.paymentStatus !== "PENDING";
              const registeredCount = 1 + (titular.companions?.length || 0);
              const missingCount = Math.max(0, titular.groupSize - registeredCount);
              const isGroupIncomplete = missingCount > 0;

              return (
                <Fragment key={titular.id}>
                  {/* FILA DEL TITULAR */}
                  <tr
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                    onClick={() => onRowClick(titular.id)}
                  >
                    <td className="px-4 py-4" onClick={(e) => toggleRow(titular.id, e)}>
                      {(hasCompanions || isGroupIncomplete) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-500 hover:text-indigo-600"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-indigo-600" />
                        <div>
                          <div className="font-medium text-slate-900">{titular.fullName}</div>
                          <div
                            className={`text-[10px] font-semibold tracking-wider uppercase ${isGroupIncomplete ? "text-amber-600" : "text-slate-400"}`}
                          >
                            Grupo: {registeredCount}/{titular.groupSize} Registrados
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {hasPaid ? (
                        titular.seatLabel ? (
                          <Badge className="border-indigo-200 bg-indigo-100 text-indigo-800">
                            {titular.seatLabel}
                          </Badge>
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
                        <Badge variant="outline" className="bg-slate-50 text-slate-400 opacity-60">
                          🔒 Requiere anticipo
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {titular.boardingPoint ? (
                        <span className="text-xs font-medium text-slate-700">
                          {titular.boardingPoint}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">Por definir</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">
                      {titular.whatsapp}
                    </td>
                    <td className="px-6 py-4">{getRegistrationBadge(titular.formStatus)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1">
                        {getFinancialBadge(
                          titular.paymentStatus,
                          titular.paidAmount,
                          titular.balance,
                        )}
                        {titular.balance > 0 ? (
                          <span className="text-[11px] font-bold text-slate-500">
                            Debe:{" "}
                            {formatCurrency(titular.balance, { currency: tourCurrency || "MXN" })}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400">
                            Sin adeudos
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="space-x-2 px-6 py-4 text-right">
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
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>

                  {/* FILAS DE ACOMPAÑANTES REALES */}
                  {isExpanded &&
                    titular.companions?.map((companion) => (
                      <tr
                        key={companion.id}
                        className="cursor-pointer border-t border-slate-100 bg-slate-50/70 transition-colors hover:bg-slate-100/80"
                        onClick={() => onRowClick(companion.id)}
                      >
                        <td className="px-4 py-3"></td>
                        <td className="px-6 py-3 pl-10">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <div>
                              <div className="text-xs font-medium text-slate-700">
                                {companion.fullName}
                              </div>
                              <div className="text-[9px] tracking-wider text-slate-400 uppercase">
                                Acompañante de {titular.fullName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          {hasPaid ? (
                            companion.seatLabel ? (
                              <Badge className="border-indigo-200 bg-indigo-100 text-indigo-800">
                                {companion.seatLabel}
                              </Badge>
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
                            <Badge
                              variant="outline"
                              className="bg-slate-50 text-slate-400 opacity-60"
                            >
                              🔒 Requiere anticipo
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          {companion.boardingPoint ? (
                            <span className="text-xs font-medium text-slate-700">
                              {companion.boardingPoint}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Por definir</span>
                          )}
                        </td>
                        <td className="px-6 py-3 font-mono text-xs text-slate-500">
                          {companion.whatsapp}
                        </td>
                        <td className="px-6 py-3">{getRegistrationBadge(companion.formStatus)}</td>
                        <td className="px-6 py-3">
                          <span className="text-xs text-slate-400 italic">
                            Cubierto por titular
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-indigo-600"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}

                  {/* PLACEHOLDERS PARA REGISTROS FALTANTES */}
                  {isExpanded &&
                    isGroupIncomplete &&
                    Array.from({ length: missingCount }).map((_, index) => (
                      <tr
                        key={`ghost-${titular.id}-${index}`}
                        className="border-t border-slate-100 bg-slate-50/40 opacity-70"
                      >
                        <td className="px-4 py-3"></td>
                        <td className="px-6 py-3 pl-10">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-slate-300" />
                            <div>
                              <div className="text-xs font-medium text-slate-500 italic">
                                Acompañante pendiente de registro
                              </div>
                              <div className="text-[9px] tracking-wider text-slate-400 uppercase">
                                Lugar reservado #{registeredCount + index + 1}
                              </div>
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
                            <Badge
                              variant="outline"
                              className="bg-slate-50 text-slate-400 opacity-60"
                            >
                              🔒 Requiere anticipo
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-xs text-slate-400">—</span>
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-xs text-slate-400">—</span>
                        </td>
                        <td className="px-6 py-3">{getRegistrationBadge("PENDING")}</td>
                        <td className="px-6 py-3">
                          <span className="text-xs text-slate-400 italic">
                            Cubierto por titular
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          {titular.magicToken && !isAuditMode && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 border-amber-200 bg-amber-50 text-[10px] text-amber-700 hover:bg-amber-100"
                              onClick={(e) => handleCopyLink(e, titular?.magicToken || "")}
                            >
                              Enviar Link
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                </Fragment>
              );
            })}

            {/* 🚀 Escenario 3 PM: Empty State Resolutivo */}
            {filteredTravelers.length === 0 && travelers?.length > 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                    <p className="text-sm font-medium">
                      No se encontraron viajeros con los filtros actuales.
                    </p>
                    {onClearFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onClearFilters}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        Limpiar filtros
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {travelers?.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                  Aún no hay viajeros registrados en este tour.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
