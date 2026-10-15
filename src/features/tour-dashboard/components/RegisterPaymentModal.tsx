"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCreatePayment } from "../hooks/usePayments";
import {
  paymentFormSchema,
  type PaymentFormValues,
} from "@/features/travelers/schemas/enroll-traveler.schema";
import { Info, Check, X } from "lucide-react";
import { CreatePaymentPayload } from "../schemas/payment.schema";
import { formatCurrency } from "@/shared/utils/currency.util";

interface RegisterPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  tourCurrency?: "MXN" | "USD";
  tourId: string;
  balance: number;
  correctionData?: { amount: number; method: string } | null;
}

export function RegisterPaymentModal({
  isOpen,
  onClose,
  bookingId,
  tourId,
  tourCurrency,
  balance,
  correctionData,
}: RegisterPaymentModalProps) {
  const { mutate: createPayment, isPending } = useCreatePayment(tourId);
  const isUSD = tourCurrency === "USD";
  const [amountMXN, setAmountMXN] = useState<string>("");

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: balance,
      method: "TRANSFER",
      type: "PAYMENT",
      referenceInfo: "",
    },
  });

  const watchAmountUSD = form.watch("amount");

  const onSubmit = (formData: PaymentFormValues): void => {
    const payload: CreatePaymentPayload = {
      amount: Number(watchAmountUSD || formData.amount),
      currency: isUSD ? "USD" : "MXN",
      method: formData.method,
      type: formData.type,
      referenceInfo: formData.referenceInfo,
      ...(isUSD && {
        collectedAmount: Number(amountMXN),
        collectedCurrency: "MXN",
        exchangeRate: Number((Number(amountMXN) / Number(watchAmountUSD)).toFixed(4)),
      }),
    };

    console.log("payload tipado estricto:", payload);

    createPayment(
      { bookingId, payload },
      {
        onSuccess: () => {
          form.reset();
          onClose();
        },
      },
    );
  };

  useEffect(() => {
    if (isOpen) {
      form.reset({
        amount: correctionData ? correctionData.amount : balance,
        method: (correctionData ? correctionData.method : "TRANSFER") as any,
        type: "PAYMENT",
        referenceInfo: "",
      });
      setAmountMXN("");
    }
  }, [isOpen, balance, correctionData, form]);

  const resultingRate =
    watchAmountUSD > 0 && Number(amountMXN) > 0
      ? (Number(amountMXN) / Number(watchAmountUSD)).toFixed(2)
      : "0.00";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader className="border-b border-slate-100 pb-4 text-left">
          <div className="flex items-center gap-2.5 pr-6">
            {" "}
            <DialogTitle className="text-lg font-bold text-slate-900">Registrar Abono</DialogTitle>
            {isUSD && (
              <span className="inline-flex items-center rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                Tour en USD
              </span>
            )}
          </div>
          <DialogDescription className="mt-0.5 text-xs text-slate-500">
            El saldo pendiente actual es de{" "}
            <span className="font-semibold text-slate-800">
              {formatCurrency(balance, { currency: tourCurrency })}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form id="payment-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          <Controller
            name="amount"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="space-y-1.5">
                <Label
                  htmlFor="amount"
                  className="block text-[11px] font-bold tracking-wider text-slate-700 uppercase"
                >
                  {isUSD ? "Monto del abono en dólares (USD) *" : "Monto a abonar (MXN) *"}
                </Label>
                <div className="relative rounded-lg shadow-2xs">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="font-medium text-slate-400 sm:text-sm">$</span>
                  </div>
                  <Input
                    {...field}
                    id="amount"
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    autoFocus
                    onFocus={(e) => e.target.select()}
                    className="block w-full [appearance:textfield] rounded-lg border border-slate-200 py-2 pr-12 pl-7 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                  {isUSD && (
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-sm font-semibold text-slate-400">USD</span>
                    </div>
                  )}
                </div>
                {fieldState.error && (
                  <p className="text-xs font-medium text-red-500">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />

          {isUSD && (
            <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="amountMXN"
                  className="block text-[11px] font-bold tracking-wider text-slate-700 uppercase"
                >
                  Monto recibido en pesos (MXN) *
                </Label>
                <div className="relative rounded-lg shadow-2xs">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="font-medium text-slate-400 sm:text-sm">$</span>
                  </div>
                  <Input
                    id="amountMXN"
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={amountMXN}
                    required
                    className="block w-full [appearance:textfield] rounded-lg border border-slate-200 py-2 pr-12 pl-7 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    onChange={(e) => setAmountMXN(e.target.value)}
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-sm font-semibold text-slate-400">MXN</span>
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Ingresa el monto exacto cobrado según la tasa acordada o la boleta del banco.
                </p>
              </div>

              {Number(amountMXN) > 0 && watchAmountUSD > 0 && (
                <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5 transition-all">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100/80">
                      <Info className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-800">
                        Tipo de cambio aplicado:
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        Equivalente en moneda nacional
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-indigo-200/80 bg-white px-3 py-1.5 shadow-2xs">
                    <span className="font-mono text-sm font-bold tracking-tight text-slate-900">
                      ${resultingRate} MXN / USD
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <Controller
            name="method"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="space-y-2 pt-2">
                <Label>Método de cobro</Label>
                <div className="grid grid-cols-3 gap-2">
                  <label
                    className={`cursor-pointer rounded-md border p-2.5 text-center text-sm transition-colors ${field.value === "CASH" ? "border-indigo-300 bg-indigo-50 font-semibold text-indigo-700 shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    <input
                      type="radio"
                      className="hidden"
                      {...field}
                      value="CASH"
                      checked={field.value === "CASH"}
                    />{" "}
                    Efectivo
                  </label>
                  <label
                    className={`cursor-pointer rounded-md border p-2.5 text-center text-sm transition-colors ${field.value === "TRANSFER" ? "border-indigo-300 bg-indigo-50 font-semibold text-indigo-700 shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    <input
                      type="radio"
                      className="hidden"
                      {...field}
                      value="TRANSFER"
                      checked={field.value === "TRANSFER"}
                    />{" "}
                    SPEI / Transf.
                  </label>
                  <label
                    className={`cursor-pointer rounded-md border p-2.5 text-center text-sm transition-colors ${field.value === "CARD" ? "border-indigo-300 bg-indigo-50 font-semibold text-indigo-700 shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    <input
                      type="radio"
                      className="hidden"
                      {...field}
                      value="CARD"
                      checked={field.value === "CARD"}
                    />{" "}
                    Tarjeta
                  </label>
                </div>
                {fieldState.error && (
                  <p className="text-xs font-medium text-red-500">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />

          <Controller
            name="referenceInfo"
            control={form.control}
            render={({ field }) => (
              <div className="space-y-2">
                <Label htmlFor="reference" className="text-slate-600">
                  Notas o Referencia <span className="font-normal text-slate-400">(Opcional)</span>
                </Label>
                <Input
                  {...field}
                  id="reference"
                  placeholder="Ej. Terminación 4599"
                  className="bg-slate-50"
                />
              </div>
            )}
          />
        </form>

        <DialogFooter className="gap-2 border-t border-slate-100 pt-3 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isPending} className="text-xs">
            Cancelar
          </Button>
          <Button
            type="submit"
            form="payment-form"
            disabled={isPending || (isUSD && !amountMXN)}
            className="inline-flex min-w-[140px] items-center justify-center gap-1.5 bg-emerald-600 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
          >
            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>{isPending ? "Guardando..." : "Guardar Abono"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
