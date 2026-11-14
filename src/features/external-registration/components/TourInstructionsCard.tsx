import { ClipboardList } from "lucide-react";

interface TourInstructionsCardProps {
  /** Instrucciones Post-Pago del tour (texto libre del formulario). Vacías o nulas → no se muestra. */
  instructions?: string | null;
}

/**
 * Indicaciones de logística del tour en el Magic Link ("Llevar botas de montaña").
 * Son distintas de las políticas generales de la agencia (reglas legales), que solo se imprimen
 * en el estado de cuenta PDF. Respeta los saltos de línea que capturó la agencia.
 * Componente de presentación: sin hooks, funciona en Server y Client Components.
 */
export function TourInstructionsCard({ instructions }: TourInstructionsCardProps) {
  const text = instructions?.trim();
  if (!text) return null;

  return (
    <section
      aria-labelledby="tour-instructions-title"
      className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 pl-5 shadow-sm"
    >
      <span className="absolute inset-y-0 left-0 w-1 bg-indigo-600" aria-hidden />
      <div className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
        <h2
          id="tour-instructions-title"
          className="text-xs font-bold tracking-wider text-slate-800 uppercase"
        >
          Indicaciones para tu viaje
        </h2>
      </div>
      <p className="mt-0.5 text-xs text-slate-500">
        Lo que necesitas saber y llevar el día de la salida
      </p>
      <p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-relaxed whitespace-pre-line text-slate-700">
        {text}
      </p>
    </section>
  );
}
