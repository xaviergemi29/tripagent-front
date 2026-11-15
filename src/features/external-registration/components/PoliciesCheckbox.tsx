"use client";

import { Checkbox } from "@/components/ui/checkbox";

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
 * Casilla obligatoria del registro: aceptación de las políticas y del aviso de privacidad
 * (`privacyNoticeAccepted`, regla 19). El texto conserva la autorización expresa para tratar las
 * notas médicas del grupo (datos sensibles, LFPDPPP).
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
          aria-label="Acepto las políticas de viaje y el aviso de privacidad"
          aria-invalid={errorMessage ? true : undefined}
          className="mt-0.5"
        />
        <label
          htmlFor={CHECKBOX_ID}
          className="cursor-pointer text-xs leading-snug text-slate-700 select-none sm:text-sm"
        >
          Al registrarme, acepto las{" "}
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
          de {agencyName} y autorizo el uso de los datos de mi grupo, incluidas las notas médicas,
          para la organización de este viaje. *
        </label>
      </div>
      {errorMessage && <p className="px-1 text-xs font-medium text-red-600">{errorMessage}</p>}
    </div>
  );
}
