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
  /**
   * `plain` (por defecto): bloque discreto. `card`: tarjeta de confianza con escudo índigo y el
   * aviso integral en otra pestaña (modal de pre-reserva: no pierde lo capturado). El texto legal
   * es el mismo en ambas.
   */
  variant?: "plain" | "card";
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
  variant = "plain",
  className,
}: SimplifiedPrivacyNoticeProps) {
  const isCard = variant === "card";
  const opensNewTab = isCard || /^https?:\/\//.test(fullNoticeHref);
  const address = responsibleAddress?.trim();

  return (
    <aside
      aria-label="Aviso de privacidad simplificado"
      className={cn(
        "flex items-start text-[11px] leading-relaxed",
        isCard
          ? "mt-4 gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-3.5 text-slate-600"
          : "gap-2.5 rounded-xl border border-slate-200/80 bg-white/70 p-3 text-slate-500",
        className,
      )}
    >
      <ShieldCheck
        className={cn("mt-0.5 h-4 w-4 shrink-0", isCard ? "text-indigo-600" : "text-slate-400")}
        aria-hidden="true"
      />
      <p>
        <span className={cn("font-semibold", isCard ? "mr-1 text-slate-800" : "text-slate-600")}>
          Aviso de privacidad simplificado.{" "}
        </span>
        {responsibleName}
        {address ? `, con domicilio en ${address},` : ""} es responsable de {dataCollected} y los
        usa únicamente para {purpose}
        {viaTripAgent ? ", utilizando la plataforma tecnológica TripAgent MX" : ""}. No pedimos
        datos de salud. Para limitar su uso o ejercer tus derechos de acceso, rectificación,
        cancelación u oposición, {rightsContact}. Consulta el{" "}
        <a
          href={fullNoticeHref}
          {...(opensNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className={cn(
            "font-semibold text-indigo-600 underline hover:text-indigo-700",
            isCard && "underline-offset-2",
          )}
        >
          Aviso de Privacidad integral
        </a>
        .
      </p>
    </aside>
  );
}
