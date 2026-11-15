"use client";

import { CreditCard, Hash, Landmark, User } from "lucide-react";
import { useFormContext, useFormState } from "react-hook-form";
import type { AgencyInput } from "../../schemas/agency.schema";
import { AgencyFormField } from "./AgencyFormField";
import { AgencySettingsCard } from "./AgencySettingsCard";

/** Tarjeta "Datos Bancarios": banco, titular, CLABE (obligatoria) y tarjeta (opcional). */
export function AgencyBankDetailsForm({ disabled }: { disabled: boolean }) {
  const { register, control } = useFormContext<AgencyInput>();
  const { errors } = useFormState({ control });

  return (
    <AgencySettingsCard
      icon={Landmark}
      title="Datos Bancarios"
      badge={
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
          Transferencias SPEI
        </span>
      }
      description="La información que verán tus viajeros para realizar transferencias."
    >
      <AgencyFormField
        id="bankName"
        label="Banco Emisor"
        icon={Landmark}
        placeholder="Ej: BBVA, Santander, Nu"
        registration={register("bankName")}
        error={errors.bankName?.message}
        disabled={disabled}
      />
      <AgencyFormField
        id="bankAccountHolder"
        label="Titular de la Cuenta"
        icon={User}
        placeholder="Nombre completo"
        registration={register("bankAccountHolder")}
        error={errors.bankAccountHolder?.message}
        disabled={disabled}
      />
      <AgencyFormField
        id="clabeNumber"
        label="CLABE Interbancaria *"
        hint="18 dígitos SPEI"
        icon={Hash}
        inputMode="numeric"
        placeholder="18 dígitos"
        // Margen para espacios o guiones al pegarla (el schema los quita al validar).
        maxLength={24}
        inputClassName="font-mono tracking-wide"
        registration={register("clabeNumber")}
        error={errors.clabeNumber?.message}
        disabled={disabled}
      />
      <AgencyFormField
        id="cardNumber"
        label="Número de Tarjeta (16 dígitos, opcional)"
        icon={CreditCard}
        inputMode="numeric"
        placeholder="Ej: 4123 4567 8901 2345"
        // 16 dígitos + separadores: antes `maxLength={16}` cortaba el ejemplo con espacios.
        maxLength={19}
        inputClassName="font-mono tracking-wide"
        registration={register("cardNumber")}
        error={errors.cardNumber?.message}
        disabled={disabled}
      />
    </AgencySettingsCard>
  );
}
