"use client";

import { useEffect } from "react";
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
} from "@/features/travelers/schemas/enrollTravelerSchema";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  tourId: string;
  balance: number;
  correctionData?: { amount: number; method: string } | null;
}

export function RegisterPaymentModal({
  isOpen,
  onClose,
  bookingId,
  tourId,
  balance,
  correctionData,
}: Props) {
  const { mutate: createPayment, isPending } = useCreatePayment(tourId);
  console.log("hola");
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: balance, // UX: Autocompleta lo que debe
      method: "TRANSFER",
      type: "PAYMENT",
      referenceInfo: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        amount: correctionData ? correctionData.amount : balance,
        method: (correctionData ? correctionData.method : "TRANSFER") as
          "CASH" | "TRANSFER" | "CARD" | "OTHER",
        type: "PAYMENT",
        referenceInfo: "",
      });
    }
  }, [isOpen, balance, correctionData, form]);

  const onSubmit = (data: PaymentFormValues) => {
    createPayment(
      { bookingId, payload: data },
      {
        onSuccess: () => {
          form.reset();
          onClose(); // Cerramos el modal solo si el backend respondió OK
        },
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Abono</DialogTitle>
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
                <Label htmlFor="amount">Monto a abonar (MXN)</Label>
                <Input
                  {...field}
                  id="amount"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  className="h-14 text-2xl font-bold"
                  autoFocus
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
                {fieldState.error && (
                  <p className="text-xs font-medium text-red-500">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />

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
            disabled={isPending}
            className="min-w-[140px] bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {isPending ? "Registrando..." : "Guardar Abono"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
