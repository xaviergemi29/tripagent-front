"use client";

import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { buildWhatsAppUrl, toPhoneDigits } from "@/shared/utils/share-links.util";

/** "¿Hiciste otro abono o pago?": abre WhatsApp con la agencia para enviar el comprobante. */
export function ReportPaymentCta({
  agencyName,
  agencyPhone,
  tourTitle,
}: {
  agencyName: string;
  agencyPhone: string | null;
  tourTitle: string;
}) {
  // Sin teléfono de la agencia, `wa.me` abriría un chat vacío: no se ofrece el botón (igual que el
  // pase de abordaje). El pie de la página tampoco muestra WhatsApp en ese caso.
  if (!toPhoneDigits(agencyPhone)) return null;

  const handleSendWhatsApp = (): void => {
    const message = `¡Hola ${agencyName}! Quiero reportar un nuevo abono para mi reservación en el "${tourTitle}". Adjunto mi comprobante:`;
    window.open(buildWhatsAppUrl(agencyPhone, { message }), "_blank");
  };

  return (
    <div className="space-y-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <WhatsAppIcon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-emerald-950">¿Hiciste otro abono o pago?</h3>
          <p className="text-xs leading-tight text-emerald-800/90">
            Mándanos una foto de tu comprobante por WhatsApp para anotarlo a tu cuenta.
          </p>
        </div>
      </div>
      <Button
        type="button"
        onClick={handleSendWhatsApp}
        className="h-11 w-full gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:bg-emerald-700 active:scale-[0.98]"
      >
        <WhatsAppIcon className="h-4 w-4 fill-current" /> Enviar comprobante por WhatsApp
      </Button>
    </div>
  );
}
