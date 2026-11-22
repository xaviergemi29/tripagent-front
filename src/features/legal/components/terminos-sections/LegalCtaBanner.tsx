import Link from "next/link";
import { SUBSCRIPTION_PLAN } from "@/shared/constants/domain.constants";

/** Cierre: invitación a crear la cuenta. */
export function LegalCtaBanner() {
  return (
    <div className="rounded-2xl border border-[#3525cd]/15 bg-gradient-to-br from-[#3525cd]/10 via-white to-emerald-50 p-6 text-center sm:p-8 sm:text-left">
      <span className="inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-bold tracking-wider text-emerald-700 uppercase shadow-xs">
        Sin contratos forzosos ni riesgos
      </span>
      <h2 className="mt-3 text-xl font-extrabold text-slate-900 sm:text-2xl">
        ¿Listo para gestionar tus tours con certeza?
      </h2>
      <p className="mt-1.5 text-sm text-slate-600">
        Comienza en menos de 2 minutos. No requieres ingresar tarjeta de crédito.
      </p>
      <Link
        href="/registro?plan=todo-incluido"
        className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#3525cd] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#2b1cb8] sm:w-auto"
      >
        Crear mi cuenta gratis ({SUBSCRIPTION_PLAN.trialDaysTotal} días) →
      </Link>
    </div>
  );
}
