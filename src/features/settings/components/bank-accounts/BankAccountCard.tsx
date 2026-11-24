import { Landmark, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatAccountHolderForDisplay,
  formatBankNameForDisplay,
  formatClabeForDisplay,
  maskCardNumber,
} from "@/shared/utils/bank-account.util";
import type { BankAccountOutput } from "../../schemas/bank-account.schema";

interface BankAccountCardProps {
  account: BankAccountOutput;
  /** Sin callbacks (Solo Lectura) no se muestran las acciones. */
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

/** Tarjeta de una cuenta en Configuración → Agencia: banco, titular, CLABE y tarjeta enmascarada. */
export function BankAccountCard({ account, onEdit, onDelete, isDeleting }: BankAccountCardProps) {
  const bankName = formatBankNameForDisplay(account.bankName);
  const isIncomplete = !account.bankName.trim() || !account.accountHolder.trim();

  return (
    <li
      className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4"
      aria-busy={isDeleting || undefined}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
        <Landmark className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-sm font-bold text-slate-900">{bankName}</p>
        <p className="truncate text-xs text-slate-600">
          {formatAccountHolderForDisplay(account.accountHolder)}
        </p>
        <p className="font-mono text-xs tracking-wide break-all text-slate-800">
          CLABE {formatClabeForDisplay(account.clabeNumber)}
        </p>
        {account.cardNumber && (
          <p className="font-mono text-xs text-slate-500">
            Tarjeta {maskCardNumber(account.cardNumber)}
          </p>
        )}
        {isIncomplete && (
          <p className="pt-1 text-xs font-medium text-amber-700">
            Completa el banco y el titular para que tus viajeros sepan a quién transferir.
          </p>
        )}
      </div>
      {(onEdit || onDelete) && (
        <div className="flex shrink-0 gap-1">
          {onEdit && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onEdit}
              disabled={isDeleting}
              aria-label={`Editar cuenta ${bankName}`}
            >
              <Pencil className="h-4 w-4" aria-hidden />
            </Button>
          )}
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={isDeleting}
              aria-label={`Eliminar cuenta ${bankName}`}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
          )}
        </div>
      )}
    </li>
  );
}
