"use client";

import { useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Building2, Landmark, Save, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgency, useUpdateAgency } from "../hooks/useAgency";
import { AgencyInput, updateAgencyFormSchema } from "../schemas/agency.schema";

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
  // leer `form.formState` en el render queda memorizado y los errores no se mostraban.
  const { errors, isDirty, isValid } = useFormState({ control: form.control });

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

  if (isFetching && !agencyData) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Esqueleto Tarjeta 1 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <Skeleton className="mb-2 h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Esqueleto Tarjeta 2 */}
        <Card className="flex flex-col shadow-sm">
          <CardHeader className="pb-4">
            <Skeleton className="mb-2 h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </CardContent>
          <CardFooter className="mt-auto border-t bg-slate-50/50 px-6 py-4">
            <Skeleton className="h-10 w-full rounded-md sm:w-40" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  const isFormLocked = isFetching || isUpdating;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* TARJETA 1: Perfil Público */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-indigo-600" /> Perfil Público
          </CardTitle>
          <CardDescription>
            Estos datos aparecerán en tus folletos digitales y mensajes de WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dirección Física */}
          <div className="space-y-1.5">
            <Label htmlFor="address">Dirección Física / Sucursal (Opcional)</Label>
            <Input
              id="address"
              placeholder="Calle, Número, Colonia, Ciudad"
              {...form.register("address")}
              aria-invalid={Boolean(errors.address)}
              disabled={isFormLocked}
            />
            {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
          </div>

          {/* Nombre Comercial */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre Comercial</Label>
            <Input
              id="name"
              {...form.register("name")}
              aria-invalid={Boolean(errors.name)}
              disabled={isFormLocked}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          {/* Correo Electrónico */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo Electrónico Público</Label>
            <Input
              id="email"
              type="email"
              placeholder="contacto@tuagencia.com"
              {...form.register("email")}
              aria-invalid={Boolean(errors.email)}
              disabled={isFormLocked}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          {/* Teléfono */}
          <div className="space-y-1.5">
            <Label htmlFor="phone">WhatsApp Oficial (10 dígitos)</Label>
            <Input
              id="phone"
              type="tel"
              maxLength={10}
              placeholder="Ej. 2281234567"
              {...form.register("phone")}
              aria-invalid={Boolean(errors.phone)}
              disabled={isFormLocked}
            />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* TARJETA 2: Datos Bancarios */}
      <Card className="flex flex-col shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Landmark className="h-5 w-5 text-indigo-600" /> Datos Bancarios
          </CardTitle>
          <CardDescription>
            La información que verán tus viajeros para realizar transferencias.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bankName">Banco Emisor</Label>
            <Input
              id="bankName"
              placeholder="Ej: BBVA, Santander, Nu"
              {...form.register("bankName")}
              aria-invalid={Boolean(errors.bankName)}
              disabled={isFormLocked}
            />
            {errors.bankName && <p className="text-xs text-red-500">{errors.bankName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bankAccountHolder">Titular de la Cuenta</Label>
            <Input
              id="bankAccountHolder"
              placeholder="Nombre completo"
              {...form.register("bankAccountHolder")}
              aria-invalid={Boolean(errors.bankAccountHolder)}
              disabled={isFormLocked}
            />
            {errors.bankAccountHolder && (
              <p className="text-xs text-red-500">{errors.bankAccountHolder.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clabeNumber">CLABE Interbancaria *</Label>
            <Input
              id="clabeNumber"
              placeholder="18 dígitos"
              // Margen para espacios o guiones al pegarla (se quitan al validar).
              maxLength={24}
              {...form.register("clabeNumber")}
              aria-invalid={Boolean(errors.clabeNumber)}
              disabled={isFormLocked}
            />
            {errors.clabeNumber && (
              <p className="text-xs text-red-500">{errors.clabeNumber.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cardNumber">Número de Tarjeta (16 dígitos, opcional)</Label>
            <Input
              id="cardNumber"
              placeholder="Ej: 4123 4567 8901 2345"
              // 16 dígitos + separadores: antes `maxLength={16}` cortaba el ejemplo con espacios.
              maxLength={19}
              {...form.register("cardNumber")}
              aria-invalid={Boolean(errors.cardNumber)}
              disabled={isFormLocked}
            />
            {errors.cardNumber && (
              <p className="text-xs text-red-500">{errors.cardNumber.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="mt-auto border-t bg-slate-50/50 px-6 py-4">
          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 sm:w-auto"
            // Deshabilitado sin cambios, con algún campo inválido (p. ej. la tarjeta incompleta) o
            // mientras carga o guarda: antes quedaba comentado y el botón siempre estaba activo.
            disabled={isFormLocked || !isDirty || !isValid}
          >
            {isUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar Configuración
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
