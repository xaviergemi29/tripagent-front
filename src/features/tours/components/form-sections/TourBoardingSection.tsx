"use client";

import { useFieldArray, useFormContext, useFormState, useWatch } from "react-hook-form";
import { Plus, Trash2, MapPin, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TourInput } from "../../schemas/tour.schema";
import { TourTransportModalityField } from "./TourTransportModalityField";

export function TourBoardingSection() {
  // `useWatch` y `useFormState` (no `watch` ni `formState` del contexto): con el React Compiler,
  // `watch()` quedaba memorizado y al elegir "Hiking" la sección no cambiaba (2026-11-15).
  const { control, register } = useFormContext<TourInput>();
  const { errors } = useFormState({ control });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "boardingPoints",
  });

  const transportModality = useWatch({ control, name: "transportModality" });
  const isHiking = transportModality === "INDEPENDENT_ACCESS";

  return (
    <div className="space-y-6">
      <TourTransportModalityField />
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2 text-indigo-600">
            <MapPin className="h-5 w-5" />
            <h3 className="text-lg font-semibold">
              {isHiking ? "2. Punto de Encuentro (Hiking)" : "2. Puntos de Abordaje"}
            </h3>
          </div>

          {!isHiking && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              // 🚀 FIX: Añadimos objetos limpios sin ID. El Back-End se encarga.
              onClick={() => append({ location: "", time: "07:00" })}
              className="h-9 border-indigo-200 bg-indigo-50 text-xs font-medium text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800"
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Añadir Parada
            </Button>
          )}
          {isHiking && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              Punto Único
            </span>
          )}
        </div>

        <div className="space-y-3">
          {isHiking && (
            <Alert className="border-sky-200 bg-sky-50 text-sky-900">
              <Info className="text-sky-600" />
              <AlertDescription className="text-sky-900">
                Con llegada independiente no hay paradas de transporte. Solo indica el punto de
                reunión donde inicia la actividad: tus viajeros lo verán en su pase de abordaje.
              </AlertDescription>
            </Alert>
          )}

          {fields.map((field, index) => {
            const locationError = errors.boardingPoints?.[index]?.location;
            const timeError = errors.boardingPoints?.[index]?.time;

            return (
              // 🚀 Clave: field.id es un hash que genera react-hook-form para React, NO es de tu base de datos
              <div
                key={field.id}
                className="group flex flex-col items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all sm:flex-row sm:items-start"
              >
                <div className="w-full space-y-1.5 sm:flex-1">
                  <Label
                    htmlFor={`tour-boarding-${index}-location`}
                    className="text-xs font-bold tracking-wider text-slate-500 uppercase"
                  >
                    {isHiking ? "Referencia de punto de encuentro" : "Referencia de Parada"}
                  </Label>
                  <Input
                    id={`tour-boarding-${index}-location`}
                    {...register(`boardingPoints.${index}.location`)}
                    placeholder={
                      isHiking ? "Ej. Refugio 1, Parque Nacional" : "Ej. Oxxo Tec, Veracruz"
                    }
                    className={`h-11 bg-white text-base sm:text-sm ${locationError ? "border-red-500 focus-visible:ring-red-400" : ""}`}
                  />
                  {locationError && (
                    <p className="animate-in fade-in flex items-center gap-1 text-xs font-medium text-red-500">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {locationError.message}
                    </p>
                  )}
                </div>

                <div className="w-full space-y-1.5 sm:w-32">
                  <Label
                    htmlFor={`tour-boarding-${index}-time`}
                    className="text-xs font-bold tracking-wider text-slate-500 uppercase"
                  >
                    Hora (HH:MM)
                  </Label>
                  <Input
                    id={`tour-boarding-${index}-time`}
                    type="time"
                    {...register(`boardingPoints.${index}.time`)}
                    className={`h-11 bg-white text-base sm:text-sm ${timeError ? "border-red-500 focus-visible:ring-red-400" : ""}`}
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
                    aria-label="Quitar punto de abordaje"
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
    </div>
  );
}
