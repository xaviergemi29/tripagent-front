import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TripAgentBrand } from "@/components/shared/TripAgentBrand";

/** Barra superior sin distracciones (sin menús ni avatar): marca y acceso a "Inicia sesión". */
export function RegisterAgencyHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white">
      {/* Escritorio */}
      <div className="hidden items-center justify-between px-6 py-3.5 sm:px-8 lg:flex">
        <Link href="/" aria-label="TripAgent, inicio">
          <TripAgentBrand subtitle="Control de Tours México" />
        </Link>
        <p>
          <span className="mr-1.5 text-sm text-slate-500">¿Ya tienes cuenta?</span>
          <Link
            href="/login"
            className="text-sm font-bold text-slate-900 transition-colors hover:text-indigo-600"
          >
            Inicia sesión
          </Link>
        </p>
      </div>

      {/* Celular: sin subtítulo para que nada se corte en 360 px */}
      <div className="flex items-center justify-between gap-2 py-3 pr-4 pl-2 lg:hidden">
        <div className="flex min-w-0 items-center gap-1">
          <Link
            href="/"
            aria-label="Volver al inicio"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <TripAgentBrand />
        </div>
        <Link
          href="/login"
          className="shrink-0 text-sm font-bold text-slate-900 transition-colors hover:text-indigo-600"
        >
          Inicia sesión
        </Link>
      </div>
    </header>
  );
}
