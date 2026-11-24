"use client";

import { useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/shared/NumericInput";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCreatePayment } from "@/features/tour-dashboard/hooks/usePayments";
import { Calculator, Check, Pencil, RotateCcw, X } from "lucide-react";
import {
  buildPaymentFormSchema,
  type CreatePaymentInput,
  type PaymentFormInput,
} from "@/features/tour-dashboard/schemas/payment.schema";
import {
  convertMxnToUsd,
  formatExchangeRate,
} from "@/features/tour-dashboard/utils/exchange-rate.util";
import { formatCurrency } from "@/shared/utils/currency.util";
import type { Currency, PaymentMethod, PaymentType } from "@/shared/constants/domain.constants";
import { CURRENCY, PAYMENT_METHOD, PAYMENT_TYPE } from "@/shared/constants/domain.constants";

interface RegisterPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  tourCurrency?: Currency;
  tourId: string;
  balance: number;
  correctionData?: { amount: number; method: PaymentMethod } | null;
  mode?: PaymentType;
  /** Titular de la reserva: subtítulo del modal en tours USD. */
  holderName?: string;
}

export function RegisterPaymentModal({ isOpen, onClose, ...formProps }: RegisterPaymentModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-md [&>button]:hidden">
        <RegisterPaymentForm {...formProps} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}

function RegisterPaymentForm({
  onClose,
  bookingId,
  tourId,
  tourCurrency,
  balance,
  correctionData,
  mode = PAYMENT_TYPE.PAYMENT,
  holderName,
}: Omit<RegisterPaymentModalProps, "isOpen">) {
  const isRefund = mode === PAYMENT_TYPE.REFUND;
  const { mutate: createPayment, isPending } = useCreatePayment(tourId);
  const isUSD = tourCurrency === CURRENCY.USD;

  // Una corrección precarga el monto y el método del abono anulado; si no, el saldo y SPEI. En USD
  // el monto sale de los pesos y el tipo de cambio (RB-PAG-004), así que empieza vacío.
  const form = useForm<PaymentFormInput>({
    resolver: zodResolver(buildPaymentFormSchema({ isUSD })),
    defaultValues: {
      amount: correctionData ? correctionData.amount : isUSD ? 0 : balance,
      method: correctionData ? correctionData.method : PAYMENT_METHOD.TRANSFER,
      type: PAYMENT_TYPE.PAYMENT,
      referenceInfo: "",
      collectedAmount: 0,
      exchangeRate: 0,
    },
  });

  const [amountUSD, watchedMXN, watchedRate] = useWatch({
    control: form.control,
    name: ["amount", "collectedAmount", "exchangeRate"],
  });
  const amountMXN = watchedMXN ?? 0;
  const exchangeRate = watchedRate ?? 0;

  // Los USD se recalculan solo al editar los pesos o el tipo de cambio: si el operador ajusta los
  // centavos a mano, su valor se conserva hasta que vuelva a cambiar alguno de los dos.
  const [isAdjustingUSD, setIsAdjustingUSD] = useState(false);
  const recalculateUSD = (nextMXN: number, nextRate: number) => {
    setIsAdjustingUSD(false);
    form.setValue("amount", convertMxnToUsd(nextMXN, nextRate) ?? 0, { shouldDirty: true });
  };

  const onSubmit = (formData: PaymentFormInput): void => {
    // Un reembolso nunca supera el saldo a reembolsar (la API también lo valida).
    if (isRefund && formData.amount > balance) {
      form.setError("amount", {
        message: `El reembolso no puede superar ${formatCurrency(balance, { currency: tourCurrency })}`,
      });
      return;
    }
    // Un abono nunca supera el saldo pendiente (decisión del usuario, 2026-11-17; la API también lo
    // valida). En una corrección ("Anular y corregir") el saldo puede llegar antes de que se recargue
    // el Centro de Control: se admite hasta el monto anulado y la API revisa el saldo real.
    const maxPayment = correctionData ? Math.max(balance, correctionData.amount) : balance;
    if (!isRefund && formData.amount > maxPayment + 0.005) {
      form.setError("amount", {
        message: `El abono no puede superar el saldo pendiente de ${formatCurrency(maxPayment, { currency: tourCurrency })}`,
      });
      return;
    }
    // Se envía exactamente lo capturado: la API no recalcula los USD.
    const payload: CreatePaymentInput = {
      amount: formData.amount,
      currency: isUSD ? CURRENCY.USD : CURRENCY.MXN,
      method: formData.method,
      type: mode,
      referenceInfo: formData.referenceInfo,
      ...(isUSD && {
        collectedAmount: formData.collectedAmount,
        collectedCurrency: CURRENCY.MXN,
        exchangeRate: formData.exchangeRate,
      }),
    };

    createPayment(
      { bookingId, payload },
      {
        // Al cerrar, el formulario se desmonta: la próxima apertura empieza de cero.
        onSuccess: onClose,
      },
    );
  };

  const inputClassName =
    "block w-full [appearance:textfield] rounded-lg border border-slate-200 py-2 pr-12 pl-7 text-base font-medium text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
  const labelClassName = "block text-[11px] font-bold tracking-wider text-slate-700 uppercase";

  const amountLabel = isUSD
    ? isRefund
      ? "Monto a descontar del saldo (USD) *"
      : "Monto a acreditar en la reserva (USD) *"
    : isRefund
      ? "Monto reembolsado (MXN) *"
      : "Monto a abonar (MXN) *";

  const amountField = (
    <Controller
      name="amount"
      control={form.control}
      render={({ field, fieldState }) => (
        <div className="space-y-1.5">
          <Label htmlFor="amount" className={labelClassName}>
            {amountLabel}
          </Label>
          <div className="relative rounded-lg shadow-2xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="font-medium text-slate-400 sm:text-sm">$</span>
            </div>
            <NumericInput
              id="amount"
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={field.value}
              onValueChange={field.onChange}
              step="0.01"
              autoFocus={!isUSD}
              onFocus={(e) => e.target.select()}
              className={inputClassName}
            />
            {isUSD && (
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-sm font-semibold text-slate-400">USD</span>
              </div>
            )}
          </div>
          {isUSD && !fieldState.error && (
            <p className="text-[11px] text-slate-400">
              Se calcula con los pesos y el tipo de cambio. Puedes ajustar los centavos antes de
              guardar.
            </p>
          )}
          {fieldState.error && (
            <p className="text-xs font-medium text-red-500">{fieldState.error.message}</p>
          )}
        </div>
      )}
    />
  );

  const calculatedUSD = convertMxnToUsd(amountMXN, exchangeRate) ?? 0;
  const isManualUSD = amountUSD > 0 && Math.abs(amountUSD - calculatedUSD) > 0.0049;
  const resultingBalance = Math.max(0, Math.round((balance - (amountUSD || 0)) * 100) / 100);
  const canSubmitUSD = amountMXN > 0 && exchangeRate > 0 && amountUSD > 0;

  return (
    <>
      <DialogHeader className="relative border-b border-slate-100 pb-3 text-left">
        {isUSD && (
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            aria-label="Cerrar"
            className="absolute top-0 right-0 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
        <div className="flex items-center gap-2.5 pr-6">
          {" "}
          <DialogTitle className="text-lg font-bold text-slate-900">
            {isRefund ? "Registrar Reembolso" : "Registrar Abono"}
          </DialogTitle>
          {isUSD && (
            <span className="inline-flex items-center rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              Tour en USD
            </span>
          )}
        </div>
        {isUSD ? (
          <DialogDescription className="mt-1 text-sm font-medium text-slate-600">
            {holderName ?? "Pago en pesos acreditado en dólares"}
          </DialogDescription>
        ) : (
          <DialogDescription className="mt-0.5 text-xs text-slate-500">
            {isRefund ? "Saldo a reembolsar al cliente:" : "El saldo pendiente actual es de"}{" "}
            <span className="font-semibold text-slate-800">
              {formatCurrency(balance, { currency: tourCurrency })}
            </span>
          </DialogDescription>
        )}
      </DialogHeader>

      <form
        id="payment-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="-mx-4 min-h-0 space-y-4 overflow-y-auto px-4 py-1"
      >
        {!isUSD && amountField}

        {/* Tours en USD (RB-PAG-004): pesos → tipo de cambio → dólares calculados (ajustables). */}
        {isUSD && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2">
              <span className="text-xs font-semibold tracking-wider text-slate-600 uppercase">
                {isRefund ? "Saldo a reembolsar:" : "Saldo pendiente actual:"}
              </span>
              <span className="font-mono text-base font-bold text-rose-600">
                {formatCurrency(balance, { currency: CURRENCY.USD })}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Controller
                name="collectedAmount"
                control={form.control}
                render={({ field, fieldState }) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="collectedAmount" className={labelClassName}>
                      {isRefund ? "1. Monto devuelto (MXN) *" : "1. Monto recibido (MXN) *"}
                    </Label>
                    <div className="relative rounded-lg shadow-2xs">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="font-medium text-slate-400 sm:text-sm">$</span>
                      </div>
                      <NumericInput
                        id="collectedAmount"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          recalculateUSD(value, exchangeRate);
                        }}
                        step="0.01"
                        placeholder="0.00"
                        autoFocus
                        className={inputClassName}
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-sm font-semibold text-slate-400">MXN</span>
                      </div>
                    </div>
                    {fieldState.error && (
                      <p className="text-xs font-medium text-red-500">{fieldState.error.message}</p>
                    )}
                  </div>
                )}
              />

              <Controller
                name="exchangeRate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="exchangeRate" className={labelClassName}>
                      2. Tipo de cambio aplicado *
                    </Label>
                    <div className="relative rounded-lg shadow-2xs">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="font-medium text-slate-400 sm:text-sm">$</span>
                      </div>
                      <NumericInput
                        id="exchangeRate"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          recalculateUSD(amountMXN, value);
                        }}
                        step="0.0001"
                        placeholder="18.00"
                        className={`${inputClassName} pr-20`}
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-xs font-semibold text-slate-400">MXN/USD</span>
                      </div>
                    </div>
                    {fieldState.error && (
                      <p className="text-xs font-medium text-red-500">{fieldState.error.message}</p>
                    )}
                  </div>
                )}
              />
            </div>

            <Controller
              name="amount"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="space-y-2 rounded-xl border border-indigo-100 bg-indigo-50/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label
                      htmlFor="amount"
                      className="text-xs font-bold tracking-wider text-indigo-950 uppercase"
                    >
                      {isRefund
                        ? "3. Monto a descontar del saldo (USD)"
                        : "3. Monto a acreditar en la reserva (USD)"}
                    </Label>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200/60 bg-white/80 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                      <Calculator className="h-3 w-3" aria-hidden="true" />
                      {isManualUSD ? "Ajustado a mano" : "Cálculo en vivo"}
                    </span>
                  </div>

                  {isAdjustingUSD ? (
                    <div className="relative rounded-lg shadow-2xs">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="font-medium text-slate-400 sm:text-sm">$</span>
                      </div>
                      <NumericInput
                        id="amount"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={field.value}
                        onValueChange={field.onChange}
                        step="0.01"
                        autoFocus
                        onFocus={(e) => e.target.select()}
                        className={`${inputClassName} bg-white`}
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-sm font-semibold text-slate-400">USD</span>
                      </div>
                    </div>
                  ) : (
                    <output
                      id="amount"
                      aria-live="polite"
                      className="block font-mono text-2xl font-extrabold tracking-tight text-indigo-600"
                    >
                      {formatCurrency(field.value || 0, { currency: CURRENCY.USD })}
                    </output>
                  )}

                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {!isAdjustingUSD && (
                      <button
                        type="button"
                        onClick={() => setIsAdjustingUSD(true)}
                        disabled={!(amountUSD > 0)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:pointer-events-none disabled:opacity-40"
                      >
                        <Pencil className="h-3 w-3" aria-hidden="true" /> Ajustar centavos
                      </button>
                    )}
                    {isManualUSD && calculatedUSD > 0 && (
                      <button
                        type="button"
                        onClick={() => recalculateUSD(amountMXN, exchangeRate)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
                      >
                        <RotateCcw className="h-3 w-3" aria-hidden="true" /> Volver al cálculo (
                        {formatCurrency(calculatedUSD, { currency: CURRENCY.USD })})
                      </button>
                    )}
                  </div>

                  {fieldState.error && (
                    <p className="text-xs font-medium text-red-500">{fieldState.error.message}</p>
                  )}

                  {canSubmitUSD && (
                    <p
                      className="rounded-lg border border-indigo-100 bg-white/90 px-2.5 py-1.5 text-xs leading-snug text-slate-600"
                      data-testid="usd-summary"
                    >
                      {isRefund ? "Devuelves" : "Recibes"}{" "}
                      <strong className="font-semibold text-slate-900">
                        {formatCurrency(amountMXN, { currency: CURRENCY.MXN })}
                      </strong>{" "}
                      a T.C.{" "}
                      <strong className="font-semibold text-slate-900">
                        ${formatExchangeRate(exchangeRate)}
                      </strong>{" "}
                      → {isRefund ? "Se descuentan" : "Se abonan"}{" "}
                      <strong className="font-bold text-indigo-700">
                        {formatCurrency(amountUSD, { currency: CURRENCY.USD })}
                      </strong>
                      .
                    </p>
                  )}

                  <dl className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg border border-indigo-50 bg-white/60 px-2 py-1.5">
                      <dt className="text-[10px] font-bold text-slate-600 uppercase">
                        {isRefund ? "Por reembolsar" : "Saldo anterior"}
                      </dt>
                      <dd className="mt-0.5 text-xs font-bold text-slate-900">
                        {formatCurrency(balance, { currency: CURRENCY.USD })}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-2 py-1.5">
                      <dt className="text-[10px] font-bold text-emerald-800 uppercase">
                        {isRefund ? "Reembolso" : "Abono aplicado"}
                      </dt>
                      <dd className="mt-0.5 text-xs font-bold text-emerald-700">
                        -{formatCurrency(amountUSD || 0, { currency: CURRENCY.USD })}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-indigo-50 bg-white/60 px-2 py-1.5">
                      <dt className="text-[10px] font-bold text-slate-600 uppercase">
                        {isRefund ? "Restante" : "Nuevo saldo"}
                      </dt>
                      <dd className="mt-0.5 text-xs font-bold text-slate-900">
                        {formatCurrency(resultingBalance, { currency: CURRENCY.USD })}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            />
          </div>
        )}

        <Controller
          name="method"
          control={form.control}
          render={({ field, fieldState }) => (
            <div className="space-y-2 pt-2">
              <Label>{isRefund ? "Método de devolución" : "Método de cobro"}</Label>
              <div className="grid grid-cols-3 gap-2">
                <label
                  className={`cursor-pointer rounded-md border p-2.5 text-center text-sm transition-colors ${field.value === PAYMENT_METHOD.CASH ? "border-indigo-300 bg-indigo-50 font-semibold text-indigo-700 shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <input
                    type="radio"
                    className="hidden"
                    {...field}
                    value={PAYMENT_METHOD.CASH}
                    checked={field.value === PAYMENT_METHOD.CASH}
                  />{" "}
                  Efectivo
                </label>
                <label
                  className={`cursor-pointer rounded-md border p-2.5 text-center text-sm transition-colors ${field.value === PAYMENT_METHOD.TRANSFER ? "border-indigo-300 bg-indigo-50 font-semibold text-indigo-700 shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <input
                    type="radio"
                    className="hidden"
                    {...field}
                    value={PAYMENT_METHOD.TRANSFER}
                    checked={field.value === PAYMENT_METHOD.TRANSFER}
                  />{" "}
                  SPEI / Transf.
                </label>
                <label
                  className={`cursor-pointer rounded-md border p-2.5 text-center text-sm transition-colors ${field.value === PAYMENT_METHOD.CARD ? "border-indigo-300 bg-indigo-50 font-semibold text-indigo-700 shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <input
                    type="radio"
                    className="hidden"
                    {...field}
                    value={PAYMENT_METHOD.CARD}
                    checked={field.value === PAYMENT_METHOD.CARD}
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
                placeholder={
                  isRefund
                    ? "Ej. SPEI devolución por mal clima – Ref: 98123"
                    : "Ej. Terminación 4599"
                }
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
          disabled={isPending || (isUSD && !canSubmitUSD)}
          className={`inline-flex min-w-[140px] items-center justify-center gap-1.5 text-xs font-semibold text-white shadow-sm transition active:scale-[0.98] ${
            isRefund ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>
            {isPending ? "Guardando..." : isRefund ? "Guardar Reembolso" : "Guardar Abono"}
          </span>
        </Button>
      </DialogFooter>
    </>
  );
}
