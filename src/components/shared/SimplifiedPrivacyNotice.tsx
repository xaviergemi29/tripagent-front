import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimplifiedPrivacyNoticeProps {
  /** Responsable del tratamiento (la agencia en el Magic Link y el folleto; TripAgent en /registro). */
  responsibleName: string;
  /** Domicilio del responsable; sin él se omite la frase del domicilio. */
  responsibleAddress?: string | null;
  /** Datos que se recaban en ese formulario ("tu nombre y tu WhatsApp"). */
  dataCollected: string;
  /** Finalidad ("la gestión logística de este viaje"). */
  purpose: string;
  /** TripAgent como encargado tecnológico (formularios de una agencia). */
  viaTripAgent?: boolean;
  /** Cómo limitar el uso o ejercer derechos ARCO ("contactando a la agencia"). */
  rightsContact: string;
  /** Aviso de privacidad integral. */
  fullNoticeHref: string;
  className?: string;
}

/**
 * Aviso de privacidad simplificado (LFPDPPP 2025, arts. 15 fr. I–IV y 16 fr. II; 2026-11-22): se
 * muestra en cada formulario público que recaba datos. Dice quién es el responsable y su
 * domicilio, qué datos se piden, para qué, cómo limitar su uso y dónde leer el aviso integral.
 * Sin hooks: lo usan Server y Client Components.
 */
export function SimplifiedPrivacyNotice({
  responsibleName,
  responsibleAddress,
  dataCollected,
  purpose,
  viaTripAgent = false,
  rightsContact,
  fullNoticeHref,
  className,
}: SimplifiedPrivacyNoticeProps) {
  const isExternal = /^https?:\/\//.test(fullNoticeHref);
  const address = responsibleAddress?.trim();

  return (
    <aside
      aria-label="Aviso de privacidad simplificado"
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-white/70 p-3 text-[11px] leading-relaxed text-slate-500",
        className,
      )}
    >
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
      <p>
        <span className="font-semibold text-slate-600">Aviso de privacidad simplificado. </span>
        {responsibleName}
        {address ? `, con domicilio en ${address},` : ""} es responsable de {dataCollected} y los
        usa únicamente para {purpose}
        {viaTripAgent ? ", utilizando la plataforma tecnológica TripAgent MX" : ""}. No pedimos
        datos de salud. Para limitar su uso o ejercer tus derechos de acceso, rectificación,
        cancelación u oposición, {rightsContact}. Consulta el{" "}
        <a
          href={fullNoticeHref}
          {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="font-semibold text-indigo-600 underline hover:text-indigo-700"
        >
          Aviso de Privacidad integral
        </a>
        .
      </p>
    </aside>
  );
}
