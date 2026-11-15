"use client";

import { useState } from "react";
import { Building2, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "@/shared/utils/clipboard";
import {
  formatCardNumberForDisplay,
  formatClabeForDisplay,
} from "@/shared/utils/bank-account.util";

type BankField = "clabe" | "card";
const BANK_FIELD_LABEL: Record<BankField, string> = { clabe: "CLABE", card: "Número de tarjeta" };

function BankAccountRow({
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
    <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
      <div>
        <span className="mb-0.5 block text-[10px] font-medium tracking-wider text-slate-400 uppercase">
          {label}
        </span>
        <span className="block font-mono text-xs font-bold tracking-wider text-slate-900">
          {value}
        </span>
      </div>

      <button
        type="button"
        onClick={onCopy}
        aria-label={`Copiar ${label}`}
        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-95"
      >
        {isCopied ? (
          <>
            <Check className="h-3.5 w-3.5" />
            <span>Copiado</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            <span>Copiar</span>
          </>
        )}
      </button>
    </div>
  );
}

interface BankTransferDetailsProps {
  bankName?: string | null;
  accountHolder?: string | null;
  clabeNumber?: string | null;
  /** Tarjeta de la agencia (opcional, decisión del PM): sin ella no se muestra la fila. */
  cardNumber?: string | null;
}

/**
 * Bloque "Transferencia Bancaria" del Magic Link: banco, beneficiario, CLABE y tarjeta con su
 * botón de copiar, y la nota del concepto de pago. Mismo formato en "Métodos y opciones de pago"
 * (`PaymentOptionsCard`) y en "Dónde hacer tus próximos pagos" (`NextPaymentsCard`).
 * Sin CLABE ni tarjeta no se dibuja.
 */
export function BankTransferDetails({
  bankName,
  accountHolder,
  clabeNumber: rawClabe,
  cardNumber: rawCard,
}: BankTransferDetailsProps) {
  /** Dato bancario recién copiado (para el estado visual de su botón). */
  const [copiedField, setCopiedField] = useState<BankField | null>(null);
  const clabeNumber = rawClabe?.trim() || null;
  const cardNumber = rawCard?.trim() || null;
  if (!clabeNumber && !cardNumber) return null;

  const handleCopy = async (field: BankField, value: string): Promise<void> => {
    const success = await copyToClipboard(value.replace(/\s+/g, ""));
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast.success(`${BANK_FIELD_LABEL[field]} copiado al portapapeles`, {
        description: "Abre la app de tu banco y pégalo para transferir.",
      });
    } else {
      toast.error("Error al copiar", {
        description: `Por favor, copia el ${BANK_FIELD_LABEL[field].toLowerCase()} manualmente.`,
      });
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4 transition-all">
      <div className="mb-3 flex items-center gap-2">
        <Building2 className="h-4 w-4 shrink-0 text-indigo-600" />
        <h3 className="text-xs font-bold tracking-wide text-slate-800 uppercase">
          Transferencia Bancaria
        </h3>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="block text-[10px] font-medium tracking-wider text-slate-400 uppercase">
              Banco Receptor
            </span>
            <span className="block truncate text-xs font-bold text-slate-800">
              {bankName || "No especificado"}
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-medium tracking-wider text-slate-400 uppercase">
              Beneficiario
            </span>
            <span
              className="block truncate text-xs font-bold text-slate-800"
              title={accountHolder || ""}
            >
              {accountHolder}
            </span>
          </div>
        </div>

        {clabeNumber && (
          <BankAccountRow
            label="CLABE Interbancaria"
            value={formatClabeForDisplay(clabeNumber)}
            isCopied={copiedField === "clabe"}
            onCopy={() => handleCopy("clabe", clabeNumber)}
          />
        )}

        {cardNumber && (
          <BankAccountRow
            label="Número de Tarjeta"
            value={formatCardNumberForDisplay(cardNumber)}
            isCopied={copiedField === "card"}
            onCopy={() => handleCopy("card", cardNumber)}
          />
        )}
      </div>

      <p className="mt-2.5 text-center text-[11px] text-slate-400 italic">
        *En concepto de pago ingresa tu nombre o teléfono registrado
      </p>
    </div>
  );
}
