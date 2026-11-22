import { Compass } from "lucide-react";

interface TripAgentBrandProps {
  /** Subtítulo bajo el nombre ("Control de Tours México", "Términos y Legalidad"…). */
  subtitle?: string;
}

/** Marca de TripAgent para las páginas públicas propias (registro y páginas legales). */
export function TripAgentBrand({ subtitle }: TripAgentBrandProps) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#4f46e5] text-white shadow-sm">
        <Compass className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="text-base font-extrabold tracking-tight text-slate-900">TripAgent</span>
          <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
            MX
          </span>
        </div>
        {subtitle && <p className="text-[11px] font-medium text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}
