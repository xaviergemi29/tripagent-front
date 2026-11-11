import Link from "next/link";
import {
  Calendar,
  MapPin,
  Globe,
  Share2,
  MoreHorizontal,
  LayoutDashboard,
  Edit,
  Trash2,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { TourOutput } from "../schemas/tour.schema";
import { formatTourDateTime } from "@/shared/utils/tour-date.util";
import { formatCurrency } from "@/shared/utils/currency.util";
import { handleShareLink } from "@/shared/utils/clipboard";

interface TourDesktopTableProps {
  tours: TourOutput[];
  onDeleteRequest: (id: string) => void;
}

const getStatusBadge = (isActive: boolean, temporalStatus?: string) => {
  if (!isActive) {
    return (
      <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
        Pausado
      </Badge>
    );
  }
  switch (temporalStatus) {
    case "EN_CURSO":
      return (
        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
          En Curso
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

export function TourDesktopTable({ tours, onDeleteRequest }: TourDesktopTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50">
            <TableHead className="text-muted-foreground w-[280px] text-xs font-semibold tracking-wider uppercase">
              Tour y Fecha de Salida
            </TableHead>
            <TableHead className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Destino
            </TableHead>
            <TableHead className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Precio / Pax
            </TableHead>
            <TableHead className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Cupos
            </TableHead>
            <TableHead className="text-muted-foreground text-center text-xs font-semibold tracking-wider uppercase">
              Estado
            </TableHead>
            <TableHead className="text-muted-foreground text-right text-xs font-semibold tracking-wider uppercase">
              Acciones Operativas
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tours.map((tour) => {
            const occupiedSeats = tour.currentOccupancy || 0;
            const totalCapacity = tour.maxCapacity;
            const availableSeats = Math.max(0, totalCapacity - occupiedSeats);
            const isSoldOut = occupiedSeats >= totalCapacity;
            const availablePercentage =
              totalCapacity > 0 ? (availableSeats / totalCapacity) * 100 : 0;

            let badgeStyle = "border-emerald-200 bg-emerald-50 text-emerald-700";
            let badgeText = `${availableSeats} Disponibles`;
            if (isSoldOut) {
              badgeStyle = "border-red-200 bg-red-50 text-red-700";
              badgeText = "Agotado";
            } else if (availablePercentage <= 20) {
              badgeStyle = "border-amber-200 bg-amber-50 text-amber-700";
            }

            const isInternational =
              tour.destinationType === "INTERNATIONAL" || tour.currency === "USD";

            return (
              <TableRow key={tour.id} className="transition-colors hover:bg-slate-50/50">
                {/* 1. TOUR Y FECHA */}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-foreground hover:text-primary cursor-pointer text-sm leading-tight font-semibold transition-colors">
                      {tour.title}
                    </span>
                    <span className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
                      <Calendar className="text-muted-foreground h-3.5 w-3.5" />
                      {formatTourDateTime(tour.departureDateTime, tour.boardingPoints)}
                    </span>
                  </div>
                </TableCell>

                {/* 2. DESTINO (NUEVO) */}
                <TableCell>
                  {!isInternational ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                      <MapPin className="h-3 w-3" /> Nacional
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200/60 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                      <Globe className="h-3 w-3" /> Internacional
                    </span>
                  )}
                </TableCell>

                {/* 3. PRECIO */}
                <TableCell>
                  <span className="text-sm font-bold text-slate-900">
                    {formatCurrency(tour.price, { currency: tour.currency || "MXN" })}
                  </span>
                </TableCell>

                {/* 4. LUGARES (CUPOS) */}
                <TableCell>
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-sm font-medium text-slate-700">
                      <strong>
                        {occupiedSeats} / {totalCapacity}
                      </strong>{" "}
                      Ocupados
                    </span>
                    <Badge
                      variant="outline"
                      className={`pointer-events-none text-[10px] font-medium ${badgeStyle}`}
                    >
                      {badgeText}
                    </Badge>
                  </div>
                </TableCell>

                {/* 5. ESTADO TEMPORAL */}
                <TableCell className="text-center">
                  {getStatusBadge(tour.isActive, tour?.temporalStatus)}
                </TableCell>

                {/* 6. ACCIONES (NUEVO DISEÑO) */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* Botón Primario: Centro de Control */}
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-8 border-indigo-200 bg-indigo-50/80 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                    >
                      <Link href={`/tours/${tour.id}`}>
                        <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" /> Panel de Control
                      </Link>
                    </Button>

                    {/* Botón Compartir */}
                    <Button
                      variant="default"
                      size="icon"
                      className="h-8 w-8 bg-indigo-600 shadow-sm hover:bg-indigo-700"
                      onClick={() => handleShareLink(tour)}
                      title="Compartir folleto digital"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </Button>

                    {/* Dropdown Menu (Más opciones) */}
                    <DropdownMenu>
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg border border-slate-200/80 bg-white shadow-xs transition-colors hover:border-slate-300 hover:bg-slate-100"
                              >
                                <MoreHorizontal className="h-4 w-4 text-slate-500" />
                              </Button>
                            </DropdownMenuTrigger>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white"
                          >
                            Opciones del tour
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="text-xs tracking-wider text-slate-500 uppercase">
                          Gestión
                        </DropdownMenuLabel>
                        <DropdownMenuItem asChild className="cursor-pointer">
                          <Link href={`/tours/${tour.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4 text-slate-500" /> Editar Tour
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive cursor-pointer focus:bg-red-50"
                          onSelect={(e) => {
                            e.preventDefault();
                            onDeleteRequest(tour.id!);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar Tour
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
