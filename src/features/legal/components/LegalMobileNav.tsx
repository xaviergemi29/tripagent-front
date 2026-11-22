import { cn } from "@/lib/utils";
import { TERMINOS_SECTIONS, type TerminosSectionId } from "../constants/terminos-content.constants";

interface LegalMobileNavProps {
  activeId: TerminosSectionId;
  onNavigate: (id: TerminosSectionId) => void;
}

/** Píldoras deslizables de navegación rápida (celular, abajo de `md`). */
export function LegalMobileNav({ activeId, onNavigate }: LegalMobileNavProps) {
  return (
    <nav
      aria-label="Contenido"
      className="sticky top-[61px] z-30 -mx-4 mb-4 bg-[#faf8ff]/95 px-4 py-2 backdrop-blur md:hidden"
    >
      <div className="flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
        {TERMINOS_SECTIONS.map((section) => {
          const isActive = section.id === activeId;
          return (
            <button
              key={section.id}
              type="button"
              aria-current={isActive ? "true" : undefined}
              onClick={() => onNavigate(section.id)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors",
                isActive
                  ? "bg-[#3525cd] text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600",
              )}
            >
              {section.short}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
