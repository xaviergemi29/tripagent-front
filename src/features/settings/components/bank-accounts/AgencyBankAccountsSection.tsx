"use client";

import { useState } from "react";
import { Info, Landmark, Plus } from "lucide-react";
import { QueryErrorState } from "@/components/shared/QueryErrorState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AGENCY_BANK_ACCOUNTS_MAX } from "@/shared/constants/domain.constants";
import { formatBankNameForDisplay, formatClabeForDisplay } from "@/shared/utils/bank-account.util";
import { useBankAccounts, useDeleteBankAccount } from "../../hooks/useBankAccounts";
import type { BankAccountOutput } from "../../schemas/bank-account.schema";
import { AgencySettingsCard } from "../agency/AgencySettingsCard";
import { BankAccountCard } from "./BankAccountCard";
import { BankAccountFormDialog } from "./BankAccountFormDialog";

/**
 * Configuración → Agencia → "Cuentas bancarias": independiente del formulario de perfil (sus propias
 * mutaciones en `/agencies/bank-accounts`). Hasta `AGENCY_BANK_ACCOUNTS_MAX` cuentas; en Solo
 * Lectura (`canWrite` falso) solo se consultan.
 */
export function AgencyBankAccountsSection({ canWrite }: { canWrite: boolean }) {
  const { data: accounts, isLoading, isError, refetch, isFetching } = useBankAccounts();
  const {
    mutate: deleteAccount,
    isPending: isDeleting,
    variables: deletingId,
  } = useDeleteBankAccount();
  // La cuenta en edición (null = alta) se conserva al cerrar: el título no cambia durante la animación.
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccountOutput | null>(null);
  const openForm = (account: BankAccountOutput | null): void => {
    setEditingAccount(account);
    setIsFormOpen(true);
  };
  const [accountToDelete, setAccountToDelete] = useState<BankAccountOutput | null>(null);

  const count = accounts?.length ?? 0;
  const hasReachedLimit = count >= AGENCY_BANK_ACCOUNTS_MAX;

  const renderContent = () => {
    if (isError && !accounts) {
      return (
        <QueryErrorState
          variant="compact"
          resourceArticle="las"
          resourceName="cuentas bancarias de tu agencia"
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      );
    }
    if (isLoading || !accounts) {
      return (
        <div className="space-y-3" aria-hidden>
          {[1, 2].map((row) => (
            <Skeleton key={row} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      );
    }
    if (accounts.length === 0) {
      return (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center">
          <Landmark className="h-6 w-6 text-slate-400" aria-hidden />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-800">Aún no tienes cuentas bancarias</p>
            <p className="text-xs text-slate-500">
              Agrega al menos una para que tus viajeros sepan a dónde transferir.
            </p>
          </div>
          {canWrite && (
            <Button type="button" onClick={() => openForm(null)}>
              <Plus className="mr-1.5 h-4 w-4" aria-hidden /> Agregar cuenta
            </Button>
          )}
        </div>
      );
    }
    return (
      <ul className="space-y-3" aria-label="Cuentas bancarias">
        {accounts.map((account) => (
          <BankAccountCard
            key={account.id}
            account={account}
            onEdit={canWrite ? () => openForm(account) : undefined}
            onDelete={canWrite ? () => setAccountToDelete(account) : undefined}
            isDeleting={isDeleting && deletingId === account.id}
          />
        ))}
      </ul>
    );
  };

  return (
    <AgencySettingsCard
      icon={Landmark}
      title="Cuentas bancarias"
      badge={
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
          Transferencias SPEI
        </span>
      }
      description={`Las cuentas que verán tus viajeros para transferir, en este orden. Hasta ${AGENCY_BANK_ACCOUNTS_MAX}.`}
    >
      {renderContent()}

      {canWrite && count > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500" aria-live="polite">
            {hasReachedLimit
              ? `Llegaste al máximo de ${AGENCY_BANK_ACCOUNTS_MAX} cuentas. Elimina una para agregar otra.`
              : `${count} de ${AGENCY_BANK_ACCOUNTS_MAX} cuentas registradas.`}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => openForm(null)}
            disabled={hasReachedLimit}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-1.5 h-4 w-4" aria-hidden /> Agregar cuenta
          </Button>
        </div>
      )}

      {/* Solo lo que pasa de verdad: el Magic Link y el estado de cuenta PDF leen las cuentas
          vigentes (el folleto público no las muestra). */}
      <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
        <p className="text-xs leading-relaxed text-indigo-900">
          Cualquier cambio en tus cuentas se refleja de inmediato en los enlaces de reserva (Magic
          Link) y en los estados de cuenta PDF de tus clientes. El PDF nunca imprime la tarjeta.
        </p>
      </div>

      <BankAccountFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        account={editingAccount}
      />
      <ConfirmDialog
        isOpen={accountToDelete !== null}
        onOpenChange={(open) => !open && setAccountToDelete(null)}
        title="¿Eliminar esta cuenta bancaria?"
        description={
          accountToDelete
            ? `${formatBankNameForDisplay(accountToDelete.bankName)} · CLABE ${formatClabeForDisplay(accountToDelete.clabeNumber)}. Tus viajeros dejarán de verla en su enlace de reserva y en su estado de cuenta.${count === 1 ? " Es tu única cuenta: si tus tours aceptan transferencia, tus viajeros tendrán que pedirte los datos por WhatsApp." : ""}`
            : ""
        }
        confirmText="Eliminar cuenta"
        isDestructive
        onConfirm={() => {
          if (accountToDelete) deleteAccount(accountToDelete.id);
        }}
      />
    </AgencySettingsCard>
  );
}
