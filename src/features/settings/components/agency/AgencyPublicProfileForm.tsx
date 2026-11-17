"use client";

import { Building2, Mail, MapPin, Store } from "lucide-react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { PhoneField } from "@/components/shared/PhoneField";
import type { AgencyInput } from "../../schemas/agency.schema";
import { AgencyFormField } from "./AgencyFormField";
import { AgencySettingsCard } from "./AgencySettingsCard";

/** Tarjeta "Perfil Público": dirección, nombre comercial, correo y WhatsApp de la agencia. */
export function AgencyPublicProfileForm({ disabled }: { disabled: boolean }) {
  const { register, control, setValue, trigger } = useFormContext<AgencyInput>();
  // `useFormState` (no `formState` del contexto): compatible con el React Compiler.
  const { errors } = useFormState({ control });
  const phoneCountry = useWatch({ control, name: "phoneCountry" });

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
      {/* País + número (2026-11-16): antes solo 10 dígitos con un "+52" visual fijo. */}
      <div>
        <Label
          htmlFor="phone"
          className="mb-1.5 block text-xs font-semibold text-slate-700 sm:text-sm"
        >
          WhatsApp Oficial
        </Label>
        <PhoneField
          id="phone"
          registration={register("phone")}
          country={phoneCountry}
          onCountryChange={(country) => {
            setValue("phoneCountry", country, { shouldDirty: true });
            void trigger("phone");
          }}
          placeholder="Ej. 2281234567"
          invalid={Boolean(errors.phone)}
          disabled={disabled}
          inputClassName="h-12 rounded-xl border-slate-200 bg-white px-4 text-sm focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-100 sm:h-10"
        />
        {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
      </div>
    </AgencySettingsCard>
  );
}
