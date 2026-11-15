"use client";

import { FormProvider, useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgency, useUpdateAgency } from "../hooks/useAgency";
import { AgencyInput, updateAgencyFormSchema } from "../schemas/agency.schema";
import { AgencyBankDetailsForm } from "./agency/AgencyBankDetailsForm";
import { AgencyPublicProfileForm } from "./agency/AgencyPublicProfileForm";
import { SaveSettingsButton } from "./agency/SaveSettingsButton";

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
  const { data: agencyData, isLoading: isFetching, isError } = useAgency();
  const { mutateAsync: updateAgency, isPending: isUpdating } = useUpdateAgency();
  const form = useForm<AgencyInput>({
    resolver: zodResolver(updateAgencyFormSchema),
    mode: "onChange",
    values: agencyData,
    resetOptions: { keepDirtyValues: true },
  });
  // `useFormState` (no `form.formState`) y antes de los `return` tempranos: con el React Compiler,
  // leer `form.formState` en el render queda memorizado y el botón no se actualizaba.
  const { isDirty, isValid } = useFormState({ control: form.control });

  // El schema ya quitó espacios y guiones de la CLABE y la tarjeta (`stripAccountSeparators`).
  const onSubmit = async (formData: AgencyInput): Promise<void> => {
    try {
      await updateAgency(formData);
      // Lo guardado deja de contar como cambio pendiente: con `keepDirtyValues`, la recarga de
      // `values` conservaría los campos "sucios" y "Guardar" seguiría habilitado tras guardar.
      form.reset(form.getValues());
    } catch {
      // `useUpdateAgency` ya muestra el error en un toast; se conservan los cambios para reintentar.
    }
  };

  if (isError) {
    return (
      <div className="flex h-40 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-red-600">
        <AlertCircle className="h-5 w-5" />
        <p className="text-sm font-semibold">Error al cargar la información de la agencia.</p>
      </div>
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
