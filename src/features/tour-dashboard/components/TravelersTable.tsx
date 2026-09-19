// src/features/dashboard/components/TravelersTable.tsx
"use client";

import { Fragment, useState } from "react";
import { ChevronRight, ChevronDown, User, Users, Eye, CheckCircle2, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export type PaymentRecordDTO = {
  id: string;
  amount: number;
  method: string;
  type: string;
  createdAt: string;
};

// Tipado estricto alineado al DTO jerárquico que regresa tu Backend
export type CompanionDTO = {
  id: string;
  bookingId: string;
  fullName: string;
  whatsapp: string;
  role: "COMPANION";
  paymentStatus: string;
  paidAmount: number;
  balance: number;
  formStatus: "PENDING" | "COMPLETED";
};

export type TitularRowDTO = {
  id: string;
  bookingId: string;
  fullName: string;
  whatsapp: string;
  role: "TITULAR";
  groupSize: number;
  paymentStatus: string;
  paidAmount: number;
  balance: number;
  formStatus: "PENDING" | "COMPLETED";
  companions: CompanionDTO[];
  magicToken: string;
  payments?: PaymentRecordDTO[];
};

interface Props {
  travelers: TitularRowDTO[];
  searchQuery: string;
  paymentFilter: string;
  formFilter: string;
  isAuditMode?: boolean;
  onRowClick: (id: string) => void;
  onValidatePaymentClick: (id: string, e: React.MouseEvent) => void;
}

export function TravelersTable({
  travelers,
  searchQuery,
  paymentFilter,
  formFilter,
  isAuditMode,
  onRowClick,
}: Props) {
  // Estado para controlar qué IDs de titulares tienen su acordeón abierto
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 1. Filtrado inteligente en el cliente
  const filteredTravelers = travelers?.filter((titular) => {
    const matchesTitular =
      titular.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      titular.whatsapp.includes(searchQuery);
    const matchesPayment = paymentFilter === "ALL" || titular.paymentStatus === paymentFilter;
    const matchesForm = formFilter === "ALL" || titular.formStatus === formFilter;

    if (matchesTitular && matchesPayment && matchesForm) return true;

    // Si el titular no hace match, revisamos si alguno de sus acompañantes lo hace
    const matchesCompanion = titular.companions?.some(
      (comp) =>
        comp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.whatsapp.includes(searchQuery),
    );

    return matchesCompanion;
  });

  const getPaymentBadge = (status: string) => {
    const styles: Record<string, string> = {
      PAID: "bg-emerald-100 text-emerald-800",
      PARTIAL: "bg-blue-100 text-blue-800",
      PENDING: "bg-slate-100 text-slate-600",
    };
    return (
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || "bg-slate-100"}`}
      >
        {status}
      </span>
    );
  };

  const getFormBadge = (status: string) => {
    return status === "COMPLETED" ? (
      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
        <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Completo
      </span>
    ) : (
      <span className="flex items-center gap-1 text-xs font-medium text-red-600">
        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500"></span> Pendiente
      </span>
    );
  };

  const handleCopyLink = (e: React.MouseEvent, token?: string): void => {
    e.stopPropagation();
    if (!token) return;

    const magicLinkUrl = `${window.location.origin}/register?token=${token}`;

    navigator.clipboard
      .writeText(magicLinkUrl)
      .then(() => {
        toast.success("Enlace copiado", {
          description: "El Magic Link está listo para enviarse por WhatsApp.",
        });
      })
      .catch(() => {
        toast.error("Error al copiar", {
          description: "No se pudo acceder al portapapeles.",
        });
      });
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 font-semibold text-slate-600">
            <tr>
              <th className="w-10 px-4 py-4"></th>
              <th className="px-6 py-4">Viajero</th>
              <th className="px-6 py-4">Contacto</th>
              <th className="px-6 py-4">Datos del Pasajero</th>
              <th className="px-6 py-4">Estado Pago</th>
              <th className="px-6 py-4">Finanzas</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTravelers?.map((titular) => {
              const isExpanded = !!expandedGroups[titular.id];
              const hasCompanions = titular.companions && titular.companions.length > 0;

              return (
                <Fragment key={titular.id}>
                  {/* Fila del Titular (Padre) */}
                  <tr
                    key={titular.id}
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                    onClick={() => onRowClick(titular.id)}
                  >
                    <td
                      className="px-4 py-4"
                      onClick={(e) => hasCompanions && toggleRow(titular.id, e)}
                    >
                      {hasCompanions ? (
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
                      ) : null}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-indigo-600" />
                        <div>
                          <div className="font-medium text-slate-900">{titular.fullName}</div>
                          <div className="text-[10px] tracking-wider text-slate-400 uppercase">
                            Titular (Grupo de {titular.groupSize})
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">
                      {titular.whatsapp}
                    </td>
                    <td className="px-6 py-4">{getFormBadge(titular.formStatus)}</td>
                    <td className="px-6 py-4">{getPaymentBadge(titular.paymentStatus)}</td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-medium text-slate-900">
                        Pagado: ${titular.paidAmount}
                      </div>
                      {titular.balance > 0 ? (
                        <div className="text-[10px] font-bold text-orange-600">
                          Debe: ${titular.balance}
                        </div>
                      ) : (
                        <div className="text-[10px] font-medium text-emerald-600">Liquidado</div>
                      )}
                    </td>
                    <td className="space-x-2 px-6 py-4 text-right">
                      {titular.formStatus === "PENDING" && titular.magicToken && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-slate-200 text-slate-500 hover:text-indigo-600"
                          onClick={(e) => handleCopyLink(e, titular.magicToken)}
                          title="Copiar enlace de registro"
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

                  {/* Filas de Acompañantes (Hijos / Acordeón expandido) */}
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
                        <td className="px-6 py-3 font-mono text-xs text-slate-500">
                          {companion.whatsapp}
                        </td>
                        <td className="px-6 py-3">{getFormBadge(companion.formStatus)}</td>
                        <td className="px-6 py-3">
                          <span className="text-xs text-slate-400 italic">—</span>
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-xs text-slate-400 italic">
                            Cubierto por titular
                          </span>
                        </td>
                        <td className="space-x-2 px-6 py-4 text-right">
                          {titular.formStatus === "PENDING" &&
                            titular.magicToken &&
                            !isAuditMode && (
                              <Button
                                variant="outline"
                                size="icon"
                                className="border-slate-200 text-slate-500 hover:text-indigo-600"
                                onClick={(e) => handleCopyLink(e, titular.magicToken)}
                                title="Copiar enlace de registro"
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
                    ))}
                </Fragment>
              );
            })}

            {filteredTravelers?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  No se encontraron viajeros o grupos con los filtros actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
