"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FieldErrors, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  MapPin,
  CalendarDays,
  Users,
  Wallet,
  Info,
  AlertCircle,
  UploadCloud,
  Eye,
  FileText,
} from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import { tourSchema, type TourInput, type TourOutput } from "../schemas/tour.schema";
import { useCreateTour, useUpdateTour, useUploadTourBrochure } from "../hooks/useTours";
import { formatForDateInput } from "@/shared/utils/tour-date.util";

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
    initialData?.brochureUrl ? "http://localhost:3001/public" + initialData?.brochureUrl : null,
  );
  const { mutateAsync: createTour, isPending } = useCreateTour();
  const { mutateAsync: updateTour, isPending: isPendingUpdate } = useUpdateTour();
  const { mutateAsync: uploadBrochureTour } = useUploadTourBrochure();
  const isProcessing = isPending || isPendingUpdate;

  const form = useForm<TourInput>({
    resolver: zodResolver(tourSchema),
    mode: "onChange",
    defaultValues: initialData
      ? {
          ...initialData,
          depositPerPerson: initialData.depositPerPerson ?? 0,
        }
      : {
          title: "",
          description: "",
          tourRecommendations: "",
          price: 0,
          durationHours: 0,
          departureDateTime: "",
          maxCapacity: 0,
          isActive: true,
          acceptsBankTransfer: false,
          bankDetails: "",
          acceptsCreditCard: false,
          paymentLink: "",
          acceptsCash: false,
          cashInstructions: "",
          boardingPoints: [{ id: crypto.randomUUID(), location: "", time: "06:00" }],
          postPaymentInstructions: "",
          depositPerPerson: 0,
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "boardingPoints",
  });

  const acceptsBankTransfer = form.watch("acceptsBankTransfer");
  const acceptsCreditCard = form.watch("acceptsCreditCard");
  const acceptsCash = form.watch("acceptsCash");
  const depositPerPerson = form.watch("depositPerPerson") || 0;
  const price = form.watch("price");
  const transportModality = form.watch("transportModality");
  const isHiking = transportModality === "INDEPENDENT_ACCESS";

  const getFilename = () => {
    if (brochureFile) return brochureFile.name;
    if (existingBrochure) {
      const rawName = existingBrochure.split("/").pop() || "itinerario.pdf";
      // Limpia el patrón "tour-[uuid]-[timestamp].pdf" para hacerlo amigable
      const isBackendGenerated = /^tour-[a-f0-9\-]+-\d+\.pdf$/i.test(rawName);
      return isBackendGenerated ? "itinerario_guardado.pdf" : rawName;
    }
    return "";
  };

  useEffect(() => {
    form.trigger("depositPerPerson");
  }, [price, form]);

  useEffect(() => {
    if (isHiking && fields.length > 1) {
      const firstPoint = form.getValues("boardingPoints")[0];
      form.setValue("boardingPoints", [firstPoint]);
    }
  }, [isHiking, fields.length, form]);

  useEffect(() => {
    if (!acceptsCreditCard) form.setValue("paymentLink", "", { shouldValidate: true });
    if (!acceptsBankTransfer) form.setValue("bankDetails", "", { shouldValidate: true });
    if (!acceptsCash) form.setValue("cashInstructions", "", { shouldValidate: true });
  }, [acceptsCreditCard, acceptsBankTransfer, acceptsCash, form]);

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        departureDateTime: formatForDateInput(initialData?.departureDateTime),
        bankDetails: initialData.bankDetails ?? "",
        paymentLink: initialData.paymentLink ?? "",
        cashInstructions: initialData.cashInstructions ?? "",
      });
    }
  }, [initialData, form]);

  const onFormError = (errors: FieldErrors<TourInput>) => {
    console.error("🚨 Validation Errors:", errors);
    toast.error("Revisa los datos", {
      description: "Hay campos requeridos marcados en rojo.",
    });
  };

  async function onSubmit(data: TourInput) {
    try {
      let currentTourId = tourId;

      type TourPayload = TourInput & { removeBrochure?: boolean };
      const payload: TourPayload = { ...data };

      if (isEditing && initialData?.brochureUrl && !existingBrochure && !brochureFile) {
        payload.removeBrochure = true;
      }

      if (isEditing && tourId) {
        await updateTour({ tourId, tourData: payload });
      } else {
        const response = await createTour(payload);

        // 🚀 FIX: Eliminamos '(response as any)'.
        // Verificamos de forma segura la estructura de la respuesta (Axios vs Fetch)
        if (response && typeof response === "object") {
          currentTourId =
            "data" in response
              ? (response as { data: TourOutput }).data.id
              : (response as TourOutput).id;
        }
      }

      if (brochureFile && currentTourId) {
        await uploadBrochureTour({
          tourId: currentTourId,
          file: brochureFile,
        });
      }

      form.reset();
      setBrochureFile(null);
      if (onSuccess) onSuccess();
      router.push("/");
    } catch (error) {
      console.error("Mutation failed:", error);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-3xl border-slate-200 shadow-sm">
      <CardHeader className="border-b bg-slate-50/50 pb-5">
        <CardTitle className="text-2xl font-semibold text-slate-800">
          {TOUR_FORM_COPY.title}
        </CardTitle>
        <CardDescription className="text-base">{TOUR_FORM_COPY.description}</CardDescription>
      </CardHeader>

      <CardContent className="px-6 pt-6 sm:px-8">
        <form
          id="tour-form"
          onSubmit={form.handleSubmit(onSubmit, onFormError)}
          className="space-y-8"
        >
          {/* --- 1. CONFIGURACIÓN PRINCIPAL --- */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-indigo-600">
              <MapPin className="h-5 w-5" />
              <h3 className="text-lg font-semibold">1. Datos de la Excursión</h3>
            </div>

            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="space-y-1.5">
                  <Label htmlFor="tour-title" className="font-semibold text-slate-700">
                    Nombre del Tour
                  </Label>
                  <Input
                    {...field}
                    id="tour-title"
                    placeholder="Ej. Excursión a la Malinche y Cascadas"
                    className="bg-slate-50/50 text-base"
                  />
                  {fieldState.error && (
                    <p className="animate-in fade-in flex items-center gap-1 text-xs font-medium text-red-500">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Controller
                name="departureDateTime"
                control={form.control}
                render={({ field, fieldState }) => (
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="tour-departure"
                      className="flex items-center gap-1.5 font-semibold text-slate-700"
                    >
                      <CalendarDays className="h-4 w-4 text-slate-400" /> Fecha de Salida
                    </Label>
                    <Input {...field} id="tour-departure" type="date" className="bg-slate-50/50" />
                    {fieldState.error && (
                      <p className="animate-in fade-in flex items-center gap-1 text-xs font-medium text-red-500">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {fieldState.error.message}
                      </p>
                    )}
                  </div>
                )}
              />

              <Controller
                name="maxCapacity"
                control={form.control}
                render={({ field, fieldState }) => (
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="tour-capacity"
                      className="flex items-center gap-1.5 font-semibold text-slate-700"
                    >
                      <Users className="h-4 w-4 text-slate-400" /> Lugares Disponibles
                    </Label>
                    <Input
                      {...field}
                      id="tour-capacity"
                      type="number"
                      placeholder="Ej. 40"
                      min={1}
                      className="bg-slate-50/50"
                    />
                    {fieldState.error && (
                      <p className="animate-in fade-in flex items-center gap-1 text-xs font-medium text-red-500">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {fieldState.error.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            <Controller
              name="transportModality"
              control={form.control}
              render={({ field }) => (
                <div className="space-y-3 pt-2">
                  <Label className="font-semibold text-slate-700">Logística de Transporte</Label>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div
                      onClick={() => field.onChange("TRANSPORT_INCLUDED")}
                      className={`relative flex cursor-pointer flex-col gap-1 rounded-xl border-2 p-4 transition-all hover:bg-slate-50 ${
                        field.value === "TRANSPORT_INCLUDED"
                          ? "border-indigo-600 bg-indigo-50/30"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl">🚐</span>
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                            field.value === "TRANSPORT_INCLUDED"
                              ? "border-indigo-600"
                              : "border-slate-300"
                          }`}
                        >
                          {field.value === "TRANSPORT_INCLUDED" && (
                            <div className="h-2 w-2 rounded-full bg-indigo-600" />
                          )}
                        </div>
                      </div>
                      <span className="mt-2 text-sm font-bold text-slate-900">
                        Incluye transporte desde origen
                      </span>
                      <span className="text-xs text-slate-500">Múltiples paradas</span>
                    </div>

                    <div
                      onClick={() => field.onChange("INDEPENDENT_ACCESS")}
                      className={`relative flex cursor-pointer flex-col gap-1 rounded-xl border-2 p-4 transition-all hover:bg-slate-50 ${
                        field.value === "INDEPENDENT_ACCESS"
                          ? "border-indigo-600 bg-indigo-50/30 shadow-sm"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl">🥾</span>
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                            field.value === "INDEPENDENT_ACCESS"
                              ? "border-indigo-600"
                              : "border-slate-300"
                          }`}
                        >
                          {field.value === "INDEPENDENT_ACCESS" && (
                            <div className="h-2 w-2 rounded-full bg-indigo-600" />
                          )}
                        </div>
                      </div>
                      <span className="mt-2 text-sm font-bold text-slate-900">
                        Llegada independiente al sitio
                      </span>
                      <span className="text-xs font-medium text-indigo-600">
                        Hiking / Punto de encuentro
                      </span>
                    </div>
                  </div>
                </div>
              )}
            />
          </div>

          {/* --- 2. PUNTO DE ENCUENTRO / ABORDAJE --- */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-indigo-600">
                <MapPin className="h-5 w-5" />
                <h3 className="text-lg font-semibold">
                  {isHiking ? "2. Punto de Encuentro (Hiking)" : "2. Puntos de Abordaje"}
                </h3>
              </div>

              {isHiking ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  Punto Único
                </span>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ id: crypto.randomUUID(), location: "", time: "07:00" })}
                  className="h-9 bg-white text-xs font-medium"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Añadir Parada
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {isHiking && (
                <p className="mb-2 text-sm text-slate-500">
                  Punto único de reunión para iniciar la actividad con los excursionistas.
                </p>
              )}

              {fields.map((field, index) => {
                const locationError = form.formState.errors.boardingPoints?.[index]?.location;
                const timeError = form.formState.errors.boardingPoints?.[index]?.time;

                return (
                  <div
                    key={field.id}
                    className="group flex flex-col items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all sm:flex-row sm:items-start"
                  >
                    <div className="w-full space-y-1.5 sm:flex-1">
                      <Label className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                        {isHiking ? "Referencia de punto de encuentro" : "Referencia de Parada"}
                      </Label>
                      <Input
                        {...form.register(`boardingPoints.${index}.location`)}
                        placeholder={
                          isHiking ? "Ej. Refugio 1, Parque Nacional" : "Ej. Oxxo Tec, Veracruz"
                        }
                        className={`h-11 bg-white text-base sm:text-sm ${
                          locationError ? "border-red-500 focus-visible:ring-red-400" : ""
                        }`}
                      />
                      {/* 🚀 FIX PROBLEMA 1: Renderizado explícito de error en Ubicación / Parada */}
                      {locationError && (
                        <p className="animate-in fade-in flex items-center gap-1 text-xs font-medium text-red-500">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          {locationError.message}
                        </p>
                      )}
                    </div>

                    <div className="w-full space-y-1.5 sm:w-32">
                      <Label className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                        Hora (HH:MM)
                      </Label>
                      <Input
                        type="time"
                        {...form.register(`boardingPoints.${index}.time`)}
                        className={`h-11 bg-white text-base sm:text-sm ${
                          timeError ? "border-red-500 focus-visible:ring-red-400" : ""
                        }`}
                      />
                      {timeError && (
                        <p className="animate-in fade-in flex items-center gap-1 text-xs font-medium text-red-500">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          {timeError.message}
                        </p>
                      )}
                    </div>

                    {!isHiking && fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="mt-6 h-11 w-11 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* --- 3. FINANZAS Y COBRO --- */}
          <div className="space-y-5 rounded-xl border border-indigo-100 bg-indigo-50/30 p-5 sm:p-6">
            <div className="flex items-center gap-2 pb-1 text-indigo-700">
              <Wallet className="h-5 w-5" />
              <h3 className="text-lg font-semibold">3. Finanzas y Medios de Pago</h3>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Controller
                name="price"
                control={form.control}
                render={({ field, fieldState }) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="tour-price" className="font-semibold text-slate-700">
                      Precio Total por Pasajero (MXN) *
                    </Label>
                    <div className="relative">
                      <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-medium text-slate-400">
                        $
                      </span>
                      <Input
                        {...field}
                        id="tour-price"
                        type="number"
                        min="0"
                        className={`[appearance:textfield] rounded-xl bg-white pl-8 text-base font-bold text-slate-900 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                          fieldState.error ? "border-red-500 focus-visible:ring-red-400" : ""
                        }`}
                        placeholder="0"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? "" : Number(val));
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">Tarifa completa de la experiencia.</p>
                    {fieldState.error && (
                      <p className="animate-in fade-in flex items-center gap-1 text-xs font-medium text-red-500">
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
                    <Label
                      htmlFor="tour-deposit"
                      className="flex items-center justify-between font-semibold text-slate-700"
                    >
                      <span>Anticipo por pasajero (MXN)</span>
                      {Number(depositPerPerson) > 0 && !fieldState.error && (
                        <span className="animate-in fade-in rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-800 uppercase">
                          Apartado
                        </span>
                      )}
                    </Label>

                    <div className="relative">
                      <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-medium text-slate-400">
                        $
                      </span>
                      <Input
                        {...field}
                        id="tour-deposit"
                        type="number"
                        min="0"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? "" : Number(val));
                        }}
                        className={`[appearance:textfield] rounded-xl bg-white pl-8 text-base font-bold text-slate-900 transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                          fieldState.error ? "border-red-500 focus-visible:ring-red-400" : ""
                        }`}
                        placeholder="0"
                      />
                    </div>

                    {/* 🚀 FIX: Renderizado Exclusivo (Microcopy O Error) */}
                    <div className="min-h-[24px] pt-1">
                      {fieldState.error ? (
                        /* 1. Muestra EXCLUSIVAMENTE el error en rojo si la validación falla */
                        <p className="animate-in fade-in flex items-center gap-1.5 text-xs font-medium text-red-500">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          {fieldState.error.message}
                        </p>
                      ) : (
                        /* 2. Muestra el microcopy informativo solo si el estado es VÁLIDO */
                        <div className="animate-in fade-in flex items-start gap-1.5 text-[11px] leading-tight">
                          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                          {Number(depositPerPerson) === 0 ? (
                            <span className="text-slate-500">
                              En <strong>$0</strong> el cliente deberá pagar el 100% para asegurar
                              lugares.
                            </span>
                          ) : (
                            <span className="font-medium text-indigo-600">
                              El viajero pagará{" "}
                              <strong>${depositPerPerson} MXN por lugar hoy</strong> y liquidará el
                              resto antes de la salida.
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
                <Controller
                  name="acceptsBankTransfer"
                  control={form.control}
                  render={({ field }) => (
                    <label
                      className={`flex cursor-pointer items-center space-x-3 rounded-lg border p-3 transition-colors ${field.value ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                    >
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      <span className="text-sm font-medium text-slate-700">Transferencia</span>
                    </label>
                  )}
                />
                <Controller
                  name="acceptsCreditCard"
                  control={form.control}
                  render={({ field }) => (
                    <label
                      className={`flex cursor-pointer items-center space-x-3 rounded-lg border p-3 transition-colors ${field.value ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                    >
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      <span className="text-sm font-medium text-slate-700">Tarjeta / Link</span>
                    </label>
                  )}
                />
                <Controller
                  name="acceptsCash"
                  control={form.control}
                  render={({ field }) => (
                    <label
                      className={`flex cursor-pointer items-center space-x-3 rounded-lg border p-3 transition-colors ${field.value ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                    >
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      <span className="text-sm font-medium text-slate-700">Efectivo</span>
                    </label>
                  )}
                />
              </div>
            </div>

            {(acceptsBankTransfer || acceptsCreditCard || acceptsCash) && (
              <div className="mt-4 space-y-4 border-t border-indigo-100 pt-3">
                {acceptsBankTransfer && (
                  <Controller
                    name="bankDetails"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <div className="animate-in fade-in slide-in-from-top-2 space-y-1.5">
                        <Label className="text-sm font-semibold text-slate-700">
                          Datos Bancarios (SPEI)
                        </Label>
                        <Textarea
                          {...field}
                          className={`min-h-20 resize-none bg-white font-mono text-sm ${
                            fieldState.error ? "border-red-500 focus-visible:ring-red-400" : ""
                          }`}
                          placeholder="Banco, Titular y CLABE a 18 dígitos..."
                        />
                        {fieldState.error && (
                          <p className="animate-in fade-in flex items-center gap-1 text-xs font-medium text-red-500">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                )}
                {acceptsCreditCard && (
                  <Controller
                    name="paymentLink"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <div className="animate-in fade-in slide-in-from-top-2 space-y-1.5">
                        <Label className="text-sm font-semibold text-slate-700">
                          Link de Pago (MercadoPago, Clip, etc.)
                        </Label>
                        <Input
                          {...field}
                          type="url"
                          placeholder="https://..."
                          className={`bg-white ${
                            fieldState.error ? "border-red-500 focus-visible:ring-red-400" : ""
                          }`}
                        />
                        {fieldState.error && (
                          <p className="animate-in fade-in flex items-center gap-1 text-xs font-medium text-red-500">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {fieldState.error.message}
                          </p>
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
                      <div className="animate-in fade-in slide-in-from-top-2 space-y-1.5">
                        <Label className="text-sm font-semibold text-slate-700">
                          Instrucciones para Efectivo
                        </Label>
                        <Input
                          {...field}
                          placeholder="Ej. Paga directo al abordar el autobús"
                          className={`bg-white ${
                            fieldState.error ? "border-red-500 focus-visible:ring-red-400" : ""
                          }`}
                        />
                        {fieldState.error && (
                          <p className="animate-in fade-in flex items-center gap-1 text-xs font-medium text-red-500">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                )}
              </div>
            )}

            {/* --- 4. GESTIÓN DE ASSETS (Folleto) --- */}
            <Card className="rounded-xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-700">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                      <FileText className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg font-semibold">
                      Folleto del Viaje (Opcional)
                    </CardTitle>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                    PDF, Máx 5MB
                  </span>
                </div>
                <CardDescription className="mt-1 text-sm text-slate-500">
                  Sube el PDF con tu itinerario y políticas. Tus clientes podrán descargarlo
                  directamente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {existingBrochure || brochureFile ? (
                  // 🚀 ESTADO: ARCHIVO CARGADO O EXISTENTE
                  <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="flex h-14 w-12 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-500 shadow-sm">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span
                          className="truncate text-sm font-bold text-slate-700"
                          title={getFilename()}
                        >
                          {getFilename()}
                        </span>
                        <div className="mt-1 flex items-center gap-2 text-[11px] font-medium text-slate-500">
                          {brochureFile ? (
                            <span>{(brochureFile.size / 1024 / 1024).toFixed(2)} MB</span>
                          ) : (
                            <span>Archivo en servidor</span>
                          )}
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <span className="text-emerald-600">Listo para enviar</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex w-full items-center gap-2 sm:w-auto">
                      {/* Botón Ver */}
                      {existingBrochure && !brochureFile && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 bg-white text-xs"
                          onClick={() => window.open(existingBrochure, "_blank")}
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" /> Ver / Descargar
                        </Button>
                      )}

                      {/* Botón Reemplazar */}
                      <div className="relative">
                        <input
                          type="file"
                          // Deshabilitamos el cursor si está procesando
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                          accept="application/pdf"
                          disabled={isProcessing}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && file.size <= 5242880) {
                              setBrochureFile(file);
                            } else if (file) {
                              toast.error("El archivo supera el límite de 5MB");
                            }
                            // Reseteamos el valor para permitir subir el mismo archivo si se equivocan y cancelan
                            e.target.value = "";
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isProcessing}
                          className="pointer-events-none h-9 bg-white text-xs"
                        >
                          <UploadCloud className="mr-1.5 h-3.5 w-3.5" />
                          {isProcessing ? "Procesando..." : "Reemplazar"}
                        </Button>
                      </div>

                      {/* Botón Eliminar con Confirmación */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={isProcessing}
                        className="h-9 w-9 shrink-0 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        onClick={() => {
                          if (
                            window.confirm(
                              "¿Deseas quitar este folleto del tour? Tendrás que guardar los cambios para confirmar la eliminación.",
                            )
                          ) {
                            setBrochureFile(null);
                            setExistingBrochure(null);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  // 🚀 ESTADO: VACÍO (DROPZONE)
                  <div className="flex w-full items-center justify-center">
                    <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:border-indigo-300 hover:bg-slate-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="mb-3 h-8 w-8 text-slate-400" />
                        <p className="mb-1 text-sm font-semibold text-slate-600">
                          Haz clic para adjuntar el PDF
                        </p>
                        <p className="text-xs font-medium text-slate-500">
                          Solo formato .PDF hasta 5MB
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && file.size <= 5242880) {
                            setBrochureFile(file);
                          } else if (file) {
                            toast.error("El archivo supera el límite de 5MB");
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </form>
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
          className="min-w-[140px] bg-indigo-600 text-white transition-all hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500"
        >
          {isProcessing
            ? "Guardando..."
            : isEditing
              ? "Guardar Cambios"
              : TOUR_FORM_COPY.actions.submit}
        </Button>
      </CardFooter>
    </Card>
  );
}
