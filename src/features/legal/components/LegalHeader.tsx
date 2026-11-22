"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TripAgentBrand } from "@/components/shared/TripAgentBrand";
import { cn } from "@/lib/utils";
import { SUPPORT_EMAIL } from "@/lib/support-config";

const REGISTER_HREF = "/registro?plan=todo-incluido";

interface LegalHeaderProps {
  /** Página legal actual (resalta su enlace en la navegación). */
  active: "terminos" | "privacidad" | "contacto";
}

/** Encabezado compartido por /terminos, /privacidad y /contacto (sin avatar ni menú de usuario). */
export function LegalHeader({ active }: LegalHeaderProps) {
  const router = useRouter();

  // Si se llegó desde /registro, «Volver» regresa a esa misma página (con lo que ya escribió).
  const handleBack = () => {
    const cameFromRegister =
      typeof document !== "undefined" && document.referrer.includes("/registro");
    if (cameFromRegister && window.history.length > 1) router.back();
    else router.push(REGISTER_HREF);
  };

  const navLinkClass = (isActive: boolean) =>
    cn(
      "text-sm transition-colors",
      isActive ? "font-semibold text-[#3525cd]" : "text-slate-600 hover:text-slate-900",
    );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="TripAgent, inicio" className="min-w-0">
          <TripAgentBrand subtitle="Términos y Legalidad" />
        </Link>

        <nav aria-label="Páginas legales" className="hidden items-center gap-6 md:flex">
          <Link href="/terminos" className={navLinkClass(active === "terminos")}>
            Términos de Servicio
          </Link>
          <Link href="/privacidad" className={navLinkClass(active === "privacidad")}>
            Privacidad
          </Link>
          <a href={`mailto:${SUPPORT_EMAIL}`} className={navLinkClass(active === "contacto")}>
            Soporte y Contacto
          </a>
        </nav>

        <button
          type="button"
          onClick={handleBack}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Volver al registro</span>
          <span className="sm:hidden">Volver</span>
        </button>
      </div>
    </header>
  );
}
