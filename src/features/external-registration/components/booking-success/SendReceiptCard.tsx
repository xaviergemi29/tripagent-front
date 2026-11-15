import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { buildWhatsAppUrl } from "@/shared/utils/share-links.util";

/** "¿Ya realizaste tu transferencia?": envía el comprobante a la agencia por WhatsApp. */
export function SendReceiptCard({
  agencyPhone,
  whatsappText,
}: {
  agencyPhone: string;
  whatsappText: string;
}) {
  return (
    <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm">
      <h3 className="text-foreground mb-1 text-center text-sm font-bold">
        ¿Ya realizaste tu transferencia?
      </h3>
      <p className="text-muted-foreground mx-auto mb-4 max-w-xs text-center text-xs leading-relaxed">
        Envíanos la captura de tu comprobante para validar tu pago y confirmar tus lugares.
      </p>
      <a
        href={buildWhatsAppUrl(agencyPhone, { message: whatsappText })}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full"
      >
        <Button
          type="button"
          className="h-12 w-full rounded-xl bg-[#25D366] text-sm font-bold text-white shadow-none transition-transform hover:bg-[#1DA851] active:scale-[0.98]"
        >
          <WhatsAppIcon className="mr-2 h-5 w-5 fill-current" /> Enviar comprobante
        </Button>
      </a>
    </div>
  );
}
