"use client";

import { Building2, Mail, MapPin, Phone, Store } from "lucide-react";
import { useFormContext, useFormState } from "react-hook-form";
import type { AgencyInput } from "../../schemas/agency.schema";
import { AgencyFormField } from "./AgencyFormField";
import { AgencySettingsCard } from "./AgencySettingsCard";

/** Tarjeta "Perfil Público": dirección, nombre comercial, correo y WhatsApp de la agencia. */
export function AgencyPublicProfileForm({ disabled }: { disabled: boolean }) {
  const { register, control } = useFormContext<AgencyInput>();
  // `useFormState` (no `formState` del contexto): compatible con el React Compiler.
  const { errors } = useFormState({ control });

  return (
    <AgencySettingsCard
      icon={Store}
      title="Perfil Público"
      description="Estos datos aparecerán en tus folletos digitales y mensajes de WhatsApp."
    >
      <AgencyFormField
        id="address"
        label="Dirección Física / Sucursal (Opcional)"
        icon={MapPin}
        placeholder="Calle, Número, Colonia, Ciudad"
        registration={register("address")}
        error={errors.address?.message}
        disabled={disabled}
      />
      <AgencyFormField
        id="name"
        label={
          <>
            Nombre Comercial <span aria-hidden>*</span>
          </>
        }
        icon={Building2}
        registration={register("name")}
        error={errors.name?.message}
        disabled={disabled}
      />
      <AgencyFormField
        id="email"
        type="email"
        label="Correo Electrónico Público"
        icon={Mail}
        placeholder="contacto@tuagencia.com"
        registration={register("email")}
        error={errors.email?.message}
        disabled={disabled}
      />
      {/* "+52" es solo visual: se guardan los 10 dígitos que se capturan (mismo contrato). */}
      <AgencyFormField
        id="phone"
        type="tel"
        inputMode="numeric"
        maxLength={10}
        label="WhatsApp Oficial (10 dígitos)"
        icon={Phone}
        prefix="+52"
        placeholder="Ej. 2281234567"
        registration={register("phone")}
        error={errors.phone?.message}
        disabled={disabled}
      />
    </AgencySettingsCard>
  );
}
