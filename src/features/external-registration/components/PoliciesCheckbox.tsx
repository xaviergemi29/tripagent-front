"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { FormFieldError } from "./FormFieldError";

export interface PoliciesCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onOpenModal: () => void;
  agencyName: string;
  errorMessage?: string;
  disabled?: boolean;
}

const CHECKBOX_ID = "policies-consent-checkbox";

/**
 * Casilla obligatoria del registro (`privacyNoticeAccepted`, regla 19). Desde el 2026-11-22 combina
 * la declaración de mayoría de edad y de autorización de los acompañantes (o patria potestad o
 * tutela de los menores) con la aceptación de las políticas y el aviso de privacidad. Ya no menciona
 * notas médicas: el registro no recaba datos de salud.
 */
export function PoliciesCheckbox({
  checked,
  onChange,
  onOpenModal,
  agencyName,
  errorMessage,
  disabled = false,
}: PoliciesCheckboxProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 transition-colors hover:border-slate-300">
        <Checkbox
          id={CHECKBOX_ID}
          checked={checked}
          disabled={disabled}
          onCheckedChange={(value) => onChange(value === true)}
          aria-label="Declaro ser mayor de edad, contar con la autorización de mis acompañantes y acepto las políticas de viaje y el aviso de privacidad"
          aria-invalid={errorMessage ? true : undefined}
          className="mt-0.5"
        />
        <label
          htmlFor={CHECKBOX_ID}
          className="cursor-pointer text-xs leading-snug text-slate-700 select-none sm:text-sm"
        >
          Declaro ser mayor de edad y contar con la autorización de mis acompañantes (o ejercer la
          patria potestad o tutela de los menores) para registrar sus datos, y acepto las{" "}
          <button
            type="button"
            onClick={(event) => {
              // Dentro del <label>: sin esto, el clic también marcaría la casilla.
              event.preventDefault();
              event.stopPropagation();
              onOpenModal();
            }}
            className="inline font-semibold text-indigo-700 underline transition-colors hover:text-indigo-800"
          >
            Políticas de Viaje y Aviso de Privacidad
          </button>{" "}
          de {agencyName} para la organización de este viaje. *
        </label>
      </div>
      {errorMessage && (
        <FormFieldError className="px-1 font-medium text-red-600">{errorMessage}</FormFieldError>
      )}
    </div>
  );
}
