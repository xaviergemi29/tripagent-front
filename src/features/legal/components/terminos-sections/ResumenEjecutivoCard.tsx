import { Zap } from "lucide-react";
import { TERMINOS_EXECUTIVE_SUMMARY } from "../../constants/terminos-content.constants";

/** Resumen ejecutivo (lectura en 20 segundos). */
export function ResumenEjecutivoCard() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#3525cd]/20 bg-[#3525cd]/5 p-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3525cd] text-white">
        <Zap className="h-4 w-4" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs font-bold tracking-wider text-[#3525cd] uppercase">
          Resumen ejecutivo · Lectura en 20 segundos
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
          {TERMINOS_EXECUTIVE_SUMMARY}
        </p>
      </div>
    </div>
  );
}
