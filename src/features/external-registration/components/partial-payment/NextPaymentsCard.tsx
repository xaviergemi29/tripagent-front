"use client";

import { useState } from "react";
import { Building2, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { copyToClipboard } from "@/shared/utils/clipboard";
import {
  formatCardNumberForDisplay,
  formatClabeForDisplay,
} from "@/shared/utils/bank-account.util";
import type { PartialPaymentViewProps } from "./types";

/** Dato bancario (CLABE o tarjeta) con su botón de copiar. */
function CopyableAccountField({
  label,
  value,
  isCopied,
  onCopy,
}: {
  label: string;
  value: string;
  isCopied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-500">{label}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCopy}
          aria-label={`Copiar ${label}`}
          className="h-7 gap-1 border-indigo-200 bg-indigo-50/50 px-2.5 text-[11px] text-indigo-700 hover:bg-indigo-100"
        >
          {isCopied ? (
            <>
              <Check className="h-3 w-3 text-emerald-600" />
              <span>¡Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copiar</span>
            </>
          )}
        </Button>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-center font-mono text-sm font-semibold tracking-wider text-slate-800">
        {value}
      </div>
    </div>
  );
}

const bankFieldLabel = { clabe: "CLABE", card: "Número de tarjeta" } as const;

/**
 * "Dónde hacer tus próximos pagos": banco, titular, CLABE y tarjeta (si la agencia la capturó),
 * cada dato con su botón de copiar. Sin CLABE ni tarjeta no se dibuja.
 */
export function NextPaymentsCard({ agency }: { agency: PartialPaymentViewProps["agency"] }) {
  /** Dato bancario recién copiado (para el estado visual de su botón). */
  const [copiedField, setCopiedField] = useState<"clabe" | "card" | null>(null);
  const clabeNumber = agency.clabeNumber?.trim() || null;
  const cardNumber = agency.cardNumber?.trim() || null;
  if (!clabeNumber && !cardNumber) return null;

  const handleCopyBankField = async (field: "clabe" | "card", value: string): Promise<void> => {
    const success = await copyToClipboard(value.replace(/\s+/g, ""));
    if (success) {
      setCopiedField(field);
      toast.success(`${bankFieldLabel[field]} copiado al portapapeles`);
      setTimeout(() => setCopiedField(null), 2000);
    } else {
      toast.error(`Error al copiar el ${bankFieldLabel[field].toLowerCase()}`);
    }
  };

  return (
    <Card className="rounded-2xl border-indigo-100/70 bg-white shadow-sm">
      <CardContent className="space-y-3 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-950 uppercase">
          <Building2 className="h-4 w-4 text-indigo-600" /> Dónde hacer tus próximos pagos
        </div>
        <p className="text-xs text-slate-600">
          Puedes ir liquidando poco a poco antes del día de salida con los siguientes datos:
        </p>
        <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 text-xs">
          {agency.bankName && (
            <div className="flex items-center justify-between border-b border-slate-200/60 py-1">
              <span className="text-slate-500">Banco</span>
              <span className="font-bold text-slate-800">{agency.bankName}</span>
            </div>
          )}
          {agency.accountHolder && (
            <div className="flex items-center justify-between border-b border-slate-200/60 py-1">
              <span className="text-slate-500">A nombre de</span>
              <span className="text-right font-semibold text-slate-800">
                {agency.accountHolder}
              </span>
            </div>
          )}
          {clabeNumber && (
            <CopyableAccountField
              label="CLABE interbancaria"
              value={formatClabeForDisplay(clabeNumber)}
              isCopied={copiedField === "clabe"}
              onCopy={() => handleCopyBankField("clabe", clabeNumber)}
            />
          )}
          {cardNumber && (
            <CopyableAccountField
              label="Número de tarjeta"
              value={formatCardNumberForDisplay(cardNumber)}
              isCopied={copiedField === "card"}
              onCopy={() => handleCopyBankField("card", cardNumber)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
