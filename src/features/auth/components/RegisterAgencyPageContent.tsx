import Link from "next/link";
import { RegisterAgencyHeader } from "./RegisterAgencyHeader";
import { RegisterAgencyForm } from "./RegisterAgencyForm";
import { PlanSummaryCard } from "./PlanSummaryCard";
import { TrustAndSupportCard } from "./TrustAndSupportCard";

interface RegisterAgencyPageContentProps {
  plan: string;
}

/**
 * Página /registro: formulario primero (en celular también, para convertir de inmediato) y, a la
 * derecha en escritorio (7/5 columnas), el plan y las garantías.
 */
export function RegisterAgencyPageContent({ plan }: RegisterAgencyPageContentProps) {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-slate-50/70">
      <RegisterAgencyHeader />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex items-center justify-between gap-2 pb-4 sm:pb-6">
          <span className="hidden text-xs font-medium text-slate-400 sm:inline">
            TripAgent MX / Registro de Nueva Agencia
          </span>
          <span className="truncate text-[11px] font-semibold tracking-wider text-slate-400 uppercase sm:hidden">
            • Registro de Nueva Agencia
          </span>

          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-indigo-200/60 bg-indigo-50/80 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 sm:px-3 sm:py-1 sm:text-xs">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            <span className="sm:hidden">Asistencia directa</span>
            <span className="hidden sm:inline">Asistencia directa por WhatsApp</span>
          </span>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <RegisterAgencyForm plan={plan} />
          </div>
          <div className="space-y-4 lg:col-span-5">
            <PlanSummaryCard />
            <TrustAndSupportCard />
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-slate-200/50 py-6 text-center text-xs text-slate-400">
        <p>© 2026 TripAgent · Hecho para agencias de viajes en México</p>
        <div className="mt-2 flex justify-center gap-4">
          <Link href="/privacidad" className="hover:underline">
            Privacidad
          </Link>
          <Link href="/terminos" className="hover:underline">
            Términos
          </Link>
          <Link href="/contacto" className="hover:underline">
            Contacto
          </Link>
        </div>
      </footer>
    </div>
  );
}
