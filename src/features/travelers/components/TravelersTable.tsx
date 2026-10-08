"use client";

import * as React from "react";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Phone,
  Mail,
  User,
  ShieldAlert,
  Activity,
  UserX,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TravelerOutput } from "../schemas/traveler.schema";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export interface TravelerTableRow extends TravelerOutput {
  tripCount?: number;
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
  if (trips >= 5) {
    return (
      <span className="rounded-md border border-purple-200 bg-purple-50 px-2 py-1 text-xs font-bold text-purple-700">
        🌟 Cliente VIP ({trips})
      </span>
    );
  }
  if (trips >= 2) {
    return (
      <span className="rounded-md border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-bold text-orange-700">
        🔥 Frecuente ({trips})
      </span>
    );
  }
  return (
    <span className="text-xs font-medium text-slate-500">
      {trips} Viaje{trips !== 1 ? "s" : ""}
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
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-2xl border border-slate-100 bg-white p-8 text-center text-slate-500">
        Cargando lista de pasajeros...
      </div>
    );
  }

  // Estado vacío para búsquedas sin resultados (cuando sí existen pasajeros registrados)
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
              <TableHead className="w-[220px]">Viajero</TableHead>
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

              return (
                <TableRow key={traveler.id} className="transition-colors hover:bg-slate-50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-600">
                        <User className="h-4 w-4" />
                      </div>
                      <span
                        className="line-clamp-2 font-semibold text-slate-900"
                        title={traveler.fullName}
                      >
                        {traveler.fullName}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col space-y-1.5 text-xs">
                      <span className="flex items-center font-medium text-slate-700">
                        <Phone className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                        {traveler.whatsappPhone}
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

                  <TableCell>{renderFidelidadBadge(traveler.tripCount)}</TableCell>

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

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-200 focus:outline-none"
                          aria-label="Abrir menú de opciones"
                        >
                          <MoreHorizontal className="h-4 w-4 text-slate-500" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuLabel className="text-xs text-slate-500">
                          Opciones
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          className="cursor-pointer font-medium text-indigo-700 focus:bg-indigo-50"
                          onClick={() => {
                            if (traveler.id) onViewHistory?.(traveler.id);
                          }}
                        >
                          <Activity className="mr-2 h-4 w-4" /> Ver Historial
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer font-medium"
                          onClick={() => onEdit?.(traveler)}
                        >
                          <Edit className="mr-2 h-4 w-4 text-slate-500" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer font-medium text-red-600 focus:bg-red-50 focus:text-red-700"
                          onClick={(e) => {
                            e.preventDefault();
                            if (traveler.id) setDeletingId(traveler.id);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
