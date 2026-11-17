import type { ReactNode } from "react";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { buildWhatsAppUrl, toPhoneDigits } from "@/shared/utils/share-links.util";

export interface PublicBookingFooterProps {
  agencyName: string;
  /** WhatsApp de la agencia. Sin teléfono no se muestra el botón del asesor. */
  agencyWhatsApp?: string | null;
  whatsappMessage?: string;
  /** Línea extra de cierre (p. ej. "¡Buen viaje!" en el pase de abordaje). */
  closingNote?: string;
  /** Acciones que la vista quiera mostrar al final, antes de la atribución. */
  stickyActionsSlot?: ReactNode;
}

/**
 * Pie común de las vistas del Magic Link: canal humano por WhatsApp, mensaje de cercanía y
 * atribución a TripAgent (mismo estilo que el folleto `/p/[id]`). Server-safe.
 */
export function PublicBookingFooter({
  agencyName,
  agencyWhatsApp,
  whatsappMessage = "Hola, tengo dudas con mi reservación.",
  closingNote,
  stickyActionsSlot,
}: PublicBookingFooterProps) {
  const phoneDigits = toPhoneDigits(agencyWhatsApp);
  const whatsappUrl = phoneDigits
    ? buildWhatsAppUrl(phoneDigits, { message: whatsappMessage }) // agrega la lada 52
    : null;

  return (
    <footer className="mt-10 flex w-full flex-col items-center px-1 pb-12 text-center">
      {stickyActionsSlot && <div className="mx-auto mb-6 w-full max-w-md">{stickyActionsSlot}</div>}

      {/* Canal humano */}
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-3 inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-xs font-semibold text-emerald-700 shadow-xs transition-all hover:bg-emerald-50 active:scale-[0.98] sm:text-sm"
        >
          <WhatsAppIcon className="h-4 w-4" />
          <span>Contactar asesor por WhatsApp</span>
        </a>
      )}

      {/* Cercanía y soporte */}
      <p className="max-w-sm text-xs leading-relaxed text-slate-500">
        ¿Dudas con tu reservación? Estamos para ayudarte • {agencyName}
      </p>
      {closingNote && <p className="mt-1 max-w-sm text-xs text-slate-500">{closingNote}</p>}

      {/* Atribución a la plataforma */}
      <a
        href="https://tripagent.mx"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 text-[11px] font-medium text-slate-400 transition-colors hover:text-indigo-500"
      >
        ⚡ Potenciado por <span className="font-bold text-slate-500">TripAgent</span>
      </a>
    </footer>
  );
}
