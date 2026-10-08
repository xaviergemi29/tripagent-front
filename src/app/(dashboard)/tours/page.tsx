"use client";

import { useRouter } from "next/navigation";
import { Plus, Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TourListTable } from "@/features/tours/components/TourListTable";
import { useTours } from "@/features/tours/hooks/useTours";

export default function ToursPage() {
  const router = useRouter();
  const { data: tours = [], isLoading } = useTours();

  const hasTours = tours.length > 0;

  return (
    <main className="container mx-auto space-y-6 px-4 py-8">
      {/* 1. Cabecera Principal + Botón de Acción Superior */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-semibold tracking-wider text-indigo-600 uppercase">
            GESTIÓN DE CATÁLOGO
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tours y Operaciones</h1>
          <p className="mt-1 text-sm text-slate-500">
            Revisa tus viajes programados y comparte el enlace de registro con tus viajeros.
          </p>
        </div>

        <Button
          onClick={() => router.push("/tours/new")}
          className="h-10 self-start rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:self-auto"
        >
          <Plus className="mr-2 h-4 w-4 stroke-[2.5]" />
          <span>Crear Nuevo Tour</span>
        </Button>
      </div>

      {/* 2. Renderizado Condicional: Tabla vs Empty State Principal */}
      {!isLoading && !hasTours ? (
        <div className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Compass className="h-7 w-7 stroke-[1.75]" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-slate-900">No tienes tours programados</h3>
          <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-slate-500">
            Crea tu primera salida para comenzar a gestionar fechas, cupos y reservaciones.
          </p>
          <Button
            onClick={() => router.push("/tours/new")}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Crear Nuevo Tour</span>
          </Button>
        </div>
      ) : (
        <TourListTable tours={tours} isLoading={isLoading} />
      )}
    </main>
  );
}
