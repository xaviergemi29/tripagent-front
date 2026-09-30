"use client";

import { useForm } from "react-hook-form";
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
import { useAgency, useUpdateAgency } from "../hooks/useAgency";
import { AgencyInput, updateAgencyFormSchema } from "../schemas/agency.schema";

export function AgencyTab() {
  const { data: agencyData, isLoading: isFetching, isError } = useAgency();
  const { mutateAsync: updateAgency, isPending: isUpdating } = useUpdateAgency();
  const form = useForm<AgencyInput>({
    resolver: zodResolver(updateAgencyFormSchema),
    mode: "onChange",
    values: agencyData
      ? {
          ...agencyData,
        }
      : undefined,
  });

  const onSubmit = async (formData: AgencyInput): Promise<void> => {
    await updateAgency({ agencyData: formData });
  };

  if (isError) {
    return (
      <div className="flex h-40 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-red-600">
        <AlertCircle className="h-5 w-5" />
        <p className="text-sm font-semibold">Error al cargar la información de la agencia.</p>
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
          {/* Nombre Comercial */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre Comercial</Label>
            <Input id="name" {...form.register("name")} disabled={isFormLocked} />
            {form.formState.errors.name && (
              <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Correo Electrónico */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo Electrónico Público</Label>
            <Input
              id="email"
              type="email"
              placeholder="contacto@tuagencia.com"
              {...form.register("email")}
              disabled={isFormLocked}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
            )}
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
              disabled={isFormLocked}
            />
            {form.formState.errors.phone && (
              <p className="text-xs text-red-500">{form.formState.errors.phone.message}</p>
            )}
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
              disabled={isFormLocked}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bankAccountHolder">Titular de la Cuenta</Label>
            <Input
              id="bankAccountHolder"
              placeholder="Nombre completo"
              {...form.register("bankAccountHolder")}
              disabled={isFormLocked}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 pb-4">
            <div className="space-y-1.5">
              <Label htmlFor="clabeNumber">CLABE Interbancaria</Label>
              <Input
                id="clabeNumber"
                placeholder="18 dígitos"
                maxLength={18}
                {...form.register("clabeNumber")}
                disabled={isFormLocked}
              />
              {form.formState.errors.clabeNumber && (
                <p className="text-xs text-red-500">{form.formState.errors.clabeNumber.message}</p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="mt-auto border-t bg-slate-50/50 px-6 py-4">
          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 sm:w-auto"
            disabled={isFormLocked || !form.formState.isValid}
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
