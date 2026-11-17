"use client";

import { useState } from "react";
import { Clock, CloudOff, Pause, RotateCw, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QueryErrorStateProps {
  /**
   * Recurso que no se pudo cargar, para el título: "tours", "viajeros", "suscripción"…
   * Sin él: "No pudimos cargar esta información".
   */
  resourceName?: string;
  /**
   * Palabra antes del recurso en el título (concordancia en español): "tus" (por defecto),
   * "tu", "el", "los", "la", "las"… Ej.: `resourceArticle="tu" resourceName="suscripción"`.
   */
  resourceArticle?: string;
  /** Título completo que reemplaza la regla anterior. */
  title?: string;
  /** Mensaje que reemplaza el texto tranquilizador por defecto. */
  description?: string;
  /** Reintenta la consulta (normalmente `refetch` de React Query). Sin él no hay botón. */
  onRetry?: () => void | Promise<unknown>;
  /** Reintento en curso (spinner en el botón). Si se omite, el componente lo lleva solo. */
  isRetrying?: boolean;
  className?: string;
  /** "full": área principal de una pantalla. "compact": dentro de modales, drawers o secciones. */
  variant?: "full" | "compact";
}

/**
 * Estado de "no se pudo cargar" de una consulta (2026-11-17). Lo usan todas las pantallas cuyo
 * `useQuery` falla **sin datos** (`isError && !data`), ver `CLAUDE.md`.
 *
 * Copy en español de México sin tecnicismos (nada de "Network Error", "servidor" ni "API"): calma
 * y respaldo de la información. Por eso no recibe ni muestra el error técnico.
 */
export function QueryErrorState({
  resourceName,
  resourceArticle = "tus",
  title,
  description,
  onRetry,
  isRetrying: externalIsRetrying,
  className,
  variant = "full",
}: QueryErrorStateProps) {
  const [internalIsRetrying, setInternalIsRetrying] = useState(false);
  const isRetrying = externalIsRetrying ?? internalIsRetrying;
  const isCompact = variant === "compact";

  const handleRetry = async (): Promise<void> => {
    if (!onRetry || isRetrying) return;
    try {
      setInternalIsRetrying(true);
      await onRetry();
    } finally {
      setInternalIsRetrying(false);
    }
  };

  const heading =
    title ??
    (resourceName ? (
      <>
        No pudimos cargar {resourceArticle}{" "}
        <span className="font-extrabold text-indigo-600">{resourceName}</span>
      </>
    ) : (
      "No pudimos cargar esta información"
    ));

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex w-full flex-col items-center justify-center text-center",
        isCompact
          ? "rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-8"
          : "min-h-[460px] rounded-3xl border border-slate-100 bg-white px-6 py-14 shadow-sm",
        className,
      )}
    >
      {/* Ícono con halo que "respira" y una pausa: el proceso solo está en espera. */}
      <div className="relative mb-2">
        <div
          className={cn(
            "motion-safe:animate-soft-pulse flex items-center justify-center rounded-full border border-indigo-100/60 bg-indigo-50",
            isCompact ? "h-16 w-16" : "h-20 w-20",
          )}
        >
          <CloudOff
            aria-hidden="true"
            className={cn("stroke-[1.75] text-indigo-600", isCompact ? "h-7 w-7" : "h-9 w-9")}
          />
        </div>
        <div className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-amber-500 text-white shadow-xs">
          <Pause aria-hidden="true" className="h-3 w-3 fill-white" />
        </div>
      </div>

      <h3
        className={cn(
          "mt-4 font-bold tracking-tight text-slate-900",
          isCompact ? "text-lg" : "text-xl sm:text-2xl",
        )}
      >
        {heading}
      </h3>

      <p className="mt-2.5 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
        {description ?? (
          <>
            Tuvimos un problema para mostrar esta información en este momento.{" "}
            <span className="font-semibold text-slate-800">¡No te preocupes!</span> Todo lo que has
            guardado sigue intacto y seguro en tu cuenta.
          </>
        )}
      </p>

      <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-slate-100/80 px-3 py-1 text-xs text-slate-600">
        <Clock aria-hidden="true" className="h-3.5 w-3.5 text-slate-400" />
        <span>Espera unos momentos y vuelve a intentarlo.</span>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying}
          className="mt-6 flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-75"
        >
          <RotateCw aria-hidden="true" className={cn("h-4 w-4", isRetrying && "animate-spin")} />
          <span>{isRetrying ? "Volviendo a intentar..." : "Volver a intentar"}</span>
        </button>
      )}

      <div
        className={cn(
          "flex items-center gap-1.5 border-t border-slate-100 pt-4 text-xs text-slate-400",
          isCompact ? "mt-6" : "mt-8",
        )}
      >
        <ShieldCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-emerald-600" />
        <span>Tus registros están respaldados y protegidos en tu cuenta.</span>
      </div>
    </div>
  );
}
