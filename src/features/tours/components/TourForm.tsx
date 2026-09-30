"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider, Controller } from "react-hook-form";
import Link from "next/link";
import { Loader2, Save, Wallet, Info, AlertCircle, ArrowRight, Landmark } from "lucide-react";

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

import { tourSchema, type TourInput, type TourOutput } from "../schemas/tour.schema";
import { useCreateTour, useUpdateTour, useUploadTourBrochure } from "../hooks/useTours";
import { formatForDateInput } from "@/shared/utils/tour-date.util";
import { useAgency } from "@/features/settings/hooks/useAgency";
import { CurrencySelector } from "./CurrencySelector";
import { TourGeneralSection } from "./form-sections/TourGeneralSection";
import { TourBoardingSection } from "./form-sections/TourBoardingSection";
import { TourAssetSection } from "./form-sections/TourAssetSection";

interface CreateTourFormProps {
  initialData?: TourOutput;
  tourId?: string;
  onSuccess?: () => void;
}

export function TourForm({ initialData, tourId, onSuccess }: CreateTourFormProps) {
  const isEditing = !!initialData;
  const router = useRouter();

  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [existingBrochure, setExistingBrochure] = useState<string | null>(
    initialData?.brochureUrl ? `http://localhost:3001/public${initialData.brochureUrl}` : null,
  );

  const { mutateAsync: createTour, isPending: isCreating } = useCreateTour();
  const { mutateAsync: updateTour, isPending: isUpdating } = useUpdateTour();
  const { mutateAsync: uploadBrochureTour } = useUploadTourBrochure();
  const { data: agencyData } = useAgency();

  const isProcessing = isCreating || isUpdating;

  const form = useForm<TourInput>({
    resolver: zodResolver(tourSchema),
    mode: "onChange",
    defaultValues: initialData
      ? {
          ...initialData,
          depositPerPerson: initialData.depositPerPerson ?? 0,
          currency: initialData.currency ?? "MXN",
        }
      : {
          title: "",
          description: "",
          tourRecommendations: "",
          price: 0,
          durationHours: 0,
          currency: "MXN",
          departureDateTime: "",
          maxCapacity: 0,
          isActive: true,
          acceptsBankTransfer: false,
          acceptsCreditCard: false,
          paymentLink: "",
          acceptsCash: false,
          cashInstructions: "",
          boardingPoints: [{ location: "", time: "06:00" }],
          postPaymentInstructions: "",
          depositPerPerson: 0,
        },
  });

  const selectedCurrency = form.watch("currency");
  const acceptsBankTransfer = form.watch("acceptsBankTransfer");
  const acceptsCreditCard = form.watch("acceptsCreditCard");
  const acceptsCash = form.watch("acceptsCash");
  const depositPerPerson = form.watch("depositPerPerson") || 0;
  const price = form.watch("price");

  useEffect(() => {
    form.trigger("depositPerPerson");
  }, [price, form]);

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        currency: initialData.currency ?? "MXN",
        departureDateTime: formatForDateInput(initialData?.departureDateTime),
        paymentLink: initialData.paymentLink ?? "",
        cashInstructions: initialData.cashInstructions ?? "",
      });
    }
  }, [initialData, form]);

  const onSubmit = async (data: TourInput) => {
    try {
      let currentTourId = tourId;
      const payload = {
        ...data,
        removeBrochure: isEditing && initialData?.brochureUrl && !existingBrochure && !brochureFile,
      };

      if (isEditing && tourId) {
        await updateTour({ tourId, tourData: payload });
      } else {
        const response = await createTour(payload);
        currentTourId =
          typeof response === "object" && "data" in response
            ? (response as any).data.id
            : response?.id;
      }

      if (brochureFile && currentTourId) {
        await uploadBrochureTour({ tourId: currentTourId, file: brochureFile });
      }

      form.reset();
      setBrochureFile(null);
      if (onSuccess) onSuccess();
      router.push("/tours");
    } catch (error) {
      console.error("Mutation failed:", error);
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
          <form
            id="tour-form"
            onSubmit={form.handleSubmit(onSubmit, (err) => console.error(err))}
            className="space-y-8"
          >
            <TourGeneralSection />
            <TourBoardingSection />

            {/* --- 3. FINANZAS Y COBRO (Integrado y con validación de anticipo restaurada) --- */}
            <div className="space-y-5 rounded-xl border border-indigo-100 bg-indigo-50/30 p-5 sm:p-6">
              <div className="flex items-center gap-2 pb-1 text-indigo-700">
                <Wallet className="h-5 w-5" />
                <h3 className="text-lg font-semibold">3. Finanzas y Medios de Pago</h3>
              </div>

              <CurrencySelector />

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

      <CardFooter className="flex flex-col-reverse justify-end gap-3 rounded-b-xl border-t border-slate-200 bg-slate-50/80 px-6 pt-5 pb-6 sm:flex-row sm:px-8">
        <Button
          type="button"
          variant="outline"
          onClick={() => form.reset()}
          disabled={isProcessing}
        >
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
