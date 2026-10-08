"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  PauseCircle,
  LayoutDashboard,
  Bus,
  Footprints,
  PlayCircle,
  Share2,
  Calendar,
  InfoIcon,
  Search, // 🚀 Añadido
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input"; // 🚀 Añadido
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useToggleTourStatus, useDeleteTour } from "../hooks/useTours";
import type { TourOutput } from "../schemas/tour.schema";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";

interface TourListTableProps {
  tours: TourOutput[];
  isLoading?: boolean;
}

const formatSpanishDate = (dateString: string): string => {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  const formatter = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const formatted = formatter.format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const formatTourDateTime = (dateString: string, boardingPoints?: any[]) => {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  const formatter = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  let formattedDate = formatter.format(date);
  formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  let timeStr = "";
  if (boardingPoints && boardingPoints.length > 0 && boardingPoints[0].time) {
    const timeParts = boardingPoints[0].time.split(":");
    let hours = parseInt(timeParts[0], 10);
    const minutes = timeParts[1];
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    timeStr = ` • ${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  }

  return `${formattedDate}${timeStr}`;
};

const getStatusBadge = (isActive: boolean, temporalStatus?: string) => {
  if (!isActive) {
    return (
      <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
        Pausado / Cancelado
      </Badge>
    );
  }

  switch (temporalStatus) {
    case "EN_CURSO":
      return (
        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
          En Curso Hoy
        </Badge>
      );
    case "FINALIZADO":
      return (
        <Badge variant="outline" className="border-slate-200 bg-slate-100 text-slate-600">
          Finalizado
        </Badge>
      );
    case "PRÓXIMO":
    default:
      return (
        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
          Próximo
        </Badge>
      );
  }
};

const handleShareLink = (tour: TourOutput): void => {
  const publicUrl = tour.brochureUrl || `${window.location.origin}/p/${tour.id}`;
  const formattedDate = formatSpanishDate(tour.departureDateTime);
  const deposit = tour.depositPerPerson || 0;

  const depositLine =
    deposit > 0 ? `💰 Aparta desde: $${deposit.toLocaleString("es-MX")} MXN\n` : "";

  const shareText = `🎒 ¡Hola! Te comparto la información completa para el ${tour.title}
🗓️ Salida: ${formattedDate}
${depositLine}Revisa todos los detalles (horarios, fotos y qué incluye) en nuestro folleto digital:
👉 ${publicUrl}

📲 Cualquier duda, respóndeme a este mensaje.`;

  navigator.clipboard.writeText(shareText);
  toast.success(
    "Información del folleto copiada al portapapeles. ¡Lista para enviar por WhatsApp!",
  );
};

export function TourListTable({ tours, isLoading = false }: TourListTableProps) {
  const { mutate: toggleStatus } = useToggleTourStatus();
  const { mutate: deleteTour } = useDeleteTour();
  const [tourToDelete, setTourToDelete] = useState<string | null>(null);

  // 🚀 1. Estado y Lógica del Buscador
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTours = useMemo(() => {
    if (!searchTerm.trim()) return tours;
    const term = searchTerm.toLowerCase().trim();
    return tours.filter((tour: TourOutput) => {
      // Utilizamos type casting (any) temporal para evitar advertencias de TS si el tipo no declara explícitamente "name" o "destination"
      const name = ((tour as any).name || tour.title || "").toLowerCase();
      const destination = ((tour as any).destination || "").toLowerCase();
      return name.includes(term) || destination.includes(term);
    });
  }, [tours, searchTerm]);

  const handleToggle = (tourId: string, currentStatus: boolean) => {
    toggleStatus({ id: tourId, isActive: !currentStatus });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-2xl border border-slate-100 bg-white p-8 text-center text-slate-500">
        Cargando operaciones...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 🚀 2. Barra Superior del Listado (Título y Buscador) */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Título de la sección */}
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Listado de Salidas</h2>

        {/* Buscador */}
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar por tour o destino..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-lg border-slate-200 bg-white py-2 pr-4 pl-9 text-sm shadow-sm placeholder:text-slate-400 focus-visible:ring-indigo-600"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="text-muted-foreground w-[300px] text-xs font-semibold tracking-wider uppercase">
                Tour y Fecha de Salida
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Tipo
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Precio por persona
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Lugares
              </TableHead>
              <TableHead className="text-muted-foreground text-center text-xs font-semibold tracking-wider uppercase">
                Estado
              </TableHead>
              <TableHead className="text-muted-foreground text-right text-xs font-semibold tracking-wider uppercase">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* 🚀 3. Estado Vacío de Búsqueda y renderizado condicional */}
            {filteredTours.length === 0 && tours.length > 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-slate-500">
                  No se encontraron salidas que coincidan con &ldquo;{searchTerm}&rdquo;.
                </TableCell>
              </TableRow>
            ) : (
              filteredTours.map((tour: TourOutput) => {
                // Lógica simulada basada en tu actual `0 / {tour.maxCapacity}`
                const ocupados = 0;
                const total = tour.maxCapacity;
                const disponibles = Math.max(0, total - ocupados);
                const isAgotado = ocupados >= total;

                return (
                  <TableRow key={tour.id} className="transition-colors hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span
                          className="text-foreground hover:text-primary cursor-pointer text-sm leading-tight font-semibold transition-colors"
                          title={tour.title}
                        >
                          {tour.title}
                        </span>
                        <span className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
                          <Calendar className="text-muted-foreground h-3.5 w-3.5" />
                          {formatTourDateTime(tour.departureDateTime, tour.boardingPoints)}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {tour.transportModality === "TRANSPORT_INCLUDED" ? (
                        <Badge
                          variant="secondary"
                          className="bg-slate-100 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
                        >
                          <Bus className="mr-1 h-3 w-3" /> Con Transporte
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-slate-100 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
                        >
                          <Footprints className="mr-1 h-3 w-3" /> Llegada Independiente
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">
                          {new Intl.NumberFormat("es-MX", {
                            style: "currency",
                            currency: tour.currency || "MXN",
                          }).format(tour.price)}{" "}
                          {tour.currency || "MXN"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-sm font-medium text-slate-700">
                          {ocupados} de {total} lugares
                        </span>
                        {isAgotado ? (
                          <Badge className="pointer-events-none bg-slate-100 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400">
                            Agotado
                          </Badge>
                        ) : (
                          <Badge className="pointer-events-none border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300">
                            {disponibles} disponibles
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      {getStatusBadge(tour.isActive, tour?.temporalStatus)}
                    </TableCell>

                    <TableCell className="text-right">
                      {/* Botones Unificados (Intactos) */}
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="gap-1.5 bg-indigo-600 text-xs font-medium text-white shadow-sm hover:bg-indigo-700"
                          onClick={() => handleShareLink(tour)}
                        >
                          <Share2 className="h-3.5 w-3.5" /> Compartir folleto
                        </Button>

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

                            <DropdownMenuItem
                              className="cursor-pointer"
                              onSelect={(e) => {
                                e.preventDefault();
                                handleToggle(tour.id!, tour.isActive);
                              }}
                            >
                              {tour.isActive ? (
                                <>
                                  <PauseCircle className="mr-2 h-4 w-4 text-amber-600" /> Pausar
                                  Ventas
                                </>
                              ) : (
                                <>
                                  <PlayCircle className="mr-2 h-4 w-4 text-emerald-600" /> Reactivar
                                  Ventas
                                </>
                              )}
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
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Banner Informativo Inferior (Intacto) */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3.5 text-sm text-blue-900">
        <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
        <div>
          <p className="mb-0.5 font-semibold">Folleto Digital Interactivo</p>
          <p className="text-xs leading-relaxed text-blue-800">
            Al compartir este enlace por WhatsApp, tus clientes podrán revisar el itinerario, los
            puntos de abordaje y registrar sus datos para apartar su lugar en 30 segundos.
          </p>
        </div>
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
    </div>
  );
}
