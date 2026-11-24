"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormState } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateBankAccount, useUpdateBankAccount } from "../../hooks/useBankAccounts";
import {
  bankAccountFormSchema,
  type BankAccountFormInput,
  type BankAccountInput,
  type BankAccountOutput,
} from "../../schemas/bank-account.schema";

interface BankAccountFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Cuenta a editar; sin ella, el diálogo agrega una nueva. */
  account?: BankAccountOutput | null;
  /** Texto bajo el título (el formulario de tours aclara que lo capturado se conserva). */
  description?: string;
}

/**
 * Alta o edición de una cuenta bancaria (`POST` / `PATCH /agencies/bank-accounts`). El formulario
 * vive dentro de `DialogContent`: Radix lo desmonta al cerrar y cada apertura parte de
 * `defaultValues`. Ante un error (CLABE repetida, límite de cuentas) el diálogo sigue abierto con lo
 * capturado y el hook avisa con un toast.
 */
export function BankAccountFormDialog({
  isOpen,
  onClose,
  account,
  description = "Tus viajeros verán estos datos en su enlace de reserva y en su estado de cuenta.",
}: BankAccountFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <BankAccountForm onClose={onClose} account={account} description={description} />
      </DialogContent>
    </Dialog>
  );
}

function BankAccountForm({
  onClose,
  account,
  description,
}: Pick<BankAccountFormDialogProps, "onClose" | "account" | "description">) {
  const createMutation = useCreateBankAccount();
  const updateMutation = useUpdateBankAccount();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const form = useForm<BankAccountFormInput, unknown, BankAccountInput>({
    resolver: zodResolver(bankAccountFormSchema),
    mode: "onTouched",
    // Una cuenta migrada puede traer banco o titular vacíos: al editarla se exigen.
    defaultValues: {
      bankName: account?.bankName ?? "",
      accountHolder: account?.accountHolder ?? "",
      clabeNumber: account?.clabeNumber ?? "",
      cardNumber: account?.cardNumber ?? "",
    },
  });
  const { errors } = useFormState({ control: form.control });

  const onSubmit = form.handleSubmit((body) => {
    if (account) updateMutation.mutate({ id: account.id, body }, { onSuccess: onClose });
    else createMutation.mutate(body, { onSuccess: onClose });
  });

  return (
    // `stopPropagation`: el diálogo puede abrirse dentro del <form> del tour (los eventos de React
    // atraviesan el portal); sin él, enviar esta cuenta también enviaría el tour.
    <form
      noValidate
      onSubmit={(event) => {
        event.stopPropagation();
        void onSubmit(event);
      }}
      className="space-y-4"
    >
      <DialogHeader>
        <DialogTitle>{account ? "Editar cuenta bancaria" : "Agregar cuenta bancaria"}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <div className="space-y-1.5">
        <Label htmlFor="bank-account-bank-name">Banco *</Label>
        <Input
          id="bank-account-bank-name"
          placeholder="Ej. BBVA, Santander, Nu"
          className="text-base sm:text-sm"
          aria-invalid={Boolean(errors.bankName)}
          aria-describedby={errors.bankName ? "bank-account-bank-name-error" : undefined}
          {...form.register("bankName")}
        />
        {errors.bankName && (
          <p id="bank-account-bank-name-error" className="text-xs text-red-600">
            {errors.bankName.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bank-account-holder">Titular de la cuenta *</Label>
        <Input
          id="bank-account-holder"
          placeholder="Nombre o razón social"
          className="text-base sm:text-sm"
          aria-invalid={Boolean(errors.accountHolder)}
          aria-describedby={errors.accountHolder ? "bank-account-holder-error" : undefined}
          {...form.register("accountHolder")}
        />
        {errors.accountHolder && (
          <p id="bank-account-holder-error" className="text-xs text-red-600">
            {errors.accountHolder.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bank-account-clabe">CLABE interbancaria *</Label>
        <Input
          id="bank-account-clabe"
          inputMode="numeric"
          placeholder="18 dígitos"
          // Margen para espacios o guiones al pegarla (el schema los quita al validar).
          maxLength={24}
          className="font-mono text-base tracking-wide sm:text-sm"
          aria-invalid={Boolean(errors.clabeNumber)}
          aria-describedby={errors.clabeNumber ? "bank-account-clabe-error" : undefined}
          {...form.register("clabeNumber")}
        />
        {errors.clabeNumber && (
          <p id="bank-account-clabe-error" className="text-xs text-red-600">
            {errors.clabeNumber.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bank-account-card">Número de tarjeta (opcional)</Label>
        <Input
          id="bank-account-card"
          inputMode="numeric"
          placeholder="Ej. 4123 4567 8901 2345"
          maxLength={19}
          className="font-mono text-base tracking-wide sm:text-sm"
          aria-invalid={Boolean(errors.cardNumber)}
          aria-describedby={errors.cardNumber ? "bank-account-card-error" : undefined}
          {...form.register("cardNumber")}
        />
        {errors.cardNumber ? (
          <p id="bank-account-card-error" className="text-xs text-red-600">
            {errors.cardNumber.message}
          </p>
        ) : (
          <p className="text-xs text-slate-500">
            Se muestra en el enlace de reserva; nunca se imprime en el estado de cuenta PDF.
          </p>
        )}
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Guardando...
            </>
          ) : account ? (
            "Guardar cambios"
          ) : (
            "Guardar cuenta"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
