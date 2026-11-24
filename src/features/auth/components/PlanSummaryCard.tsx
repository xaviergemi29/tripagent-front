import { Check, ShieldCheck } from "lucide-react";
import { SUBSCRIPTION_PLAN } from "@/shared/constants/domain.constants";

const PLAN_BENEFITS = [
  "Tours, salidas y pasajeros ilimitados",
  "Croquis interactivo de Sprinter y Autobús",
  "Recibos y estados de cuenta PDF con tu marca",
  "Enlaces únicos de registro para tus viajeros",
  "Manifiesto de abordaje y contactos de emergencia en 1 clic",
];

/** Resumen del plan: $999 MXN hoy y el precio mensual después de la prueba. */
export function PlanSummaryCard() {
  return (
    <section className="space-y-5 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
          Plan Todo Incluido
        </span>
        <span className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
          Prueba {SUBSCRIPTION_PLAN.trialDaysTotal} días
        </span>
      </div>

      <div>
        <p className="flex items-baseline gap-2">
          <span className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            $999 MXN
          </span>
          <span className="text-sm font-semibold text-slate-500">hoy</span>
        </p>
        <p className="mt-1 text-xs font-medium text-slate-600 sm:text-sm">
          Después de {SUBSCRIPTION_PLAN.trialDaysTotal} días: ${SUBSCRIPTION_PLAN.priceMxn} MXN/mes.
          Sin contratos ni cargos automáticos.
        </p>
      </div>

      <div>
        <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Todo lo que incluye tu prueba:
        </p>
        <ul className="mt-3 space-y-2.5">
          {PLAN_BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2.5 text-sm text-slate-700">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-emerald-100/70 p-0.5 text-emerald-600"
                aria-hidden="true"
              />
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
        <ShieldCheck className="h-5 w-5 shrink-0 text-indigo-600" aria-hidden="true" />
        <div>
          <p className="text-xs font-bold text-indigo-950">Programa de Agencias Fundadoras</p>
          <p className="text-xs leading-relaxed text-indigo-800/80">
            Acompañamiento 1 a 1 para configurar tu primer tour con el equipo técnico.
          </p>
        </div>
      </div>
    </section>
  );
}
