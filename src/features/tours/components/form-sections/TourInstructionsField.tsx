"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TOUR_FORM_COPY } from "../../constants/copy";
import type { TourInput } from "../../schemas/tour.schema";

/**
 * Instrucciones Post-Pago (logística del tour). Se muestran en el Magic Link y en el estado de
 * cuenta PDF; las reglas legales son las políticas generales de la agencia (regla 17).
 */
export function TourInstructionsField() {
  const { control } = useFormContext<TourInput>();

  return (
    <Controller
      name="postPaymentInstructions"
      control={control}
      render={({ field, fieldState }) => (
        <div className="space-y-1.5">
          <Label htmlFor="tour-post-payment" className="text-sm font-semibold text-slate-700">
            {TOUR_FORM_COPY.confirmInstruction}{" "}
            <span className="font-normal text-slate-400">(opcional)</span>
          </Label>
          <Textarea
            {...field}
            id="tour-post-payment"
            value={field.value ?? ""}
            rows={3}
            placeholder="Ej. Llevar botas de montaña, impermeable e identificación oficial."
            className="bg-white text-base sm:text-sm"
          />
          <p className="text-xs text-slate-500">
            Tu cliente las verá en su enlace de reservación y en su estado de cuenta PDF, separadas
            de las políticas generales de la agencia (Configuración → Políticas).
          </p>
          {fieldState.error && <p className="text-xs text-red-500">{fieldState.error.message}</p>}
        </div>
      )}
    />
  );
}
