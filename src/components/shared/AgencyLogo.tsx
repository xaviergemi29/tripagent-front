"use client";

import { useState } from "react";
import { Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildApiPublicFileUrl } from "@/shared/utils/share-links.util";

interface AgencyLogoProps {
  /** Ruta guardada en la API (`/uploads/logos/…`) o null si la agencia no ha subido logotipo. */
  logoPath?: string | null;
  agencyName: string;
  /** Tamaño y forma del recuadro (se aplica con o sin logo), p. ej. `h-9 w-9 rounded-xl`. */
  className?: string;
  /** Estilo del recuadro cuando hay logo (fondo claro para que se vea sobre cualquier color). */
  logoClassName?: string;
  /** Estilo del recuadro de respaldo (ícono de brújula) cuando no hay logo o no carga. */
  fallbackClassName?: string;
  iconClassName?: string;
}

/**
 * Logotipo de la agencia (Sidebar y vistas del Magic Link). Si la agencia no tiene logo o el
 * archivo no carga, muestra el ícono de brújula de siempre. Es un componente cliente (maneja el
 * error de carga), pero solo recibe props serializables, así que también se usa desde Server
 * Components como `PaidBookingView`.
 */
export function AgencyLogo({
  logoPath,
  agencyName,
  className,
  logoClassName = "border border-slate-200 bg-white p-0.5",
  fallbackClassName = "bg-indigo-600 text-white",
  iconClassName = "h-5 w-5",
}: AgencyLogoProps) {
  const src = logoPath ? buildApiPublicFileUrl(logoPath) : null;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (src && failedSrc !== src) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden",
          className,
          logoClassName,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- archivo servido por la API (otro origen) */}
        <img
          src={src}
          alt={`Logotipo de ${agencyName}`}
          className="h-full w-full object-contain"
          onError={() => setFailedSrc(src)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn("flex shrink-0 items-center justify-center", className, fallbackClassName)}
      aria-hidden
    >
      <Compass className={iconClassName} />
    </div>
  );
}
