"use client";

import { FormProvider, useForm, useFormState } from "react-hook-form";
import { QueryErrorState } from "@/components/shared/QueryErrorState";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgency, useUpdateAgency } from "../hooks/useAgency";
import { AgencyInput, updateAgencyFormSchema } from "../schemas/agency.schema";
import { AgencyBankDetailsForm } from "./agency/AgencyBankDetailsForm";
import { AgencyPublicProfileForm } from "./agency/AgencyPublicProfileForm";
import { SaveSettingsButton } from "./agency/SaveSettingsButton";
import { parseStoredPhone, toE164 } from "@/shared/utils/phone.util";

function AgencyTabSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2">
      {[1, 2].map((card) => (
        <div
          key={card}
          className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 sm:p-6"
        >
          <Skeleton className="h-10 w-2/3 rounded-2xl" />
          {[1, 2, 3, 4].map((field) => (
            <div key={field} className="space-y-1.5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-12 w-full rounded-xl sm:h-10" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Configuración → Agencia (`?tab=agency`): contenedor del formulario (`PATCH /agencies`).
 * Celular: tarjetas apiladas y botón de ancho completo; desde `lg`, dos columnas.
 * Las tarjetas (`agency/`) leen el formulario con `useFormContext`; el schema, el hook y el payload
 * son los mismos de siempre.
 */
export function AgencyTab() {
  const {
    data: agencyData,
    isLoading: isFetching,
    isError,
    refetch: refetchLoad,
    isFetching: isRefetchingLoad,
  } = useAgency();
  const { mutateAsync: updateAgency, isPending: isUpdating } = useUpdateAgency();
  // El WhatsApp guardado (E.164 o 10 dígitos anteriores) se edita como país + número nacional.
  const storedPhone = parseStoredPhone(agencyData?.phone, agencyData?.phoneCountry);
  const form = useForm<AgencyInput>({
    resolver: zodResolver(updateAgencyFormSchema),
    mode: "onChange",
    values: agencyData
      ? { ...agencyData, phone: storedPhone.nationalNumber, phoneCountry: storedPhone.country }
      : undefined,
    resetOptions: { keepDirtyValues: true },
  });
  // `useFormState` (no `form.formState`) y antes de los `return` tempranos: con el React Compiler,
  // leer `form.formState` en el render queda memorizado y el botón no se actualizaba.
  const { isDirty, isValid } = useFormState({ control: form.control });

  // El schema ya quitó espacios y guiones de la CLABE y la tarjeta (`stripAccountSeparators`).
  const onSubmit = async (formData: AgencyInput): Promise<void> => {
    try {
      // La API recibe el WhatsApp en E.164 con su país.
      await updateAgency({
        ...formData,
        phone: toE164(formData.phone, formData.phoneCountry) ?? formData.phone,
      });
      // Lo guardado deja de contar como cambio pendiente: con `keepDirtyValues`, la recarga de
      // `values` conservaría los campos "sucios" y "Guardar" seguiría habilitado tras guardar.
      form.reset(form.getValues());
    } catch {
      // `useUpdateAgency` ya muestra el error en un toast; se conservan los cambios para reintentar.
    }
  };

  // Falló sin datos: motivo + Reintentar (2026-11-16; antes un aviso fijo). Con datos en caché se
  // sigue mostrando el formulario.
  if (isError && !agencyData) {
    return (
      <QueryErrorState
        resourceArticle="la información de tu"
        resourceName="agencia"
        onRetry={() => void refetchLoad()}
        isRetrying={isRefetchingLoad}
      />
    );
  }

  if (isFetching && !agencyData) return <AgencyTabSkeleton />;

  const isFormLocked = isFetching || isUpdating;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2">
          <AgencyPublicProfileForm disabled={isFormLocked} />
          <AgencyBankDetailsForm disabled={isFormLocked} />
        </div>

        <div className="mt-5 flex flex-col gap-4 sm:mt-6 lg:flex-row-reverse lg:items-center">
          {/* Deshabilitado sin cambios, con algún campo inválido (p. ej. la tarjeta incompleta) o
              mientras carga o guarda. */}
          <SaveSettingsButton
            disabled={isFormLocked || !isDirty || !isValid}
            isSaving={isUpdating}
          />
          {/* Solo lo que pasa de verdad: el Magic Link y el estado de cuenta PDF leen los datos
              bancarios vigentes (el folleto público no los muestra). */}
          <div className="flex flex-1 items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
            <p className="text-xs leading-relaxed text-indigo-900">
              Cualquier actualización en los datos bancarios se refleja de inmediato en los enlaces
              de reserva (Magic Link) y en los estados de cuenta PDF de tus clientes.
            </p>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
