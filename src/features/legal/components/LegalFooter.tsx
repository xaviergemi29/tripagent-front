import Link from "next/link";
import { SUPPORT_EMAIL } from "@/lib/support-config";

/** Pie mínimo de las páginas legales: horizontal en escritorio, apilado en celular. */
export function LegalFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-center text-xs text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between md:text-left">
        <p>© 2026 TripAgent · Hecho para agencias de viajes en México</p>
        <div className="flex flex-col items-center gap-3 md:flex-row md:gap-2">
          <Link href="/privacidad" className="hover:text-slate-900 hover:underline">
            Aviso de Privacidad
          </Link>
          <span className="hidden text-slate-300 md:inline" aria-hidden="true">
            ·
          </span>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-slate-900 hover:underline">
            Contacto
          </a>
          <span className="hidden text-slate-300 md:inline" aria-hidden="true">
            ·
          </span>
          <Link
            href="/registro?plan=todo-incluido"
            className="font-semibold text-[#3525cd] hover:underline"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </div>
    </footer>
  );
}
