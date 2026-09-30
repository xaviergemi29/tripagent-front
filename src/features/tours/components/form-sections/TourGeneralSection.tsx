"use client";

import { useFormContext, Controller } from "react-hook-form";
import { MapPin, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TourInput } from "@/features/tours/schemas/tour.schema"; // Ajusta tu ruta de importación

export function TourGeneralSection() {
  const { control } = useFormContext<TourInput>();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-indigo-600">
        <MapPin className="h-5 w-5" />
        <h3 className="text-lg font-semibold">1. Datos de la Excursión</h3>
      </div>

      <Controller
        name="title"
        control={control}
        render={({ field, fieldState }) => (
          <div className="space-y-1.5">
            <Label htmlFor="tour-title" className="font-semibold text-slate-700">
              Nombre del Tour
            </Label>
            <Input
              {...field}
              id="tour-title"
              placeholder="Ej. Excursión a la Malinche y Cascadas"
              className={`bg-slate-50/50 text-base ${fieldState.error ? "border-red-500 focus-visible:ring-red-400" : ""}`}
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Controller
          name="departureDateTime"
          control={control}
          render={({ field, fieldState }) => (
            <div className="space-y-1.5">
              <Label htmlFor="tour-departure" className="text-xs font-bold text-slate-700">
                Fecha de Salida <span className="text-red-500">*</span>
              </Label>
              <Input
                {...field}
                id="tour-departure"
                type="date"
                className={`h-11 rounded-xl bg-slate-50/50 text-sm ${fieldState.error ? "border-red-500" : "border-slate-200"}`}
              />
              {fieldState.error && (
                <p className="animate-in fade-in flex items-center gap-1 text-xs font-medium text-red-500">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />

        <Controller
          name="returnDate"
          control={control}
          render={({ field, fieldState }) => (
            <div className="space-y-1.5">
              <Label htmlFor="tour-return" className="text-xs font-bold text-slate-700">
                Fecha de Regreso (Fin de Tour)
              </Label>
              <Input
                {...field}
                id="tour-return"
                type="date"
                className={`h-11 rounded-xl bg-slate-50/50 text-sm ${fieldState.error ? "border-red-500" : "border-slate-200"}`}
                value={field.value ?? ""}
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Opcional si el viaje dura más de 1 día
              </p>
              {fieldState.error && (
                <p className="animate-in fade-in flex items-center gap-1 text-xs font-medium text-red-500">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />

        <Controller
          name="maxCapacity"
          control={control}
          render={({ field, fieldState }) => (
            <div className="space-y-1.5">
              <Label htmlFor="tour-capacity" className="text-xs font-bold text-slate-700">
                Lugares Disponibles (Cupo) <span className="text-red-500">*</span>
              </Label>
              <Input
                {...field}
                id="tour-capacity"
                type="number"
                min={1}
                placeholder="Ej. 40"
                value={field.value === 0 ? "" : field.value}
                onChange={(e) => {
                  const val = e.target.value;
                  field.onChange(val === "" ? 0 : Number(val));
                }}
                className={`h-11 rounded-xl bg-slate-50/50 text-sm ${fieldState.error ? "border-red-500" : "border-slate-200"}`}
              />
              {fieldState.error && (
                <p className="animate-in fade-in flex items-center gap-1 text-xs font-medium text-red-500">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />
      </div>

      <Controller
        name="transportModality"
        control={control}
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
                    className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${field.value === "TRANSPORT_INCLUDED" ? "border-indigo-600" : "border-slate-300"}`}
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
                    className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${field.value === "INDEPENDENT_ACCESS" ? "border-indigo-600" : "border-slate-300"}`}
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
  );
}
