"use client";

import Link from "next/link";
import { useFormContext, Controller } from "react-hook-form";
import { Wallet, Info, ArrowRight, Landmark } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencySelector } from "../CurrencySelector";
import { useAgency } from "@/features/settings/hooks/useAgency";
import { TourInput } from "@/features/tours/schemas/tour.schema";

export function TourFinanceSection() {
  const { control, watch } = useFormContext<TourInput>();
  const { data: agencyData } = useAgency();

  const selectedCurrency = watch("currency");

  // Observamos los valores directamente del contexto global
  const acceptsBankTransfer = watch("acceptsBankTransfer");
  const acceptsCreditCard = watch("acceptsCreditCard");
  const acceptsCash = watch("acceptsCash");

  const depositPerPerson = watch("depositPerPerson") || 0;

  return (
    <div className="space-y-5 rounded-xl border border-indigo-100 bg-indigo-50/30 p-5 sm:p-6">
      <div className="flex items-center gap-2 pb-1 text-indigo-700">
        <Wallet className="h-5 w-5" />
        <h3 className="text-lg font-semibold">3. Finanzas y Medios de Pago</h3>
      </div>

      <CurrencySelector />

      {/* --- SECCIÓN DE PRECIOS --- */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Controller
          name="price"
          control={control}
          render={({ field, fieldState }) => (
            <div className="space-y-1.5">
              <Label htmlFor="tour-price" className="text-xs font-bold text-slate-700">
                Precio Total por Pasajero ({selectedCurrency}){" "}
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xs font-bold text-slate-400">
                  $ {selectedCurrency}
                </div>
                <Input
                  {...field}
                  id="tour-price"
                  type="number"
                  min="0"
                  step="any"
                  className="rounded-xl bg-white pl-14 text-sm font-semibold text-slate-900"
                  value={field.value === 0 ? "" : field.value}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === "" ? 0 : Number(val));
                  }}
                />
              </div>
              {fieldState.error && (
                <p className="text-xs text-red-500">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />

        <Controller
          name="depositPerPerson"
          control={control}
          render={({ field, fieldState }) => (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="tour-deposit" className="text-xs font-bold text-slate-700">
                  Anticipo por pasajero ({selectedCurrency})
                </Label>
                <span className="rounded border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">
                  APARTADO
                </span>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xs font-bold text-slate-400">
                  $ {selectedCurrency}
                </div>
                <Input
                  {...field}
                  id="tour-deposit"
                  type="number"
                  min="0"
                  step="any"
                  value={field.value === 0 ? "" : field.value}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === "" ? 0 : Number(val));
                  }}
                  className="rounded-xl bg-white pl-14 text-sm font-semibold text-slate-900"
                />
              </div>
            </div>
          )}
        />
      </div>

      {/* --- MÉTODOS DE COBRO --- */}
      <div className="space-y-3 pt-2">
        <Label className="font-semibold text-slate-700">Métodos de cobro habilitados</Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* 1. TRANSFERENCIA */}
          <Controller
            name="acceptsBankTransfer"
            control={control}
            render={({ field }) => (
              <div
                onClick={() => field.onChange(!field.value)}
                className={`flex cursor-pointer items-center rounded-lg border p-3 transition-colors ${
                  field.value
                    ? "border-indigo-200 bg-indigo-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <Checkbox
                  checked={Boolean(field.value)}
                  tabIndex={-1}
                  className="pointer-events-none"
                />
                <span className="flex-1 pl-3 text-sm font-medium text-slate-700">
                  Transferencia
                </span>
              </div>
            )}
          />

          {/* 2. TARJETA / LINK */}
          <Controller
            name="acceptsCreditCard"
            control={control}
            render={({ field }) => (
              <div
                onClick={() => field.onChange(!field.value)}
                className={`flex cursor-pointer items-center rounded-lg border p-3 transition-colors ${
                  field.value
                    ? "border-indigo-200 bg-indigo-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <Checkbox
                  checked={Boolean(field.value)}
                  tabIndex={-1}
                  className="pointer-events-none"
                />
                <span className="flex-1 pl-3 text-sm font-medium text-slate-700">
                  Tarjeta / Link
                </span>
              </div>
            )}
          />

          {/* 3. EFECTIVO */}
          <Controller
            name="acceptsCash"
            control={control}
            render={({ field }) => (
              <div
                onClick={() => field.onChange(!field.value)}
                className={`flex cursor-pointer items-center rounded-lg border p-3 transition-colors ${
                  field.value
                    ? "border-indigo-200 bg-indigo-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <Checkbox
                  checked={Boolean(field.value)}
                  tabIndex={-1}
                  className="pointer-events-none"
                />
                <span className="flex-1 pl-3 text-sm font-medium text-slate-700">Efectivo</span>
              </div>
            )}
          />
        </div>
      </div>

      {/* --- BLOQUE CONDICIONAL INFERIOR --- */}
      {(acceptsBankTransfer || acceptsCreditCard || acceptsCash) && (
        <div className="space-y-4 border-t border-indigo-100 pt-3">
          {acceptsBankTransfer && (
            <div className="space-y-3.5 rounded-xl border border-slate-200/90 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Landmark className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase">
                    Datos bancarios oficiales de tu agencia
                  </span>
                </div>
                <Link
                  href="/settings?tab=agency"
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Editar <ArrowRight className="inline h-3 w-3" />
                </Link>
              </div>
              <p className="text-xs text-slate-600">
                Banco: <strong>{agencyData?.bankName || "No configurado"}</strong> | CLABE:{" "}
                <strong>{agencyData?.clabeNumber || "No configurada"}</strong>
              </p>
            </div>
          )}

          {acceptsCreditCard && (
            <Controller
              name="paymentLink"
              control={control}
              render={({ field, fieldState }) => (
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700">
                    Link de Pago (MercadoPago, Clip, etc.)
                  </Label>
                  <Input
                    {...field}
                    type="url"
                    value={field.value ?? ""}
                    placeholder="https://..."
                    className="bg-white"
                  />
                  {fieldState.error && (
                    <p className="text-xs text-red-500">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
          )}

          {acceptsCash && (
            <Controller
              name="cashInstructions"
              control={control}
              render={({ field, fieldState }) => (
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700">
                    Instrucciones para Efectivo
                  </Label>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Ej. Paga directo al abordar"
                    className="bg-white"
                  />
                  {fieldState.error && (
                    <p className="text-xs text-red-500">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}
