"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, FormProvider, Controller } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Save, Wallet, Info, AlertCircle, Lock } from "lucide-react";

import { TOUR_FORM_COPY } from "../constants/copy";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

import { tourSchema, type TourInput, type TourOutput } from "../schemas/tour.schema";
import {
  extractTourId,
  useCreateTour,
  useUpdateTour,
  useUploadTourBrochure,
} from "../hooks/useTours";
import { formatForDateInput } from "@/shared/utils/tour-date.util";
import { useAgency } from "@/features/settings/hooks/useAgency";
import { CurrencySelector } from "./CurrencySelector";
import { TourGeneralSection } from "./form-sections/TourGeneralSection";
import { TourBoardingSection } from "./form-sections/TourBoardingSection";
import { TourAssetSection } from "./form-sections/TourAssetSection";
import { AgencyBankDetailsBanner } from "./AgencyBankDetailsBanner";
import { DEFAULT_CURRENCY } from "@/shared/constants/domain.constants";
import { buildApiPublicFileUrl } from "@/shared/utils/share-links.util";

interface TourFormProps {
  tour?: TourOutput;
}

export function TourForm({ tour }: TourFormProps) {
  const isEditing = !!tour;
  const router = useRouter();

  // La API sirve los archivos en `<origen>/public/...`, fuera del prefijo `/api`.
  const initialBrochureUrl = tour?.brochureUrl ? buildApiPublicFileUrl(tour.brochureUrl) : null;
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [existingBrochure, setExistingBrochure] = useState<string | null>(initialBrochureUrl);

  const { mutateAsync: createTour, isPending: isCreating } = useCreateTour();
  const { mutateAsync: updateTour, isPending: isUpdating } = useUpdateTour();
  const { mutateAsync: uploadBrochureTour, isPending: isUploading } = useUploadTourBrochure();
  const { data: agencyData } = useAgency();

  // Incluye la subida del folleto: mientras sube, "Guardar" sigue deshabilitado (evita duplicados).
  const isProcessing = isCreating || isUpdating || isUploading;
  // Decisión del PM: con pagos registrados, la moneda y el precio por pasajero no se editan
  // (protege la contabilidad). La API también lo valida y responde 409.
  const isPricingFrozen = !!tour?.hasPayments;

  const form = useForm<TourInput>({
    resolver: zodResolver(tourSchema),
    mode: "onChange",
    defaultValues: tour
      ? {
          ...tour,
          depositPerPerson: tour.depositPerPerson ?? 0,
          currency: tour.currency ?? DEFAULT_CURRENCY,
        }
      : {
          title: "",
          description: "",
          price: 0,
          currency: "MXN",
          departureDateTime: "",
          maxCapacity: 0,
          staffCapacity: 0,
          isActive: true,
          acceptsBankTransfer: false,
          acceptsCreditCard: false,
          paymentLink: "",
          acceptsCash: false,
          cashInstructions: "",
          boardingPoints: [{ location: "", time: "06:00" }],
          postPaymentInstructions: "",
          depositPerPerson: 0,
          destinationType: "NATIONAL",
        },
  });

  // `useWatch` (no `form.watch`): compatible con el React Compiler.
  const [
    selectedCurrency,
    acceptsBankTransfer,
    acceptsCreditCard,
    acceptsCash,
    depositValue,
    price,
    departureDateTime,
    returnDate,
    maxCapacity,
  ] = useWatch({
    control: form.control,
    name: [
      "currency",
      "acceptsBankTransfer",
      "acceptsCreditCard",
      "acceptsCash",
      "depositPerPerson",
      "price",
      "departureDateTime",
      "returnDate",
      "maxCapacity",
    ],
  });
  const depositPerPerson = depositValue || 0;

  useEffect(() => {
    form.trigger(["depositPerPerson", "price"]);
  }, [price, depositPerPerson, form]);

  useEffect(() => {
    if (form.getFieldState("staffCapacity").isDirty) form.trigger("staffCapacity");
  }, [maxCapacity, form]);

  useEffect(() => {
    if (returnDate && departureDateTime) {
      form.trigger(["returnDate", "departureDateTime"]);
    }
  }, [departureDateTime, returnDate, form]);

  useEffect(() => {
    if (tour) {
      form.reset({
        ...tour,
        currency: tour.currency ?? DEFAULT_CURRENCY,
        departureDateTime: formatForDateInput(tour?.departureDateTime),
        paymentLink: tour.paymentLink ?? "",
        cashInstructions: tour.cashInstructions ?? "",
        description: tour.description ?? "",
        postPaymentInstructions: tour.postPaymentInstructions ?? "",
        destinationType: tour.destinationType ?? "NATIONAL",
      });
      // Valida al cargar: si el tour guardado no cumple una regla (p. ej. una regla que solo valida
      // el front), el operador ve los campos en rojo en lugar de un botón deshabilitado sin motivo.
      form.trigger();
    }
  }, [tour, form]);

  // "Limpiar" también regresa el folleto a su estado inicial (vive fuera del formulario).
  const handleReset = (): void => {
    form.reset();
    setBrochureFile(null);
    setExistingBrochure(initialBrochureUrl);
  };

  /**
   * Sube el folleto después de guardar el tour. Si falla, el tour YA está guardado: se avisa y,
   * al crear, se lleva al operador a la edición del tour nuevo para reintentar ahí. Así un segundo
   * clic en "Guardar Tour" nunca crea un tour duplicado. El hook ya muestra el error de la API.
   */
  const uploadBrochureAfterSave = async (tourId: string): Promise<boolean> => {
    if (!brochureFile) return true;
    try {
      await uploadBrochureTour({ tourId, file: brochureFile });
      return true;
    } catch {
      toast.warning("El tour se guardó, pero el folleto no se subió", {
        description: "Vuelve a adjuntar el PDF desde la edición del tour.",
      });
      if (!isEditing) router.push(`/tours/${tourId}/edit`);
      return false;
    }
  };

  const onSubmit = async (formData: TourInput): Promise<void> => {
    try {
      let currentTourId = tour?.id || "";

      // 1. Sanitización de capa de red: Convertir cadenas vacías ("") a explícito null
      const basePayload = {
        ...formData,
        paymentLink: formData.paymentLink?.trim() || null,
        cashInstructions: formData.cashInstructions?.trim() || null,
        postPaymentInstructions: formData.postPaymentInstructions?.trim() || null,
        returnDate: formData.returnDate?.trim() || null,
      };

      if (isEditing && tour.id) {
        // 2. Flujo de Edición: el folleto se quita solo si el operador lo eliminó y no adjuntó otro.
        const removeBrochure =
          Boolean(tour.brochureUrl) && existingBrochure === null && brochureFile === null;
        const updatePayload = { ...basePayload, removeBrochure };
        await updateTour({ tourId: tour.id, tourData: updatePayload });
      } else {
        // 3. Flujo de Creación: Enviamos el payload limpio (sin removeBrochure)
        const response = await createTour(basePayload);
        currentTourId = extractTourId(response) ?? "";
      }

      // Folleto post-persistencia (endpoint aparte). Si falla, el tour ya quedó guardado.
      if (currentTourId && !(await uploadBrochureAfterSave(currentTourId))) return;

      form.reset();
      setBrochureFile(null);
      router.push("/tours");
    } catch {
      // Crear o actualizar falló: el hook ya mostró el error de la API y no se guardó nada.
    }
  };

  return (
    <Card className="mx-auto w-full max-w-3xl border-slate-200 shadow-sm">
      <CardHeader className="border-b bg-slate-50/50 pb-5">
        <CardTitle className="text-2xl font-semibold text-slate-800">
          {isEditing ? "Modificar Configuración del Tour" : TOUR_FORM_COPY.title}
        </CardTitle>
        <CardDescription className="text-base">
          {isEditing
            ? "Actualiza las fechas, logística de abordaje, cupos y condiciones de pago de esta excursión."
            : TOUR_FORM_COPY.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 pt-6 sm:px-8">
        <FormProvider {...form}>
          <form id="tour-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <TourGeneralSection />
            <TourBoardingSection />

            {/* --- 3. FINANZAS Y COBRO (Integrado y con validación de anticipo restaurada) --- */}
            <div className="space-y-5 rounded-xl border border-indigo-100 bg-indigo-50/30 p-5 sm:p-6">
              <div className="flex items-center gap-2 pb-1 text-indigo-700">
                <Wallet className="h-5 w-5" />
                <h3 className="text-lg font-semibold">3. Finanzas y Medios de Pago</h3>
              </div>

              {isPricingFrozen && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-900">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p>
                    <strong>Moneda y precio congelados.</strong> Este tour ya tiene pagos
                    registrados, así que no puedes cambiar la moneda ni el precio por pasajero. El
                    anticipo sí se puede ajustar: al guardarlo se recalcula el estado de cada
                    reserva.
                  </p>
                </div>
              )}

              <CurrencySelector disabled={isPricingFrozen} />

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Controller
                  name="price"
                  control={form.control}
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
                          disabled={isPricingFrozen}
                          className="rounded-xl bg-white pl-14 text-sm font-semibold text-slate-900"
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === "" ? 0 : Number(val));
                          }}
                        />
                      </div>
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
                  control={form.control}
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

                      {/* 🚀 BLOQUE DE MENSAJES DE ERROR Y AYUDA DINÁMICA RESTAURADO */}
                      <div className="min-h-[24px] pt-1">
                        {fieldState.error ? (
                          <p className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {fieldState.error.message}
                          </p>
                        ) : (
                          <div className="flex items-start gap-1.5 text-[11px] leading-tight">
                            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                            {Number(depositPerPerson) === 0 ? (
                              <span className="text-slate-500">
                                En <strong>$0</strong> el cliente pagará el 100% para asegurar
                                lugares.
                              </span>
                            ) : (
                              <span className="font-medium text-indigo-600">
                                Pagará{" "}
                                <strong>
                                  ${depositPerPerson} {selectedCurrency} hoy
                                </strong>{" "}
                                y liquidará antes de salir.
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                />
              </div>

              <div className="space-y-3 pt-2">
                <Label className="font-semibold text-slate-700">Métodos de cobro habilitados</Label>
                {form.formState.errors.root?.paymentMethods && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {form.formState.errors.root?.paymentMethods.message as string}
                  </p>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {/* Transferencia */}
                  <Controller
                    name="acceptsBankTransfer"
                    control={form.control}
                    render={({ field }) => (
                      <div
                        className={`flex items-center rounded-lg border p-3 transition-colors ${field.value ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white"}`}
                      >
                        <Checkbox
                          id="acceptsBankTransfer"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <Label
                          htmlFor="acceptsBankTransfer"
                          className="flex-1 cursor-pointer pl-3 text-sm font-medium text-slate-700"
                        >
                          Transferencia
                        </Label>
                      </div>
                    )}
                  />

                  {/* Tarjeta / Link */}
                  <Controller
                    name="acceptsCreditCard"
                    control={form.control}
                    render={({ field }) => (
                      <div
                        className={`flex items-center rounded-lg border p-3 transition-colors ${field.value ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white"}`}
                      >
                        <Checkbox
                          id="acceptsCreditCard"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <Label
                          htmlFor="acceptsCreditCard"
                          className="flex-1 cursor-pointer pl-3 text-sm font-medium text-slate-700"
                        >
                          Tarjeta / Link
                        </Label>
                      </div>
                    )}
                  />

                  {/* Efectivo */}
                  <Controller
                    name="acceptsCash"
                    control={form.control}
                    render={({ field }) => (
                      <div
                        className={`flex items-center rounded-lg border p-3 transition-colors ${field.value ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white"}`}
                      >
                        <Checkbox
                          id="acceptsCash"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <Label
                          htmlFor="acceptsCash"
                          className="flex-1 cursor-pointer pl-3 text-sm font-medium text-slate-700"
                        >
                          Efectivo
                        </Label>
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Bloque Condicional Inferior */}
              {(acceptsBankTransfer || acceptsCreditCard || acceptsCash) && (
                <div className="space-y-4 border-t border-indigo-100 pt-3">
                  {acceptsBankTransfer && (
                    <AgencyBankDetailsBanner
                      bankName={agencyData?.bankName}
                      accountHolder={agencyData?.bankAccountHolder}
                      clabe={agencyData?.clabeNumber}
                      // Dato de la agencia (Configuración → Agencia), no del tour.
                      cardNumber={agencyData?.cardNumber}
                      settingsUrl="/settings?tab=agency"
                    />
                  )}

                  {acceptsCreditCard && (
                    <Controller
                      name="paymentLink"
                      control={form.control}
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
                      control={form.control}
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

            {/* Instrucciones que la agencia quiere dar al cliente después de pagar */}
            <Controller
              name="postPaymentInstructions"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="space-y-1.5">
                  <Label
                    htmlFor="tour-post-payment"
                    className="text-sm font-semibold text-slate-700"
                  >
                    {TOUR_FORM_COPY.confirmInstruction}{" "}
                    <span className="font-normal text-slate-400">(opcional)</span>
                  </Label>
                  <Textarea
                    {...field}
                    id="tour-post-payment"
                    value={field.value ?? ""}
                    rows={3}
                    placeholder="Ej. Envía tu comprobante por WhatsApp. Te confirmaremos tu lugar en menos de 24 horas."
                    className="bg-white text-sm"
                  />
                  {fieldState.error && (
                    <p className="text-xs text-red-500">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />

            <TourAssetSection
              brochureFile={brochureFile}
              setBrochureFile={setBrochureFile}
              existingBrochure={existingBrochure}
              setExistingBrochure={setExistingBrochure}
              isProcessing={isProcessing}
            />
          </form>
        </FormProvider>
      </CardContent>

      <CardFooter className="flex flex-col-reverse justify-end gap-3 rounded-b-xl border-t border-slate-200 bg-slate-50/80 px-6 pt-5 pb-6 sm:flex-row sm:items-center sm:px-8">
        {/* Explica por qué "Guardar" está deshabilitado (al editar, o cuando ya se capturó algo) */}
        {!form.formState.isValid && (isEditing || form.formState.isDirty) && (
          <p
            role="status"
            className="flex items-center gap-1.5 text-xs font-medium text-amber-700 sm:mr-auto"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            Completa o corrige los campos marcados para poder guardar.
          </p>
        )}
        <Button type="button" variant="outline" onClick={handleReset} disabled={isProcessing}>
          {TOUR_FORM_COPY.actions.reset}
        </Button>
        <Button
          type="submit"
          form="tour-form"
          disabled={isProcessing || !form.formState.isValid}
          className="flex h-11 min-w-[140px] items-center gap-2 rounded-xl bg-indigo-600 px-6 font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.99] disabled:bg-slate-300 disabled:text-slate-500"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />{" "}
              {isEditing ? "Guardar Cambios" : TOUR_FORM_COPY.actions.submit}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
