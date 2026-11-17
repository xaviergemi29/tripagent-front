"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Pantalla de error de una ruta (`app/error.tsx` y `app/(dashboard)/error.tsx`, 2026-11-16):
 * antes un fallo al dibujar mostraba "Application error: a client-side exception has occurred", en
 * inglés y sin salida. `retry` vuelve a pedir y dibujar el segmento (Next 16.3+).
 */
export function RouteErrorFallback({
  error,
  retry,
  homeHref,
  homeLabel,
}: {
  error: unknown;
  retry: () => void;
  /** Enlace secundario (p. ej. volver a /tours en el panel). Sin él solo se ofrece reintentar. */
  homeHref?: string;
  homeLabel?: string;
}) {
  useEffect(() => {
    // Sin servicio de monitoreo: queda en la consola. `digest` cruza con los logs del servidor.
    console.error(error);
  }, [error]);

  const digest =
    error instanceof Error && "digest" in error && typeof error.digest === "string"
      ? error.digest
      : null;

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">Algo salió mal</h2>
          <p className="text-sm leading-relaxed text-slate-500">
            No pudimos mostrar esta pantalla. Inténtalo de nuevo; si el problema continúa, recarga
            la página o contacta a soporte.
          </p>
          {digest && <p className="font-mono text-[11px] text-slate-400">Referencia: {digest}</p>}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            type="button"
            onClick={() => retry()}
            className="bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Reintentar
          </Button>
          {homeHref && (
            <Button asChild variant="outline">
              <Link href={homeHref}>{homeLabel ?? "Volver"}</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
