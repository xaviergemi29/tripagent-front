import { TERMINOS_NATURALEZA } from "../../constants/terminos-content.constants";
import { LegalSection } from "./LegalSection";

/** Punto 01 — Naturaleza del servicio. */
export function SeccionNaturaleza() {
  return (
    <LegalSection id="naturaleza" number="01" title={TERMINOS_NATURALEZA.title}>
      <p>{TERMINOS_NATURALEZA.body}</p>
      <div className="rounded-xl border-l-4 border-[#3525cd] bg-indigo-50/60 p-4 text-slate-700">
        <span className="font-bold text-slate-900">Delimitación fundamental: </span>
        {TERMINOS_NATURALEZA.delimitation}
      </div>
    </LegalSection>
  );
}
