import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TERMINOS_SECTIONS, type TerminosSectionId } from "../constants/terminos-content.constants";
import { LegalSupportCard } from "./LegalSupportCard";

interface LegalStickyNavProps {
  activeId: TerminosSectionId;
  onNavigate: (id: TerminosSectionId) => void;
}

/** Índice lateral fijo (escritorio, desde `md`) + tarjeta de dudas legales. */
export function LegalStickyNav({ activeId, onNavigate }: LegalStickyNavProps) {
  return (
    <aside className="sticky top-24 hidden space-y-4 md:block">
      <nav
        aria-label="Contenido"
        className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm"
      >
        <p className="px-3 pt-1 pb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Contenido
        </p>
        <ul className="space-y-1">
          {TERMINOS_SECTIONS.map((section) => {
            const isActive = section.id === activeId;
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={isActive ? "true" : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    onNavigate(section.id);
                  }}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-xl border-l-4 px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "border-[#3525cd] bg-indigo-50 font-semibold text-[#3525cd]"
                      : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  {section.title}
                  <ChevronRight className="h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      <LegalSupportCard />
    </aside>
  );
}
