"use client";

import * as React from "react";
import {
  MoreHorizontal,
  Trash2,
  Phone,
  Mail,
  User,
  ShieldAlert,
  Activity,
  UserX,
  Baby,
  Pencil,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TravelerOutput } from "../schemas/traveler.schema";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { calculateAge } from "@/shared/utils/calculate-age";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface TravelerTableRow extends TravelerOutput {
  tripCount?: number;
  passengerType?: "ADULT" | "CHILD";
}

interface TravelersTableProps {
  travelers: TravelerTableRow[];
  isLoading?: boolean;
  isFiltered?: boolean;
  onEdit?: (traveler: TravelerOutput) => void;
  onDelete?: (travelerId: string) => void;
  onViewHistory?: (travelerId: string) => void;
}

const renderFidelidadBadge = (trips: number = 0): React.ReactNode => {
  return (
    <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {trips} {trips === 1 ? "viaje registrado" : "viajes registrados"}
    </span>
  );
};

export function TravelersTable({
  travelers,
  isLoading = false,
  isFiltered = false,
  onEdit,
  onDelete,
  onViewHistory,
}: TravelersTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-2xl border border-slate-100 bg-white p-8 text-center text-slate-500">
        Cargando lista de pasajeros...
      </div>
    );
  }

  // Estado vacío para búsquedas sin resultados
  if (travelers.length === 0 && isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-slate-500">
        <UserX className="mb-3 h-10 w-10 text-slate-400" />
        <p className="text-sm font-medium text-slate-700">
          No se encontraron viajeros que coincidan con la búsqueda.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Intenta buscar por otro nombre o número de WhatsApp.
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
              <TableHead className="w-[260px]">Viajero</TableHead>
              <TableHead>Contacto (WhatsApp / Email)</TableHead>
              <TableHead>Nivel de Fidelidad</TableHead>
              <TableHead className="w-[280px]">Notas Médicas</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {travelers.map((traveler) => {
              const hasMedicalNotes = Boolean(
                traveler.medicalNotes && traveler.medicalNotes.trim().length > 0,
              );

              const age = calculateAge(traveler.birthDate);
              const isChild = traveler.passengerType === "CHILD" || (age !== null && age < 18);

              return (
                <TableRow key={traveler.id} className="transition-colors hover:bg-slate-50">
                  {/* --- COLUMNA 1: VIAJERO --- */}
                  <TableCell className="py-3">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 rounded-md bg-slate-100/70 p-1 text-slate-500">
                        {isChild ? (
                          <Baby className="h-4 w-4 shrink-0 text-amber-600" />
                        ) : (
                          <User className="h-4 w-4 shrink-0 text-slate-500" />
                        )}
                      </div>

                      <div className="flex flex-col">
                        <span
                          className="line-clamp-2 text-sm leading-tight font-semibold text-slate-900"
                          title={traveler.fullName}
                        >
                          {traveler.fullName}
                        </span>

                        {isChild && (
                          <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full border border-amber-200/70 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                            <span>Menor de edad</span>
                            {age !== null && (
                              <span className="font-bold text-amber-900">({age} años)</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* --- COLUMNA 2: CONTACTO --- */}
                  <TableCell>
                    <div className="flex flex-col space-y-1.5 text-xs">
                      <span className="flex items-center font-medium text-slate-700">
                        <Phone className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                        {traveler.whatsappPhone || (
                          <span className="text-slate-400 italic">Sin teléfono</span>
                        )}
                      </span>
                      {traveler.email && (
                        <span
                          className="line-clamp-1 flex items-center text-slate-500"
                          title={traveler.email}
                        >
                          <Mail className="mr-1.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                          {traveler.email}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* --- COLUMNA 3: FIDELIDAD --- */}
                  <TableCell>{renderFidelidadBadge(traveler.tripCount)}</TableCell>

                  {/* --- COLUMNA 4: NOTAS MÉDICAS --- */}
                  <TableCell>
                    {hasMedicalNotes ? (
                      <div className="flex w-full items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-amber-700">
                        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                        <span
                          className="line-clamp-3 min-w-0 flex-1 text-[11px] leading-relaxed break-words"
                          title={traveler.medicalNotes}
                        >
                          {traveler.medicalNotes}
                        </span>
                      </div>
                    ) : (
                      <span className="px-1 text-xs text-slate-400 italic">Sin observaciones</span>
                    )}
                  </TableCell>

                  {/* --- COLUMNA 5: ACCIONES --- */}
                  <TableCell className="py-3 text-right">
                    <TooltipProvider delayDuration={150}>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botón Editar */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg border border-slate-200/80 bg-white text-slate-500 shadow-xs transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                              onClick={() => onEdit?.(traveler)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar {traveler.fullName}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white"
                          >
                            Editar viajero
                          </TooltipContent>
                        </Tooltip>

                        {/* Botón Ver Historial */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg border border-slate-200/80 bg-white text-slate-500 shadow-xs transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                              onClick={() => {
                                if (traveler.id) onViewHistory?.(traveler.id);
                              }}
                            >
                              <Activity className="h-4 w-4" />
                              <span className="sr-only">Ver Historial</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white"
                          >
                            Ver Historial
                          </TooltipContent>
                        </Tooltip>

                        {/* Botón Eliminar */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg border border-slate-200/80 bg-white text-slate-400 shadow-xs transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                              onClick={() => {
                                if (traveler.id) setDeletingId(traveler.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white"
                          >
                            Eliminar pasajero
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
        description="¿Estás seguro que deseas remover a este pasajero? Esta acción no se puede deshacer y liberará su lugar en el tour."
        onConfirm={handleConfirmDelete}
        confirmText="Sí, eliminar"
        isDestructive={true}
      />
    </>
  );
}
