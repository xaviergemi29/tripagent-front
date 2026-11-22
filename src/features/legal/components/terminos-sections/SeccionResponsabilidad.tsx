import { Bus, FileText, TriangleAlert } from "lucide-react";
import { TERMINOS_OPERACION } from "../../constants/terminos-content.constants";
import { LegalSection } from "./LegalSection";

const CARD_ICONS = [Bus, TriangleAlert, FileText];

/** Punto 04 — Responsabilidad operativa y seguros. */
export function SeccionResponsabilidad() {
  return (
    <LegalSection id="operacion" number="04" title={TERMINOS_OPERACION.title}>
      <p className="rounded-xl border-l-4 border-[#ba1a1a] bg-red-50/60 p-4 text-slate-700">
        {TERMINOS_OPERACION.body}
      </p>
      <div className="grid gap-3 lg:grid-cols-3">
        {TERMINOS_OPERACION.cards.map((card, index) => {
          const Icon = CARD_ICONS[index] ?? FileText;
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
