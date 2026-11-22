import { Scale } from "lucide-react";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { SUPPORT_EMAIL, buildSupportWhatsAppUrl } from "@/lib/support-config";
import { TERMINOS_SUPPORT_WHATSAPP_MESSAGE } from "../constants/terminos-content.constants";

/** Tarjeta "¿Tienes dudas legales?": correo de soporte y, si está configurado, WhatsApp. */
export function LegalSupportCard() {
  const whatsappUrl = buildSupportWhatsAppUrl(TERMINOS_SUPPORT_WHATSAPP_MESSAGE);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3525cd]/10 text-[#3525cd]">
        <Scale className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="mt-3 text-sm font-bold text-slate-900">¿Tienes dudas legales?</p>
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="mt-1 block text-sm font-medium break-all text-[#3525cd] hover:underline"
      >
        {SUPPORT_EMAIL}
      </a>
      {/* Sin NEXT_PUBLIC_SUPPORT_WHATSAPP no se dibuja (nunca un número falso). */}
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
        >
          <WhatsAppIcon className="h-3.5 w-3.5" />
          Chatear con soporte legal
        </a>
      )}
    </div>
  );
}
