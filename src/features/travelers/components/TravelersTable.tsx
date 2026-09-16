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
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";

interface TravelersTableProps {
  travelers: TravelerOutput[];
  isLoading?: boolean;
  onEdit?: (traveler: TravelerOutput) => void;
  onDelete?: (travelerId: string) => void;
  onViewHistory?: (travelerId: string) => void; // 👈 Nueva prop
}

export function TravelersTable({
  travelers,
  isLoading = false,
  onEdit,
  onDelete,
  onViewHistory,
}: TravelersTableProps) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="animate-pulse p-8 text-center text-slate-500">
        Cargando lista de pasajeros...
      </div>
    );
  }

  if (travelers.length === 0) {
    return (
      <div className="rounded-md border bg-slate-50 p-8 text-center text-slate-500">
        No hay viajeros registrados.
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
      <div className="overflow-hidden rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="w-[220px]">Viajero</TableHead>
              <TableHead>Contacto (WhatsApp / Email)</TableHead>
              <TableHead>Contacto de Emergencia</TableHead>
              <TableHead className="w-[280px]">Notas Médicas</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {travelers.map((traveler: TravelerOutput) => {
              const hasMedicalNotes = Boolean(
                traveler.medicalNotes && traveler.medicalNotes.trim().length > 0,
              );
              const travelerKey = traveler.id || traveler.whatsappPhone;

              return (
                <TableRow key={travelerKey} className="transition-colors hover:bg-slate-50">
                  {/* Nombre: Limpio, sin ID técnico */}
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

                  {/* Contacto Principal */}
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

                  {/* Contacto de Emergencia */}
                  <TableCell>
                    <div className="flex flex-col space-y-1.5 text-xs">
                      <span
                        className="line-clamp-1 font-medium text-slate-700"
                        title={traveler.emergencyContactName}
                      >
                        {traveler.emergencyContactName}
                      </span>
                      <span className="flex items-center text-slate-500">
                        <Phone className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                        {traveler.emergencyContactPhone}
                      </span>
                    </div>
                  </TableCell>

                  {/* Notas Médicas: Fix de Overflow y Line Clamp */}
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

                  {/* Acciones */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-200">
                          <MoreHorizontal className="h-4 w-4 text-slate-500" />
                        </Button>
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
                          className="text-destructive cursor-pointer font-medium focus:bg-red-50 focus:text-red-700"
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
