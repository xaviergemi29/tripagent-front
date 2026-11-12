import Link from "next/link";
import {
  LayoutGrid,
  Share2,
  MapPin,
  Globe,
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/shared/utils/currency.util";
import { formatSpanishLongDate } from "@/shared/utils/tour-date.util";
import type { TourOutput } from "../../schemas/tour.schema";
import { handleShareLink } from "@/shared/utils/clipboard";
import { DEFAULT_CURRENCY } from "@/shared/constants/domain.constants";

interface TourMobileCardListProps {
  tours: TourOutput[];
  onDeleteRequest: (id: string) => void;
}

export function TourMobileCardList({ tours, onDeleteRequest }: TourMobileCardListProps) {
  return (
    <div className="flex flex-col gap-4">
      {tours.map((tour) => {
        const isInternational = tour.destinationType === "INTERNATIONAL" || tour.currency === "USD";
        const occupied = tour.currentOccupancy || 0;
        const total = tour.sellableCapacity ?? tour.maxCapacity;
        const progress = total > 0 ? (occupied / total) * 100 : 0;

        return (
          <div key={tour.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            {/* Header: Titulo y Opciones */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{tour.title}</h3>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatSpanishLongDate(tour.departureDateTime)}
                </p>
              </div>

              {/* DropdownMenu Contextual */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-slate-500">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/tours/${tour.id}/edit`}>
                      <Pencil className="mr-2 h-4 w-4" /> Editar Tour
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive focus:bg-red-50"
                    onClick={() => onDeleteRequest(tour.id!)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar Salida
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Badges de Modalidad y Destino */}
            <div className="mt-3 flex gap-2">
              {!isInternational ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <MapPin className="h-3 w-3" /> Nacional
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200/60 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                  <Globe className="h-3 w-3" /> Internacional
                </span>
              )}
            </div>

            {/* Grid de Métricas */}
            <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-3">
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                  Precio Pax
                </p>
                <p className="mt-0.5 text-sm font-bold text-slate-900">
                  {formatCurrency(tour.price, { currency: tour.currency || DEFAULT_CURRENCY })}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                    Lugares
                  </p>
                  <span className="text-[10px] font-bold text-slate-700">
                    {occupied}/{total}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full bg-indigo-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            {/* Acciones Inferiores Táctiles */}
            <div className="mt-4 flex gap-2">
              <Button
                asChild
                variant="outline"
                className="flex-1 border-indigo-200 bg-indigo-50/80 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                <Link href={`/tours/${tour.id}`}>
                  <LayoutGrid className="mr-2 h-4 w-4" /> Centro de Control
                </Link>
              </Button>
              <Button
                onClick={() => handleShareLink(tour)}
                size="icon"
                aria-label="Compartir folleto digital"
                className="shrink-0 bg-indigo-600 hover:bg-indigo-700"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
