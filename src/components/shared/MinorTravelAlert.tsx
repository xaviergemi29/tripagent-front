import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Aviso de reserva con menores (feedback del PM, 2026-11-23), con la obligación del Art. 58,
 * fracción X Ter, de la Ley General de Turismo (DOF 13-11-2026): el prestador debe pedir al adulto
 * que acompaña al menor que acredite el vínculo antes del servicio y, si no, negarlo.
 * Único texto: Magic Link, enlace del coordinador y lista de abordaje impresa.
 */
export const MINOR_TRAVEL_NOTICE_TITLE = "Reserva con menor de edad";
export const MINOR_TRAVEL_NOTICE_TEXT =
  "Conforme al Art. 58, fracción X Ter, de la Ley General de Turismo, el adulto que acompaña al menor deberá acreditar con documentos oficiales el parentesco, la patria potestad, la tutela o la guarda y custodia antes de iniciar el servicio. Sin esa acreditación, el servicio deberá negarse.";

/** Server-safe (sin hooks): también se usa en la lista de abordaje imprimible. */
export function MinorTravelAlert({ className }: { className?: string }) {
  return (
    <div
      role="note"
      aria-label={MINOR_TRAVEL_NOTICE_TITLE}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-amber-950 print:border-black print:bg-white print:text-black",
        className,
      )}
    >
      <AlertTriangle
        className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 print:text-black"
        aria-hidden="true"
      />
      <p className="text-xs leading-relaxed sm:text-sm">
        <strong className="font-semibold">⚠️ {MINOR_TRAVEL_NOTICE_TITLE}:</strong>{" "}
        {MINOR_TRAVEL_NOTICE_TEXT}
      </p>
    </div>
  );
}

/** Etiqueta compacta "Menor" junto al nombre de un pasajero menor de edad. */
export function MinorBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 print:border-black print:bg-white print:text-black",
        className,
      )}
    >
      Menor
    </span>
  );
}
