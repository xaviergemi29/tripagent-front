"use client"

import * as React from "react"
import { MoreHorizontal, Edit, Trash2, Phone, Mail, User, ShieldAlert, Activity } from "lucide-react"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { TravelerOutput } from "../schemas/travelerSchema"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { toast } from "sonner"

interface TravelersTableProps {
    travelers: TravelerOutput[]
    isLoading?: boolean
    onEdit?: (traveler: TravelerOutput) => void
    onDelete?: (travelerId: string) => void
    onViewHistory?: (travelerId: string) => void // 👈 Nueva prop
}

export function TravelersTable({ travelers, isLoading = false, onEdit, onDelete, onViewHistory }: TravelersTableProps) {
    const [deletingId, setDeletingId] = React.useState<string | null>(null);

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500 animate-pulse">Cargando lista de pasajeros...</div>
    }

    if (travelers.length === 0) {
        return <div className="p-8 text-center text-slate-500 border rounded-md bg-slate-50">No hay viajeros registrados.</div>
    }

    const handleConfirmDelete = (): void => {
        if (deletingId && onDelete) {
            onDelete(deletingId);
        }
        setDeletingId(null);
    };

    return (
        <>
            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
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
                            const hasMedicalNotes = Boolean(traveler.medicalNotes && traveler.medicalNotes.trim().length > 0)
                            const travelerKey = traveler.id || traveler.whatsappPhone

                            return (
                                <TableRow key={travelerKey} className="hover:bg-slate-50 transition-colors">

                                    {/* Nombre: Limpio, sin ID técnico */}
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <span
                                                className="text-slate-900 font-semibold line-clamp-2"
                                                title={traveler.fullName}
                                            >
                                                {traveler.fullName}
                                            </span>
                                        </div>
                                    </TableCell>

                                    {/* Contacto Principal */}
                                    <TableCell>
                                        <div className="flex flex-col text-xs space-y-1.5">
                                            <span className="flex items-center text-slate-700 font-medium">
                                                <Phone className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                                                {traveler.whatsappPhone}
                                            </span>
                                            {traveler.email && (
                                                <span className="flex items-center text-slate-500 line-clamp-1" title={traveler.email}>
                                                    <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
                                                    {traveler.email}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* Contacto de Emergencia */}
                                    <TableCell>
                                        <div className="flex flex-col text-xs space-y-1.5">
                                            <span className="font-medium text-slate-700 line-clamp-1" title={traveler.emergencyContactName}>
                                                {traveler.emergencyContactName}
                                            </span>
                                            <span className="flex items-center text-slate-500">
                                                <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                                {traveler.emergencyContactPhone}
                                            </span>
                                        </div>
                                    </TableCell>

                                    {/* Notas Médicas: Fix de Overflow y Line Clamp */}
                                    <TableCell>
                                        {hasMedicalNotes ? (
                                            <div className="flex items-start gap-2 text-amber-700 bg-amber-50 p-2.5 rounded-md border border-amber-200 w-full">
                                                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                                                <span
                                                    className="text-[11px] leading-relaxed flex-1 min-w-0 break-words line-clamp-3"
                                                    title={traveler.medicalNotes}
                                                >
                                                    {traveler.medicalNotes}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic px-1">Sin observaciones</span>
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
                                                <DropdownMenuLabel className="text-xs text-slate-500">Opciones</DropdownMenuLabel>
                                                <DropdownMenuItem
                                                    className="cursor-pointer font-medium text-indigo-700 focus:bg-indigo-50"
                                                    onClick={() => {
                                                        if (traveler.id) onViewHistory?.(traveler.id);
                                                    }}
                                                >
                                                    <Activity className="w-4 h-4 mr-2" /> Ver Historial
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer font-medium"
                                                    onClick={() => onEdit?.(traveler)}
                                                >
                                                    <Edit className="w-4 h-4 mr-2 text-slate-500" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive cursor-pointer focus:bg-red-50 focus:text-red-700 font-medium"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (traveler.id) setDeletingId(traveler.id);
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )
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
    )
}