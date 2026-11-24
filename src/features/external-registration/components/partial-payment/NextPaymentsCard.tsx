import { Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BankTransferDetails } from "../BankTransferDetails";
import type { PartialPaymentViewProps } from "./types";

/**
 * "Dónde hacer tus próximos pagos": los datos de transferencia de la agencia con el mismo formato
 * que "Métodos y opciones de pago" (`BankTransferDetails`): todas las cuentas, en orden. Sin
 * cuentas no se dibuja.
 */
export function NextPaymentsCard({ agency }: { agency: PartialPaymentViewProps["agency"] }) {
  const bankAccounts = (agency.bankAccounts ?? []).filter((account) => account.clabeNumber.trim());
  if (bankAccounts.length === 0) return null;

  return (
    <Card className="rounded-2xl border-indigo-100/70 bg-white shadow-sm">
      <CardContent className="space-y-3 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-950 uppercase">
          <Building2 className="h-4 w-4 text-indigo-600" /> Dónde hacer tus próximos pagos
        </div>
        <p className="text-xs text-slate-600">
          Puedes ir liquidando poco a poco antes del día de salida con los siguientes datos:
        </p>
        <BankTransferDetails accounts={bankAccounts} />
      </CardContent>
    </Card>
  );
}
