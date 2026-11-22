import { RefreshCw, Shield } from "lucide-react";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { buildSupportWhatsAppUrl } from "@/lib/support-config";

/** Confidencialidad, soporte por WhatsApp y respaldos. */
export function TrustAndSupportCard() {
  const whatsappUrl = buildSupportWhatsAppUrl(
    "Hola, tengo dudas sobre el registro de mi agencia en TripAgent",
  );

  return (
    <section>
      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-indigo-100/60 bg-indigo-50/40 p-4">
        <Shield className="h-5 w-5 shrink-0 text-indigo-600" aria-hidden="true" />
        <div>
          <p className="text-xs leading-relaxed text-slate-700">
            Tus listas de pasajeros son 100% confidenciales y propiedad de tu agencia. Incluye
            soporte directo por WhatsApp.
          </p>
          {/* Sin NEXT_PUBLIC_SUPPORT_WHATSAPP no se dibuja (nunca un número falso). */}
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-xs hover:bg-emerald-50"
            >
              <WhatsAppIcon className="h-3.5 w-3.5" />
              Asistencia técnica en WhatsApp
            </a>
          )}
        </div>
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        Respaldos diarios automáticos en la nube
      </p>
    </section>
  );
}
