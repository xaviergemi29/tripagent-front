import { Check, Lock } from "lucide-react";
import { TERMINOS_PRUEBA } from "../../constants/terminos-content.constants";
import { LegalSection } from "./LegalSection";

/** Punto 02 — Prueba gratuita y suscripción. */
export function SeccionPruebaSuscripcion() {
  return (
    <LegalSection id="prueba" number="02" title={TERMINOS_PRUEBA.title}>
      <p>{TERMINOS_PRUEBA.body}</p>
      <ul className="space-y-2.5">
        {TERMINOS_PRUEBA.bullets.map((bullet) => (
          <li key={bullet.title} className="flex items-start gap-2.5">
            <Check
              className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-emerald-100 p-0.5 text-emerald-700"
              aria-hidden="true"
            />
            <span>
              <span className="font-semibold text-slate-900">{bullet.title}</span> {bullet.text}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
        <div>
          <p className="font-bold text-emerald-900">{TERMINOS_PRUEBA.softLock.title}</p>
          <p className="mt-1 text-emerald-800">{TERMINOS_PRUEBA.softLock.text}</p>
        </div>
      </div>
    </LegalSection>
  );
}
