"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { useUpdateAgencyBankAccount } from "../hooks/useAgency";
import {
  bankAccountFormSchema,
  type BankAccountFormInput,
  type BankAccountInput,
} from "../schemas/agency.schema";

interface BankAccountQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultValues?: Partial<BankAccountFormInput>;
}

/**
 * "Configurar cuenta ahora" (OBS-038, decisión del PM, 2026-11-17): guarda banco, titular y CLABE de
 * la agencia sin salir del formulario del tour, así el operador no pierde lo que ya escribió.
 * El formulario propio vive dentro del `Dialog` y no se mezcla con el del tour.
 */
export function BankAccountQuickModal({
  isOpen,
  onClose,
  defaultValues,
}: BankAccountQuickModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {isOpen && <BankAccountForm onClose={onClose} defaultValues={defaultValues} />}
      </DialogContent>
    </Dialog>
  );
}

function BankAccountForm({
  onClose,
  defaultValues,
}: Pick<BankAccountQuickModalProps, "onClose" | "defaultValues">) {
  const { mutate: saveBankAccount, isPending } = useUpdateAgencyBankAccount();
  const form = useForm<BankAccountFormInput, unknown, BankAccountInput>({
    resolver: zodResolver(bankAccountFormSchema),
    mode: "onChange",
    defaultValues: {
      bankName: defaultValues?.bankName ?? "",
      bankAccountHolder: defaultValues?.bankAccountHolder ?? "",
      clabeNumber: defaultValues?.clabeNumber ?? "",
    },
  });
  const { errors } = form.formState;

  // `stopPropagation`: el modal se abre dentro del <form> del tour; sin él, enviar este formulario
  // también enviaría el del tour.
  const onSubmit = form.handleSubmit((body) =>
    saveBankAccount(body, { onSuccess: () => onClose() }),
  );

  return (
    <form
      onSubmit={(event) => {
        event.stopPropagation();
        void onSubmit(event);
      }}
      className="space-y-4"
    >
      <DialogHeader>
        <DialogTitle>Cuenta para transferencias</DialogTitle>
        <DialogDescription>
          Tus viajeros verán estos datos para transferir sus pagos. Lo que ya escribiste en el tour
          se conserva.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-1.5">
        <Label htmlFor="bank-quick-bank-name">Banco</Label>
        <Input
          id="bank-quick-bank-name"
          placeholder="Ej. BBVA"
          {...form.register("bankName")}
          aria-invalid={!!errors.bankName}
        />
        {errors.bankName && <p className="text-xs text-red-600">{errors.bankName.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bank-quick-holder">Titular de la cuenta</Label>
        <Input
          id="bank-quick-holder"
          placeholder="Nombre o razón social"
          {...form.register("bankAccountHolder")}
          aria-invalid={!!errors.bankAccountHolder}
        />
        {errors.bankAccountHolder && (
          <p className="text-xs text-red-600">{errors.bankAccountHolder.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bank-quick-clabe">CLABE interbancaria *</Label>
        <Input
          id="bank-quick-clabe"
          inputMode="numeric"
          placeholder="18 dígitos"
          className="font-mono"
          {...form.register("clabeNumber")}
          aria-invalid={!!errors.clabeNumber}
        />
        {errors.clabeNumber && <p className="text-xs text-red-600">{errors.clabeNumber.message}</p>}
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending || !form.formState.isValid}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
            </>
          ) : (
            "Guardar cuenta"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
