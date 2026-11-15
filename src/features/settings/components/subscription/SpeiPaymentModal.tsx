"use client";

import { useState } from "react";
import { Check, Copy, Landmark, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { cn } from "@/lib/utils";
import { formatClabeForDisplay } from "@/shared/utils/bank-account.util";
import { copyToClipboard } from "@/shared/utils/clipboard";
import { formatCurrency } from "@/shared/utils/currency.util";
import { buildWhatsAppUrl } from "@/shared/utils/share-links.util";
import type { SubscriptionOutput } from "../../schemas/subscription.schema";
import { buildSpeiReceiptMessage } from "../../utils/subscription.util";

type CopyField = "clabe" | "reference";
const COPY_FIELD_LABEL: Record<CopyField, string> = {
  clabe: "CLABE",
  reference: "Referencia",
};
const COPIED_FEEDBACK_MS = 2000;

interface SpeiPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spei: NonNullable<SubscriptionOutput["speiDetails"]>;
  amountMxn: number;
  agencyName: string;
  /** WhatsApp de soporte de TripAgent (con lada); sin él no se muestra el botón. */
  whatsappNumber: string | null;
}

function CopyButton({
  label,
  isCopied,
  onCopy,
}: {
  label: string;
  isCopied: boolean;
  onCopy: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={`Copiar ${label}`}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
        isCopied
          ? "bg-emerald-50 text-emerald-700"
          : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
      )}
    >
      {isCopied ? (
        <>
          <Check className="h-3.5 w-3.5" aria-hidden /> ¡Copiado!
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" aria-hidden /> Copiar
        </>
      )}
    </button>
  );
}

/**
 * Datos para pagar el Plan PRO por SPEI: monto, banco, beneficiario, CLABE y referencia (con copiar)
 * y envío del comprobante por WhatsApp. El `Dialog` de Radix ya cierra con clic fuera o `Escape`,
 * bloquea el scroll del `body` y atrapa el foco; `copyToClipboard` tiene respaldo sin HTTPS.
 */
export function SpeiPaymentModal({
  open,
  onOpenChange,
  spei,
  amountMxn,
  agencyName,
  whatsappNumber,
}: SpeiPaymentModalProps) {
  const [copiedField, setCopiedField] = useState<CopyField | null>(null);

  // Se copia siempre el valor sin espacios (la CLABE se muestra agrupada).
  const handleCopy = async (field: CopyField, value: string): Promise<void> => {
    if (await copyToClipboard(value)) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), COPIED_FEEDBACK_MS);
      toast.success(`${COPY_FIELD_LABEL[field]} copiada al portapapeles`);
    } else {
      toast.error("Error al copiar", {
        description: `Copia la ${COPY_FIELD_LABEL[field].toLowerCase()} manualmente.`,
      });
    }
  };

  const whatsappUrl = whatsappNumber
    ? buildWhatsAppUrl(whatsappNumber, {
        message: buildSpeiReceiptMessage(agencyName, spei.reference),
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-slate-900/60"
        // Móvil: ancho completo con margen seguro y scroll propio (el botón de WhatsApp nunca
        // queda oculto). Escritorio: flotante centrado, max-w-lg.
        className="block max-h-[90vh] w-full max-w-[calc(100%-1.5rem)] gap-0 overflow-y-auto overscroll-contain rounded-3xl border border-slate-100 bg-white p-0 shadow-2xl ring-0 sm:max-w-lg"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 p-5 sm:p-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
              <Landmark className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-bold text-slate-900 sm:text-lg">
                Pago por Transferencia SPEI
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Activación inmediata al validar comprobante
              </DialogDescription>
            </div>
          </div>
          <DialogClose
            aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-600"
          >
            <X className="h-5 w-5" aria-hidden />
          </DialogClose>
        </div>

        <div className="p-5 sm:p-6">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-center sm:p-5">
            <span className="text-xs font-medium text-slate-500">Monto exacto a transferir</span>
            <div className="mt-1 text-2xl font-extrabold text-indigo-950 sm:text-3xl">
              {formatCurrency(amountMxn, { currency: "MXN" })}
            </div>
            <span className="mt-0.5 block text-xs font-medium text-indigo-700">
              IVA incluido · Suscripción mensual Plan PRO
            </span>
          </div>

          <dl className="my-4 space-y-3.5 text-xs sm:my-5 sm:space-y-4 sm:text-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2">
              <dt className="shrink-0 text-slate-500">Banco Receptor:</dt>
              <dd className="text-right font-bold text-slate-800">{spei.bank}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2">
              <dt className="shrink-0 text-slate-500">Beneficiario:</dt>
              <dd className="text-right font-bold break-words text-slate-800">
                {spei.beneficiary}
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-2 sm:flex-nowrap">
              <dt className="w-full text-slate-500 sm:w-auto">CLABE Interbancaria:</dt>
              <dd className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
                <span className="font-mono font-bold tracking-wider text-slate-900">
                  {formatClabeForDisplay(spei.clabe)}
                </span>
                <CopyButton
                  label="CLABE"
                  isCopied={copiedField === "clabe"}
                  onCopy={() => handleCopy("clabe", spei.clabe)}
                />
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 py-2 sm:flex-nowrap">
              <dt className="w-full sm:w-auto">
                <span className="block font-medium text-slate-500">Concepto / Referencia:</span>
                <span className="block text-[10px] text-slate-400 sm:text-xs">
                  Indispensable para identificar tu pago
                </span>
              </dt>
              <dd className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
                <span className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 font-mono font-bold text-indigo-700">
                  {spei.reference}
                </span>
                <CopyButton
                  label="Referencia"
                  isCopied={copiedField === "reference"}
                  onCopy={() => handleCopy("reference", spei.reference)}
                />
              </dd>
            </div>
          </dl>

          <div className="space-y-3 pt-2">
            {whatsappUrl && (
              <>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-[0.99]"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  <span>Enviar comprobante por WhatsApp</span>
                  <span aria-hidden>→</span>
                </a>
                <p className="text-center text-xs text-slate-400">
                  Validamos tu transferencia en menos de 15 minutos en horario hábil.
                </p>
              </>
            )}
            <DialogClose className="w-full rounded-xl py-2.5 text-center text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700">
              Volver a Suscripción
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
