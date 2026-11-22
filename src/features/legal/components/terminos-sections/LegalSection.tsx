import type { ReactNode } from "react";
import type { TerminosSectionId } from "../../constants/terminos-content.constants";

interface LegalSectionProps {
  id: TerminosSectionId;
  /** "Punto 01". */
  number: string;
  title: string;
  children: ReactNode;
}

/**
 * Tarjeta de una sección con su ancla. `scroll-mt` compensa el encabezado fijo (y, en celular, la
 * barra de píldoras) al navegar desde el índice.
 */
export function LegalSection({ id, number, title, children }: LegalSectionProps) {
  return (
    <section
      id={id}
      data-legal-section={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-36 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7 md:scroll-mt-24"
    >
      <p className="text-[11px] font-bold tracking-wider text-[#3525cd] uppercase">
        Punto {number}
      </p>
      <h2 id={`${id}-title`} className="mt-1 text-lg font-extrabold text-slate-900 sm:text-xl">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}
