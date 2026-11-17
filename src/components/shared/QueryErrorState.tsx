"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Estado de "no se pudo cargar" de una consulta (2026-11-16): `/tours`, `/travelers` y el historial
 * del viajero mostraban su estado vacío ("No tienes tours programados") cuando la API fallaba, y el
 * operador podía creer que perdió su información. Úsalo solo cuando la consulta falló **sin datos**
 * (`isError && !data`); si falla una recarga con datos en caché, se siguen mostrando esos datos.
 */
export function QueryErrorState({
  title,
  error,
  onRetry,
  isRetrying = false,
  className,
}: {
  title: string;
  error?: unknown;
  onRetry: () => void;
  isRetrying?: boolean;
  className?: string;
}) {
  const detail =
    error instanceof Error && error.message ? error.message : "Revisa tu conexión a internet.";

  return (
    <div
      role="alert"
      className={cn(
        "flex min-h-[260px] flex-col items-center justify-center gap-4 rounded-2xl border border-red-200 bg-red-50/60 p-8 text-center",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-red-900">{title}</h3>
        <p className="mx-auto max-w-md text-sm text-red-700">
          {detail} Tu información no se perdió: vuelve a intentarlo.
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={onRetry}
        disabled={isRetrying}
        className="border-red-200 bg-white text-red-700 hover:bg-red-50"
      >
        <RotateCcw className={cn("mr-2 h-4 w-4", isRetrying && "animate-spin")} />
        {isRetrying ? "Reintentando…" : "Reintentar"}
      </Button>
    </div>
  );
}
