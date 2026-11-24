"use client";

import { useState } from "react";
import { Building2, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "@/shared/utils/clipboard";
import type { PublicBankAccountOutput } from "@/shared/schemas/bank-account.schema";
import {
  formatAccountHolderForDisplay,
  formatBankNameForDisplay,
  formatCardNumberForDisplay,
  formatClabeForDisplay,
} from "@/shared/utils/bank-account.util";

type BankField = "clabe" | "card";
const BANK_FIELD_LABEL: Record<BankField, string> = { clabe: "CLABE", card: "Número de tarjeta" };

function BankAccountRow({
  label,
  copyLabel,
  value,
  isCopied,
  onCopy,
}: {
  label: string;
  /** Texto del `aria-label` del botón ("Copiar CLABE Interbancaria de la cuenta 2"). */
  copyLabel: string;
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
        aria-label={`Copiar ${copyLabel}`}
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
  /** Cuentas de la agencia en el orden de la API; la tarjeta es opcional por cuenta. */
  accounts: readonly PublicBankAccountOutput[];
}

/**
 * Bloque "Transferencia Bancaria" del Magic Link: una tarjeta por cuenta (banco, beneficiario,
 * CLABE y tarjeta si existe, cada una con su botón de copiar) y la nota del concepto de pago. Mismo
 * formato en "Métodos y opciones de pago" (`PaymentOptionsCard`) y en "Dónde hacer tus próximos
 * pagos" (`NextPaymentsCard`). Sin cuentas no se dibuja.
 */
export function BankTransferDetails({ accounts }: BankTransferDetailsProps) {
  /** Dato recién copiado, `"<índice>:<campo>"` (para el estado visual de su botón). */
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const visibleAccounts = accounts.filter((account) => account.clabeNumber.trim());
  if (visibleAccounts.length === 0) return null;
  const isMultiAccount = visibleAccounts.length > 1;

  const handleCopy = async (key: string, field: BankField, value: string): Promise<void> => {
    const success = await copyToClipboard(value.replace(/\s+/g, ""));
    if (success) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
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
      {isMultiAccount && (
        <p className="mb-3 text-xs text-slate-500">
          Puedes transferir a cualquiera de estas cuentas.
        </p>
      )}

      <ul className="space-y-3">
        {visibleAccounts.map((account, index) => {
          const bankName = formatBankNameForDisplay(account.bankName);
          const accountHolder = formatAccountHolderForDisplay(account.accountHolder);
          const cardNumber = account.cardNumber?.trim() || null;
          const accountLabel = isMultiAccount ? ` de la cuenta ${index + 1}` : "";
          return (
            <li
              key={`${index}-${account.clabeNumber}`}
              className="space-y-3 rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm"
              aria-label={isMultiAccount ? `Cuenta ${index + 1}: ${bankName}` : undefined}
            >
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="min-w-0">
                  <span className="block text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                    Banco Receptor
                  </span>
                  <span
                    className="block truncate text-xs font-bold text-slate-800"
                    title={bankName}
                  >
                    {bankName}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                    Beneficiario
                  </span>
                  <span
                    className="block truncate text-xs font-bold text-slate-800"
                    title={accountHolder}
                  >
                    {accountHolder}
                  </span>
                </div>
              </div>

              <BankAccountRow
                label="CLABE Interbancaria"
                copyLabel={`CLABE Interbancaria${accountLabel}`}
                value={formatClabeForDisplay(account.clabeNumber)}
                isCopied={copiedKey === `${index}:clabe`}
                onCopy={() => handleCopy(`${index}:clabe`, "clabe", account.clabeNumber)}
              />

              {cardNumber && (
                <BankAccountRow
                  label="Número de Tarjeta"
                  copyLabel={`Número de Tarjeta${accountLabel}`}
                  value={formatCardNumberForDisplay(cardNumber)}
                  isCopied={copiedKey === `${index}:card`}
                  onCopy={() => handleCopy(`${index}:card`, "card", cardNumber)}
                />
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-2.5 text-center text-[11px] text-slate-400 italic">
        *En concepto de pago ingresa tu nombre o teléfono registrado
      </p>
    </div>
  );
}
