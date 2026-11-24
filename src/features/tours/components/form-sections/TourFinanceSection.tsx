"use client";

import { Controller, useFormContext, useFormState, useWatch } from "react-hook-form";
import { useState, type ComponentProps } from "react";
import { QueryErrorState } from "@/components/shared/QueryErrorState";
import { AlertCircle, AlertTriangle, Info, Lock, Wallet } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/shared/NumericInput";
import { Label } from "@/components/ui/label";
import { DEFAULT_CURRENCY } from "@/shared/constants/domain.constants";
import { formatCurrency } from "@/shared/utils/currency.util";
import type { AgencyOutput } from "@/features/settings/schemas/agency.schema";
import { TRANSFER_WITHOUT_CLABE_ERROR, type TourInput } from "../../schemas/tour.schema";
import { CurrencySelector } from "../CurrencySelector";
import { AgencyBankDetailsBanner } from "../AgencyBankDetailsBanner";
import { BankAccountQuickModal } from "@/features/settings/components/BankAccountQuickModal";

interface TourFinanceSectionProps {
  /** Con pagos registrados, la moneda y el precio no se editan (regla 15; la API responde 409). */
  isPricingFrozen: boolean;
  /** Datos bancarios de la agencia (Configuración → Agencia) para el aviso de transferencia. */
  agency?: Pick<AgencyOutput, "bankName" | "bankAccountHolder" | "clabeNumber" | "cardNumber">;
  /** La consulta de la agencia falló sin datos: no se afirma que "no hay cuentas configuradas". */
  agencyLoadFailed?: boolean;
  onRetryAgency?: () => void;
  isRetryingAgency?: boolean;
}

/** Campo numérico de dinero (vacío ⇄ 0, ver `NumericInput`) con el código de divisa como prefijo. */
function MoneyInput({
  currency,
  ...inputProps
}: { currency: string } & ComponentProps<typeof NumericInput>) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xs font-bold text-slate-400">
        $ {currency}
      </div>
      <NumericInput
        min="0"
        step="any"
        className="rounded-xl bg-white pl-14 text-base font-semibold text-slate-900 sm:text-sm"
        {...inputProps}
      />
    </div>
  );
}

const PAYMENT_METHOD_TOGGLES = [
  { name: "acceptsBankTransfer", label: "Transferencia" },
  { name: "acceptsCreditCard", label: "Tarjeta" },
  { name: "acceptsCash", label: "Efectivo" },
] as const;

/**
 * Sección 3 del formulario de tour: moneda, precio, anticipo, métodos de cobro y los datos que
 * cada método necesita (cuentas de la agencia, link de pago, instrucciones de efectivo).
 */
export function TourFinanceSection({
  isPricingFrozen,
  agency,
  agencyLoadFailed = false,
  onRetryAgency,
  isRetryingAgency = false,
}: TourFinanceSectionProps) {
  const { control } = useFormContext<TourInput>();
  // Modal "Configurar cuenta ahora" (OBS-038): guarda la CLABE sin salir del formulario del tour.
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  // `useFormState` (no `formState` del contexto): compatible con el React Compiler.
  const formState = useFormState({ control });
  // `useWatch` (no `watch`): compatible con el React Compiler.
  const [selectedCurrency, acceptsBankTransfer, acceptsCreditCard, acceptsCash, depositValue] =
    useWatch({
      control,
      name: [
        "currency",
        "acceptsBankTransfer",
        "acceptsCreditCard",
        "acceptsCash",
        "depositPerPerson",
      ],
    });
  const depositPerPerson = depositValue || 0;
  const currency = selectedCurrency || DEFAULT_CURRENCY;
  // Misma condición que `buildTourFormSchema` (solo con los datos de la agencia ya cargados).
  const transferWithoutClabe =
    !!agency &&
    !agency.clabeNumber?.trim() &&
    !!acceptsBankTransfer &&
    !acceptsCreditCard &&
    !acceptsCash;

  return (
    <div className="space-y-5 rounded-xl border border-indigo-100 bg-indigo-50/30 p-5 sm:p-6">
      <div className="flex items-center gap-2 pb-1 text-indigo-700">
        <Wallet className="h-5 w-5" />
        <h3 className="text-lg font-semibold">3. Finanzas y Medios de Pago</h3>
      </div>

      {isPricingFrozen && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-900">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            <strong>Moneda y precio congelados.</strong> Este tour ya tiene pagos registrados, así
            que no puedes cambiar la moneda ni el precio por pasajero. El anticipo sí se puede
            ajustar: al guardarlo se recalcula el estado de cada reserva.
          </p>
        </div>
      )}

      <CurrencySelector disabled={isPricingFrozen} />

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
              <MoneyInput
                id="tour-price"
                currency={String(selectedCurrency)}
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={field.value}
                onValueChange={field.onChange}
                disabled={isPricingFrozen}
              />
              {fieldState.error && (
                <p className="flex items-center gap-1 text-xs font-medium text-red-500">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {fieldState.error.message}
                </p>
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
              <MoneyInput
                id="tour-deposit"
                currency={String(selectedCurrency)}
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={field.value}
                onValueChange={field.onChange}
              />

              {/* Error del anticipo o ayuda con lo que pagará el cliente hoy */}
              <div className="min-h-[24px] pt-1">
                {fieldState.error ? (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {fieldState.error.message}
                  </p>
                ) : (
                  Number(depositPerPerson) > 0 && (
                    <div className="flex items-start gap-1.5 text-[11px] leading-tight">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="font-medium text-indigo-600">
                        Pagará <strong>{formatCurrency(depositPerPerson, { currency })} hoy</strong>{" "}
                        y liquidará antes de salir.
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        />
      </div>

      {/* Anticipo $0: el cliente paga todo para asegurar su lugar. Antes era una línea gris de 11 px
          que los operadores no leían; ahora es un aviso destacado debajo de los precios. */}
      {Number(depositPerPerson) === 0 && (
        <Alert className="border-sky-200 bg-sky-50 px-3.5 py-3 text-sky-950">
          <Info className="text-sky-600" />
          <AlertTitle className="font-semibold text-sky-950">Sin anticipo</AlertTitle>
          <AlertDescription className="text-sky-900">
            <p>
              En <strong>{formatCurrency(0, { currency })}</strong> el cliente pagará el 100% para
              asegurar lugares.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3 pt-2">
        <Label className="font-semibold text-slate-700">Métodos de cobro habilitados</Label>
        {/* Solo transferencia y la agencia sin CLABE (OBS-038): el schema deshabilita "Guardar" y aquí
            se explica por qué en cuanto pasa (el error de raíz solo se dibuja al enviar). */}
        {transferWithoutClabe && (
          <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-red-500">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {TRANSFER_WITHOUT_CLABE_ERROR}
          </p>
        )}
        {formState.errors.root?.paymentMethods && !transferWithoutClabe && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-red-500">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {formState.errors.root?.paymentMethods.message as string}
          </p>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PAYMENT_METHOD_TOGGLES.map(({ name, label }) => (
            <Controller
              key={name}
              name={name}
              control={control}
              render={({ field }) => (
                <div
                  className={`flex items-center rounded-lg border p-3 transition-colors ${field.value ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white"}`}
                >
                  <Checkbox id={name} checked={field.value} onCheckedChange={field.onChange} />
                  <Label
                    htmlFor={name}
                    className="flex-1 cursor-pointer pl-3 text-sm font-medium text-slate-700"
                  >
                    {label}
                  </Label>
                </div>
              )}
            />
          ))}
        </div>
      </div>

      {/* Datos que necesita cada método habilitado */}
      {(acceptsBankTransfer || acceptsCreditCard || acceptsCash) && (
        <div className="space-y-4 border-t border-indigo-100 pt-3">
          {acceptsBankTransfer && agencyLoadFailed && (
            // Sin los datos de la agencia no se sabe si tiene cuentas: antes decía "Aún no has
            // configurado las cuentas bancarias" aunque sí las tuviera (2026-11-16).
            <QueryErrorState
              variant="compact"
              resourceArticle="las"
              resourceName="cuentas bancarias de tu agencia"
              onRetry={() => onRetryAgency?.()}
              isRetrying={isRetryingAgency}
            />
          )}
          {acceptsBankTransfer && !agencyLoadFailed && (
            <AgencyBankDetailsBanner
              bankName={agency?.bankName}
              accountHolder={agency?.bankAccountHolder}
              clabe={agency?.clabeNumber}
              // Dato de la agencia (Configuración → Agencia), no del tour.
              cardNumber={agency?.cardNumber}
              settingsUrl="/settings?tab=agency"
              onConfigure={() => setIsBankModalOpen(true)}
            />
          )}

          {/* Tarjeta sin enlace de pago (2026-11-22): el Magic Link ofrece contactar a la agencia. */}
          {acceptsCreditCard && (
            <Alert className="border-amber-300 bg-amber-50 px-3.5 py-3 text-amber-950">
              <AlertTriangle className="text-amber-600" />
              <AlertTitle className="font-semibold text-amber-950">Pago con tarjeta</AlertTitle>
              <AlertDescription className="text-amber-900">
                <p>
                  Tus viajeros verán la opción de pagar con tarjeta y te escribirán por WhatsApp
                  para que les compartas cómo hacerlo.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {acceptsCash && (
            <Controller
              name="cashInstructions"
              control={control}
              render={({ field, fieldState }) => (
                <div className="space-y-1.5">
                  <Label
                    htmlFor="tour-finance-instrucciones-para-efectivo"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Instrucciones para Efectivo
                  </Label>
                  <Input
                    id="tour-finance-instrucciones-para-efectivo"
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
      <BankAccountQuickModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        defaultValues={{
          bankName: agency?.bankName ?? "",
          bankAccountHolder: agency?.bankAccountHolder ?? "",
        }}
      />
    </div>
  );
}
