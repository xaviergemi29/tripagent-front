import { EyeOff, ShieldCheck } from "lucide-react";
import { TERMINOS_PROPIEDAD } from "../../constants/terminos-content.constants";
import { LegalSection } from "./LegalSection";

const CARD_ICONS = [EyeOff, ShieldCheck];

/** Punto 03 — Propiedad y confidencialidad de datos (LFPDPPP). */
export function SeccionPropiedadDatos() {
  return (
    <LegalSection id="propiedad" number="03" title={TERMINOS_PROPIEDAD.title}>
      <p>{TERMINOS_PROPIEDAD.body}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {TERMINOS_PROPIEDAD.cards.map((card, index) => {
          const Icon = CARD_ICONS[index] ?? ShieldCheck;
          return (
            <div key={card.title} className="rounded-xl border border-slate-200/80 bg-slate-50 p-4">
              <Icon className="h-5 w-5 text-[#3525cd]" aria-hidden="true" />
              <p className="mt-2 font-bold text-slate-900">{card.title}</p>
              <p className="mt-1">{card.text}</p>
            </div>
          );
        })}
      </div>
    </LegalSection>
  );
}
