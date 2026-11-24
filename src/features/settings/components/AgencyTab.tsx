"use client";

import { FormProvider, useForm, useFormState } from "react-hook-form";
import { QueryErrorState } from "@/components/shared/QueryErrorState";
import { zodResolver } from "@hookform/resolvers/zod";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgency, useUpdateAgency } from "../hooks/useAgency";
import { useSubscriptionAccess } from "../hooks/useSubscriptionAccess";
import { AgencyInput, updateAgencyFormSchema } from "../schemas/agency.schema";
import { AgencyPublicProfileForm } from "./agency/AgencyPublicProfileForm";
import { SaveSettingsButton } from "./agency/SaveSettingsButton";
import { AgencyBankAccountsSection } from "./bank-accounts/AgencyBankAccountsSection";
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
 * Configuración → Agencia (`?tab=agency`): formulario del perfil público (`PATCH /agencies`) y, a su
 * lado, la sección "Cuentas bancarias" con sus propias mutaciones (fuera del `<form>` del perfil:
 * sus diálogos no deben enviarlo). Celular: tarjetas apiladas; desde `lg`, dos columnas.
 */
export function AgencyTab() {
  const { canWrite } = useSubscriptionAccess();
  const isReadOnly = !canWrite;
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

  // Modo Solo Lectura por suscripción (2026-11-18): campos y Guardar deshabilitados.
  const isFormLocked = isFetching || isUpdating || isReadOnly;

  return (
    <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2 lg:items-start">
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
          <AgencyPublicProfileForm disabled={isFormLocked} />
          <div className="flex justify-end">
            {/* Deshabilitado sin cambios, con algún campo inválido o mientras carga o guarda. */}
            <SaveSettingsButton
              disabled={isFormLocked || !isDirty || !isValid}
              isSaving={isUpdating}
            />
          </div>
        </form>
      </FormProvider>
      <AgencyBankAccountsSection canWrite={canWrite} />
    </div>
  );
}
