"use client";

import * as React from "react";
import Link from "next/link";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Landmark,
  CreditCard,
  LinkIcon,
  LayoutDashboard,
  Bus,
  Footprints,
  Banknote,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useTours, useToggleTourStatus, useDeleteTour } from "../hooks/useTours";
import type { TourOutput } from "../schemas/tourSchema";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export function TourListTable() {
  const { data: tours = [], isLoading } = useTours();
  const { mutate: toggleStatus } = useToggleTourStatus();
  const { mutate: deleteTour } = useDeleteTour();

  // Estado para el modal de confirmación limpio
  const [tourToDelete, setTourToDelete] = React.useState<string | null>(null);

  const handleToggle = (tourId: string, currentStatus: boolean) => {
    toggleStatus({ id: tourId, isActive: !currentStatus });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse p-8 text-center text-slate-500">Cargando operaciones...</div>
    );
  }

  if (tours.length === 0) {
    return (
      <div className="rounded-md border bg-slate-50 p-8 text-center text-slate-500">
        No hay tours configurados.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="w-[280px]">Tour y Salida</TableHead>
              <TableHead>Modalidad</TableHead>
              <TableHead>Cobro</TableHead>
              <TableHead>Aforo</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tours.map((tour: TourOutput) => (
              <TableRow key={tour.id} className="transition-colors hover:bg-slate-50/50">
                {/* 1. Info Principal con Jerarquía Visual */}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="line-clamp-1 font-semibold text-slate-900" title={tour.title}>
                      {tour.title}
                    </span>
                    <span className="mt-0.5 text-xs text-slate-500">
                      {new Date(tour.departureDateTime).toLocaleString("es-MX", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </TableCell>

                {/* 2. Modalidad Operativa (NUEVO) */}
                <TableCell>
                  {tour.transportModality === "TRANSPORT_INCLUDED" ? (
                    <div
                      className="flex items-center text-sm text-slate-600"
                      title="Transporte Incluido"
                    >
                      <Bus className="mr-2 h-4 w-4 text-indigo-500" />
                      <span>Con Transporte</span>
                    </div>
                  ) : (
                    <div
                      className="flex items-center text-sm text-slate-600"
                      title="Acceso Independiente"
                    >
                      <Footprints className="mr-2 h-4 w-4 text-emerald-600" />
                      <span>Punto de Encuentro</span>
                    </div>
                  )}
                </TableCell>

                {/* 3. Métodos de Cobro + Precio Integrado */}
                <TableCell>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-900">
                      ${tour.price.toLocaleString("es-MX")}
                    </span>
                    <div className="flex gap-1">
                      {tour.acceptsBankTransfer && (
                        <Badge
                          variant="outline"
                          className="border-slate-200 px-1.5 py-0 text-[10px]"
                          title="SPEI"
                        >
                          <Landmark className="h-3 w-3 text-slate-500" />
                        </Badge>
                      )}
                      {tour.acceptsCreditCard && (
                        <Badge
                          variant="outline"
                          className="border-slate-200 px-1.5 py-0 text-[10px]"
                          title="Tarjeta"
                        >
                          <CreditCard className="h-3 w-3 text-slate-500" />
                        </Badge>
                      )}
                      {tour.acceptsCash && (
                        <Badge
                          variant="outline"
                          className="border-slate-200 bg-green-50 px-1.5 py-0 text-[10px] text-green-700"
                          title="Efectivo"
                        >
                          <Banknote className="mr-1 h-3 w-3" /> Efec.
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* 4. Aforo */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">
                      0 / {tour.maxCapacity}
                    </span>
                  </div>
                </TableCell>

                {/* 5. Toggle de Estado Activo */}
                <TableCell className="text-center">
                  <Switch
                    checked={tour.isActive}
                    onCheckedChange={() => handleToggle(tour.id!, tour.isActive)}
                    aria-label="Activar o desactivar tour"
                  />
                </TableCell>

                {/* 6. Acciones (Dropdown) */}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100">
                        <MoreHorizontal className="h-4 w-4 text-slate-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel className="text-xs tracking-wider text-slate-500 uppercase">
                        Operaciones
                      </DropdownMenuLabel>

                      <DropdownMenuItem
                        asChild
                        className="mb-1 cursor-pointer bg-indigo-50 font-medium text-indigo-700 focus:bg-indigo-100 focus:text-indigo-800"
                      >
                        <Link href={`/tours/${tour.id}`}>
                          <LayoutDashboard className="mr-2 h-4 w-4" /> Centro de Control
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href={`/tours/${tour.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4 text-slate-500" /> Editar Tour
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        className="text-destructive cursor-pointer focus:bg-red-50"
                        onSelect={(e) => {
                          e.preventDefault();
                          setTourToDelete(tour.id!);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        isOpen={!!tourToDelete}
        onOpenChange={(open: boolean) => {
          if (!open) setTourToDelete(null);
        }}
        title="¿Eliminar este tour?"
        description="Esta acción es irreversible y borrará todo el registro logístico de la base de datos."
        confirmText="Sí, eliminar"
        onConfirm={() => {
          if (tourToDelete) {
            deleteTour(tourToDelete);
            setTourToDelete(null);
          }
        }}
        isDestructive={true}
      />
    </>
  );
}
