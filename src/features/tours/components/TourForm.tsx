"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2, MapPin, CalendarDays, Users, Wallet } from "lucide-react";

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
import { useEffect, useState } from "react";

interface CreateTourFormProps {
  initialData?: TourOutput;
  tourId?: string;
  onSuccess?: () => void;
}

export const formatForDateInput = (dateString: string | Date | undefined): string => {
  if (!dateString) return "";
  if (typeof dateString === "string") return dateString.slice(0, 10);
  const year = dateString.getFullYear();
  const month = String(dateString.getMonth() + 1).padStart(2, "0");
  const day = String(dateString.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function TourForm({ initialData, tourId, onSuccess }: CreateTourFormProps) {
  const isEditing = !!initialData;
  const router = useRouter();
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const { mutateAsync: createTour, isPending } = useCreateTour();
  const { mutateAsync: updateTour, isPending: isPendingUpdate } = useUpdateTour();
  const { mutateAsync: uploadBrochureTour } = useUploadTourBrochure();
  const isProcessing = isPending || isPendingUpdate;

  const form = useForm<TourInput>({
    resolver: zodResolver(tourSchema),
    mode: "onSubmit",
    defaultValues: initialData || {
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
      postPaymentInstructions: "", // Vaciado temporalmente para el MVP
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "boardingPoints",
  });

  const acceptsBankTransfer = form.watch("acceptsBankTransfer");
  const acceptsCreditCard = form.watch("acceptsCreditCard");
  const acceptsCash = form.watch("acceptsCash");

  // Limpieza dinámica de campos financieros si se desmarcan
  useEffect(() => {
    if (!acceptsCreditCard) form.setValue("paymentLink", "", { shouldValidate: true });
    if (!acceptsBankTransfer) form.setValue("bankDetails", "", { shouldValidate: true });
    if (!acceptsCash) form.setValue("cashInstructions", "", { shouldValidate: true });
  }, [acceptsCreditCard, acceptsBankTransfer, acceptsCash, form]);

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        departureDateTime: formatForDateInput(initialData.departureDateTime),
        bankDetails: initialData.bankDetails ?? "",
        paymentLink: initialData.paymentLink ?? "",
        cashInstructions: initialData.cashInstructions ?? "",
      });
    }
  }, [initialData, form]);

  const onFormError = (errors: any) => {
    console.error("🚨 Validation Errors:", errors);
    toast.error("Revisa los datos", {
      description: "Hay campos requeridos marcados en rojo.",
    });
  };

  async function onSubmit(data: TourInput) {
    try {
      let currentTourId = tourId;

      // PASO 1: Guardado de datos JSON (Crear o Actualizar)
      if (isEditing && tourId) {
        await updateTour({ tourId, tourData: data });
      } else {
        const response = await createTour(data);
        // Asegúrate de extraer bien el ID dependiendo de si tu API regresa { data: tour } o el tour directo
        currentTourId = response.id ?? (response as any).data?.id;
      }

      // PASO 2: Subida del archivo si el usuario seleccionó uno
      if (brochureFile && currentTourId) {
        // 🚀 Aquí pasamos el objeto limpio con la estructura que el hook espera
        await uploadBrochureTour({
          tourId: currentTourId,
          file: brochureFile, // brochureFile es de tipo File (extraído del input type="file")
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

            {/* Título (Fila completa) */}
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
                    <p className="text-destructive animate-in fade-in text-xs">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />

            {/* Grid: Fecha y Capacidad */}
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
                      <p className="text-destructive animate-in fade-in text-xs">
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
                      <p className="text-destructive animate-in fade-in text-xs">
                        {fieldState.error.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Modalidad de Acceso */}
            <Controller
              name="transportModality"
              control={form.control}
              render={({ field }) => (
                <div className="space-y-2.5 pt-2">
                  <Label className="font-semibold text-slate-700">Logística de Transporte</Label>
                  <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row">
                    <label className="flex flex-1 cursor-pointer items-center space-x-3 rounded-md p-2 transition-colors hover:bg-slate-50">
                      <input
                        type="radio"
                        {...field}
                        value="TRANSPORT_INCLUDED"
                        checked={field.value === "TRANSPORT_INCLUDED"}
                        className="h-4 w-4 text-indigo-600"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        🚐 Incluye transporte desde origen
                      </span>
                    </label>
                    <label className="flex flex-1 cursor-pointer items-center space-x-3 rounded-md p-2 transition-colors hover:bg-slate-50">
                      <input
                        type="radio"
                        {...field}
                        value="INDEPENDENT_ACCESS"
                        checked={field.value === "INDEPENDENT_ACCESS"}
                        className="h-4 w-4 text-indigo-600"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        🥾 Llegada independiente al sitio
                      </span>
                    </label>
                  </div>
                </div>
              )}
            />
          </div>

          {/* --- 2. PUNTOS DE ABORDAJE --- */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-indigo-600">
                <MapPin className="h-5 w-5" />
                <h3 className="text-lg font-semibold">2. Puntos de Abordaje</h3>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ id: crypto.randomUUID(), location: "", time: "07:00" })}
                className="h-8 bg-white text-xs font-medium"
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Añadir Parada
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="group flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3 transition-all"
                >
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Referencia de Parada
                    </Label>
                    <Input
                      {...form.register(`boardingPoints.${index}.location`)}
                      placeholder="Ej. Oxxo Tec, Veracruz"
                      className="bg-white"
                    />
                    {form.formState.errors.boardingPoints?.[index]?.location && (
                      <p className="text-destructive text-xs">
                        {form.formState.errors.boardingPoints[index]?.location?.message}
                      </p>
                    )}
                  </div>

                  <div className="w-32 space-y-1.5">
                    <Label className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Hora (HH:MM)
                    </Label>
                    <Input
                      type="time"
                      {...form.register(`boardingPoints.${index}.time`)}
                      className="bg-white"
                    />
                    {form.formState.errors.boardingPoints?.[index]?.time && (
                      <p className="text-destructive text-xs">
                        {form.formState.errors.boardingPoints[index]?.time?.message}
                      </p>
                    )}
                  </div>

                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="mt-6 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {form.formState.errors.boardingPoints &&
                typeof form.formState.errors.boardingPoints.message === "string" && (
                  <p className="text-destructive text-sm font-medium">
                    {form.formState.errors.boardingPoints.message}
                  </p>
                )}
            </div>
          </div>

          {/* --- 🙈 SECCIÓN OCULTA (MVP): Descripción, Recomendaciones y Duración --- */}
          {/* El PM solicitó ocultar esto para reducir fricción. Se restaurará en la V2 para uso de Agentes IA */}
          {/* 
                    <div className="space-y-4">
                        <Controller name="description" ... />
                        <Controller name="tourRecommendations" ... />
                        <Controller name="durationHours" ... />
                    </div> 
                    */}

          {/* --- 3. FINANZAS Y COBRO --- */}
          <div className="space-y-5 rounded-xl border border-indigo-100 bg-indigo-50/30 p-5 sm:p-6">
            <div className="flex items-center gap-2 pb-1 text-indigo-700">
              <Wallet className="h-5 w-5" />
              <h3 className="text-lg font-semibold">3. Finanzas y Medios de Pago</h3>
            </div>

            <Controller
              name="price"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="max-w-[200px] space-y-1.5">
                  <Label htmlFor="tour-price" className="font-semibold text-slate-700">
                    Precio Total (MXN)
                  </Label>
                  <Input
                    {...field}
                    id="tour-price"
                    type="number"
                    className="bg-white text-lg font-bold text-slate-900"
                    placeholder="0.00"
                  />
                  {fieldState.error && (
                    <p className="text-destructive animate-in fade-in text-xs">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />

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

            {/* Campos Condicionales de Cobro */}
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
                          className="min-h-20 resize-none bg-white font-mono text-sm"
                          placeholder="Banco, Titular y CLABE a 18 dígitos..."
                        />
                        {fieldState.error && (
                          <p className="text-destructive text-xs">{fieldState.error.message}</p>
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
                          className="bg-white"
                        />
                        {fieldState.error && (
                          <p className="text-destructive text-xs">{fieldState.error.message}</p>
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
                          className="bg-white"
                        />
                        {fieldState.error && (
                          <p className="text-destructive text-xs">{fieldState.error.message}</p>
                        )}
                      </div>
                    )}
                  />
                )}
              </div>
            )}

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-slate-700">Folleto del Viaje (Opcional)</Label>
                <span className="text-xs text-slate-400">PDF, Máx 5MB</span>
              </div>
              <p className="text-sm text-slate-500">
                Sube el PDF con tu itinerario y políticas. Tus clientes podrán descargarlo
                directamente desde WhatsApp.
              </p>

              <div className="flex w-full items-center justify-center">
                <label
                  htmlFor="dropzone-file"
                  className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:bg-slate-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className="mb-2 h-8 w-8 text-slate-400"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 20 16"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                      />
                    </svg>
                    <p className="mb-1 text-sm font-semibold text-slate-600">
                      {brochureFile ? brochureFile.name : "Haz clic para adjuntar el PDF"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {brochureFile
                        ? `${(brochureFile.size / 1024 / 1024).toFixed(2)} MB`
                        : "Solo formato .PDF"}
                    </p>
                  </div>
                  <input
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    accept="application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && file.size <= 5242880) {
                        setBrochureFile(file);
                      } else {
                        toast.error("El archivo supera el límite de 5MB");
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* 🙈 OCULTO (MVP): postPaymentInstructions */}
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex justify-end gap-3 rounded-b-xl border-t border-slate-200 bg-slate-50/80 px-6 pt-4 pb-6 sm:px-8">
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
          disabled={isProcessing}
          className="min-w-[140px] bg-indigo-600 text-white hover:bg-indigo-700"
        >
          {isProcessing ? "Guardando..." : TOUR_FORM_COPY.actions.submit}
        </Button>
      </CardFooter>
    </Card>
  );
}
