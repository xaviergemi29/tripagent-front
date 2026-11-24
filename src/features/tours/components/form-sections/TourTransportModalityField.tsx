"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import type { TourInput } from "../../schemas/tour.schema";

/** Logística de transporte (Paso 2 del formulario de tour): incluido desde origen o llegada independiente. */
export function TourTransportModalityField() {
  const { control } = useFormContext<TourInput>();
  return (
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
  );
}
