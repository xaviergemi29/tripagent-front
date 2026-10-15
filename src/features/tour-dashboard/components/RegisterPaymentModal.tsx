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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreatePayment } from "../hooks/usePayments";
import {
  paymentFormSchema,
  type PaymentFormValues,
} from "@/features/travelers/schemas/enroll-traveler.schema";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { CreatePaymentPayload } from "../schemas/payment.schema";

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Abono</DialogTitle>
          {isUSD && (
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
              Tour en USD
            </Badge>
          )}
          <DialogDescription>
            El saldo pendiente actual es de{" "}
            <span className="font-bold text-slate-800">${balance}</span>
          </DialogDescription>
        </DialogHeader>

        <form id="payment-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-4">
          <Controller
            name="amount"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label htmlFor="amount">
                  {isUSD ? "Monto del abono en dólares (USD) *" : "Monto a abonar (MXN)"}
                </Label>

                {/* 🚀 FIX: Contenedor 'relative' añadido aquí */}
                <div className="relative">
                  <Input
                    {...field}
                    id="amount"
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    /* 🚀 FIX: pr-14 para que el texto no pise el sufijo, y clases para ocultar el spinner nativo */
                    className="h-14 [appearance:textfield] pr-14 text-2xl font-bold [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    autoFocus
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                  {isUSD && (
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
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
            <div className="animate-in fade-in slide-in-from-top-2 space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="space-y-2">
                <Label htmlFor="amountMXN">
                  Equivalente en pesos mexicanos (MXN) *
                  <span className="ml-1 block text-[10px] font-normal text-slate-500">
                    Monto cobrado en ventanilla o banco
                  </span>
                </Label>
                <div className="relative">
                  <Input
                    id="amountMXN"
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={amountMXN}
                    placeholder="Ej. 2000"
                    required
                    className="[appearance:textfield] pr-14 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    onChange={(e) => setAmountMXN(e.target.value)}
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    <span className="text-sm font-semibold text-slate-400">MXN</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  Ingresa el monto recibido en pesos según el tipo de cambio pactado.
                </p>
              </div>

              {Number(amountMXN) > 0 && watchAmountUSD > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-indigo-100 bg-indigo-50/50 p-2.5 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-indigo-600" />
                    Tipo de cambio resultante:
                  </span>
                  <span className="font-mono font-semibold text-slate-800">
                    ${resultingRate} MXN / USD
                  </span>
                </div>
              )}
            </div>
          )}

          <Controller
            name="method"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="space-y-2">
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

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="payment-form"
            disabled={isPending || (isUSD && !amountMXN)}
            className="min-w-[140px] bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {isPending ? "Registrando..." : "Guardar Abono"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
