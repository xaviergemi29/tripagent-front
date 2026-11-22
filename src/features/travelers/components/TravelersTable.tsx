"use client";

import { useState } from "react";
import { Trash2, Phone, Mail, ShieldAlert, Activity, UserX, Pencil, Cake } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { getInitials, getAvatarColor } from "@/shared/utils/travelers-helpers";
import type { TravelerOutput } from "../schemas/traveler.schema";
import { formatBirthdateAndAge } from "@/shared/utils/tour-date.util";
import { TOUR_TARGET } from "@/features/onboarding/constants/guided-tours";
import { type PassengerType } from "@/shared/constants/domain.constants";
import { formatPhoneForDisplay } from "@/shared/utils/phone.util";

export interface TravelerTableRow extends TravelerOutput {
  tripCount?: number;
  passengerType?: PassengerType;
}

interface TravelersTableProps {
  travelers: TravelerTableRow[];
  isLoading?: boolean;
  isFiltered?: boolean;
  onEdit?: (traveler: TravelerOutput) => void;
  onDelete?: (travelerId: string) => void;
  onViewHistory?: (travelerId: string) => void;
  /** Falso en Modo Solo Lectura por suscripción: Editar y Eliminar se deshabilitan (2026-11-18). */
  canManage?: boolean;
}

export function TravelersTable({
  travelers,
  isLoading = false,
  isFiltered = false,
  onEdit,
  onDelete,
  onViewHistory,
  canManage = true,
}: TravelersTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-2xl border border-slate-100 bg-white p-8 text-center text-slate-500">
        Cargando lista de pasajeros...
      </div>
    );
  }

  if (travelers.length === 0 && isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-slate-500">
        <UserX className="mb-3 h-10 w-10 text-slate-400" />
        <p className="text-sm font-medium text-slate-700">
          No se encontraron viajeros que coincidan con la búsqueda.
        </p>
      </div>
    );
  }

  const handleConfirmDelete = (): void => {
    if (deletingId && onDelete) {
      onDelete(deletingId);
    }
    setDeletingId(null);
  };

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="w-[280px]">Viajero</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Emergencia</TableHead>
              <TableHead>Historial</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {travelers.map((traveler) => {
              const birthInfo = formatBirthdateAndAge(traveler.birthDate);

              return (
                <TableRow key={traveler.id} className="transition-colors hover:bg-slate-50">
                  <TableCell className="py-3.5 pl-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-xs ${getAvatarColor(traveler.fullName)}`}
                      >
                        {getInitials(traveler.fullName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-bold text-slate-900">
                            {traveler.fullName}
                          </span>
                          {birthInfo?.isMinor && (
                            <span className="rounded border border-indigo-200/60 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-indigo-700 uppercase">
                              Menor
                            </span>
                          )}
                        </div>
                        {birthInfo ? (
                          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                            <Cake className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span>
                              {birthInfo.formattedDate} • {birthInfo.age} años
                            </span>
                          </div>
                        ) : (
                          <span className="mt-0.5 block text-xs text-slate-400 italic">
                            Sin fecha de nacimiento
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col space-y-1.5 text-xs">
                      <span className="flex items-center font-medium text-slate-700">
                        <Phone className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                        {formatPhoneForDisplay(traveler.whatsappPhone) || (
                          <span className="text-slate-400 italic">Sin teléfono</span>
                        )}
                      </span>
                      {traveler.email && (
                        <span className="flex items-center text-slate-500" title={traveler.email}>
                          <Mail className="mr-1.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{traveler.email}</span>
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      <span
                        className="line-clamp-1 text-sm font-medium text-slate-800"
                        title={traveler.emergencyContactName}
                      >
                        {traveler.emergencyContactName}
                      </span>
                      <span className="flex items-center text-xs font-semibold text-slate-500">
                        <ShieldAlert className="mr-1.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                        {formatPhoneForDisplay(traveler.emergencyContactPhone)}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div>
                      <span className="block text-xs font-semibold text-slate-800">
                        {traveler.tripCount && traveler.tripCount > 0
                          ? `${traveler.tripCount} ${traveler.tripCount === 1 ? "tour registrado" : "tours registrados"}`
                          : "0 viajes (Nuevo)"}
                      </span>
                      <div className="mt-1 flex items-center gap-1.5">
                        {!traveler.tripCount ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            Pendiente
                          </span>
                        ) : (
                          <>
                            {traveler.hasNationalTrips && (
                              <span className="inline-flex items-center rounded-full border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                Nacional
                              </span>
                            )}
                            {traveler.hasInternationalTrips && (
                              <span className="inline-flex items-center rounded-full border border-indigo-200/60 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                                Extranjero
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <TooltipProvider delayDuration={150}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg border border-slate-200/80 bg-white text-slate-500 shadow-xs transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                              onClick={() => onEdit?.(traveler)}
                              disabled={!canManage}
                              aria-label="Editar viajero"
                              data-tour={TOUR_TARGET.TRAVELERS_ACTION_EDIT}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white"
                          >
                            Editar viajero
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg border border-slate-200/80 bg-white text-slate-500 shadow-xs transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                              onClick={() => {
                                if (traveler.id) onViewHistory?.(traveler.id);
                              }}
                              aria-label="Ver Historial"
                              data-tour={TOUR_TARGET.TRAVELERS_ACTION_HISTORY}
                            >
                              <Activity className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white"
                          >
                            Ver Historial
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg border border-slate-200/80 bg-white text-slate-400 shadow-xs transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                              onClick={() => {
                                if (traveler.id) setDeletingId(traveler.id);
                              }}
                              disabled={!canManage}
                              aria-label="Eliminar viajero"
                              data-tour={TOUR_TARGET.TRAVELERS_ACTION_DELETE}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white"
                          >
                            Eliminar viajero
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        isOpen={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Eliminar registro de viajero"
        description="Se borrarán sus datos personales (nombre, teléfonos, correo, contacto de emergencia y fecha de nacimiento). Sus reservas y pagos se conservan como «Pasajero Eliminado» para que tu caja siga cuadrando. Esta acción no se puede deshacer."
        onConfirm={handleConfirmDelete}
        confirmText="Sí, eliminar"
        isDestructive={true}
      />
    </>
  );
}
