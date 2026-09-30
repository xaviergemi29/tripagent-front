"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface SeatMapPreviewProps {
  template: { name: string; layoutMap: (string | null)[][] };
  onInstall?: () => void;
  isInstalling?: boolean;
}

export function SeatMapPreviewDialog({ template, onInstall, isInstalling }: SeatMapPreviewProps) {
  const colsCount = template.layoutMap[0]?.length || 5;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-indigo-600 hover:bg-indigo-50"
          title="Ver plano"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Distribución: {template.name}</DialogTitle>
        </DialogHeader>

        <div className="mt-2 flex max-h-[60vh] flex-col items-center overflow-y-auto rounded-2xl border bg-slate-100 p-6">
          {/* Frente del Vehículo */}
          <div className="mb-6 flex w-full max-w-[280px] justify-between border-b-2 border-dashed border-slate-300 px-6 pb-4 text-xs font-bold text-slate-400 uppercase">
            <span>💺 Volante</span>
            <span>🚪 Puerta</span>
          </div>

          {/* Renderizado de Matriz */}
          <div
            className="relative grid w-full max-w-[280px] gap-3"
            style={{ gridTemplateColumns: `repeat(${colsCount}, minmax(0, 1fr))` }}
          >
            {/* 🚀 LÍNEA DE PASILLO VISUAL: Solo decorativa de fondo */}
            <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 -ml-5 flex w-10 items-center justify-center rounded-full bg-slate-200/50">
              <span className="rotate-90 text-[10px] font-bold tracking-widest whitespace-nowrap text-slate-400/70 uppercase">
                Pasillo Central
              </span>
            </div>

            {template.layoutMap.flat().map((seat, index) => {
              const isAisle = seat === "AISLE" || seat === null;

              return isAisle ? (
                // El pasillo ahora tiene z-index bajo para dejar ver la etiqueta central
                <div key={`aisle-${index}`} className="z-0 h-10 w-full" />
              ) : (
                <div
                  key={`seat-${seat}`}
                  className="relative z-10 flex h-10 w-full cursor-default items-center justify-center rounded-lg border-2 border-slate-300 bg-white text-xs font-bold text-slate-700 shadow-sm transition-colors hover:border-indigo-400"
                >
                  {seat}
                </div>
              );
            })}
          </div>
        </div>

        {/* 🚀 FOOTER CONDICIONAL: Solo aparece si le pasamos onInstall */}
        {onInstall && (
          <DialogFooter className="mt-2 sm:justify-between">
            <p className="py-2 text-xs text-slate-500">
              Verifica la distribución antes de asignarla a tus tours.
            </p>
            <Button
              onClick={onInstall}
              disabled={isInstalling}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isInstalling ? (
                "Instalando..."
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Instalar Plantilla
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
