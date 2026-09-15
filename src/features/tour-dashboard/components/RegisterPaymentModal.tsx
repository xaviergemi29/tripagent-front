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
import { paymentFormSchema, type PaymentFormValues } from "@/features/travelers/schemas/enrollTravelerSchema";


interface Props {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  tourId: string;
  balance: number; // Para sugerir el monto por defecto
}

export function RegisterPaymentModal({ isOpen, onClose, bookingId, tourId, balance }: Props) {
  const { mutate: createPayment, isPending } = useCreatePayment(tourId);
    console.log("hola")
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: balance, // UX: Autocompleta lo que debe
      method: "TRANSFER",
      type: "PAYMENT",
      referenceInfo: "",
    },
  });

  // Sincronizar el default value si el balance cambia
  useEffect(() => {
    if (isOpen) form.reset({ amount: balance, method: "TRANSFER", type: "PAYMENT", referenceInfo: "" });
  }, [isOpen, balance, form]);

  const onSubmit = (data: PaymentFormValues) => {
    createPayment(
      { bookingId, payload: data },
      {
        onSuccess: () => {
          form.reset();
          onClose(); // Cerramos el modal solo si el backend respondió OK
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Abono</DialogTitle>
          <DialogDescription>
            El saldo pendiente actual es de <span className="font-bold text-slate-800">${balance}</span>
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
                  className="text-2xl font-bold h-14" 
                  autoFocus 
                  onFocus={(e) => e.target.select()} 
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
                {fieldState.error && <p className="text-xs text-red-500 font-medium">{fieldState.error.message}</p>}
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
                  <label className={`border rounded-md p-2.5 text-center text-sm cursor-pointer transition-colors ${field.value === "CASH" ? "bg-indigo-50 border-indigo-300 font-semibold text-indigo-700 shadow-sm" : "hover:bg-slate-50 text-slate-600"}`}>
                    <input type="radio" className="hidden" {...field} value="CASH" checked={field.value === "CASH"} /> Efectivo
                  </label>
                  <label className={`border rounded-md p-2.5 text-center text-sm cursor-pointer transition-colors ${field.value === "TRANSFER" ? "bg-indigo-50 border-indigo-300 font-semibold text-indigo-700 shadow-sm" : "hover:bg-slate-50 text-slate-600"}`}>
                    <input type="radio" className="hidden" {...field} value="TRANSFER" checked={field.value === "TRANSFER"} /> SPEI / Transf.
                  </label>
                  <label className={`border rounded-md p-2.5 text-center text-sm cursor-pointer transition-colors ${field.value === "CARD" ? "bg-indigo-50 border-indigo-300 font-semibold text-indigo-700 shadow-sm" : "hover:bg-slate-50 text-slate-600"}`}>
                    <input type="radio" className="hidden" {...field} value="CARD" checked={field.value === "CARD"} /> Tarjeta
                  </label>
                </div>
                {fieldState.error && <p className="text-xs text-red-500 font-medium">{fieldState.error.message}</p>}
              </div>
            )}
          />

          <Controller
            name="referenceInfo"
            control={form.control}
            render={({ field }) => (
              <div className="space-y-2">
                <Label htmlFor="reference" className="text-slate-600">Notas o Referencia <span className="text-slate-400 font-normal">(Opcional)</span></Label>
                <Input {...field} id="reference" placeholder="Ej. Terminación 4599" className="bg-slate-50" />
              </div>
            )}
          />
        </form>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button type="submit" form="payment-form" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]">
            {isPending ? "Registrando..." : "Guardar Abono"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}