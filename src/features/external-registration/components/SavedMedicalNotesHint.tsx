import { ShieldCheck } from "lucide-react";

interface SavedMedicalNotesHintProps {
  id: string;
  agencyName?: string;
}

/**
 * Aviso bajo "Notas médicas" cuando el WhatsApp coincide con un viajero que ya existía. La búsqueda
 * pública no devuelve las notas médicas (LFPDPPP, regla 3 / 2026-11-15), así que el campo aparece
 * vacío aunque haya notas guardadas; sin este aviso el viajero cree que se perdieron. El registro
 * solo completa campos vacíos (`fillEmptyTravelerFields` en la API): lo escrito aquí se guarda solo si
 * no había notas, por eso para cambiarlas se remite a la agencia.
 */
export function SavedMedicalNotesHint({ id, agencyName }: SavedMedicalNotesHintProps) {
  return (
    <p id={id} className="flex items-start gap-1.5 text-[11px] leading-snug text-slate-500">
      <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
      <span>
        Por tu privacidad no mostramos las notas médicas guardadas; si ya las habías compartido, se
        conservan. Si no, puedes escribirlas aquí. Para cambiarlas, contacta a{" "}
        {agencyName || "la agencia"}.
      </span>
    </p>
  );
}
