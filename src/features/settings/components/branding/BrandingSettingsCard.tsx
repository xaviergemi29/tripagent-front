"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Palette, Save } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgency } from "../../hooks/useAgency";
import {
  useAgencyBranding,
  useRemoveAgencyLogo,
  useUpdateBranding,
  useUploadAgencyLogo,
} from "../../hooks/useAgencyBranding";
import {
  brandingFormSchema,
  DEFAULT_BRANDING_COLORS,
  type BrandingFormInput,
  type BrandingInput,
} from "../../schemas/branding.schema";
import { ColorPickerInput } from "./ColorPickerInput";
import { LogoUploader } from "./LogoUploader";

const HEX6 = /^#[0-9a-f]{6}$/i;
const previewColor = (value: string | undefined, fallback: string) =>
  value && HEX6.test(value) ? value : fallback;

/** Miniatura del encabezado y la tabla del comprobante con los colores capturados. */
function ReceiptPreview({
  companyName,
  primaryColor,
  secondaryColor,
  accentColor,
}: {
  companyName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}) {
  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-lg border border-slate-200 bg-white text-[10px] shadow-xs"
    >
      <div className="h-1.5" style={{ backgroundColor: primaryColor }} />
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-slate-900">{companyName}</p>
            <p className="font-semibold text-slate-700">Estado de Cuenta</p>
          </div>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-600">
            • Abono Parcial en Curso
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 font-semibold text-slate-700">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: secondaryColor }} />
          INFORMACIÓN DE TU VIAJE
        </div>
        <p className="flex items-center gap-1.5 font-bold text-slate-700">
          <span className="h-3 w-1 rounded-full" style={{ backgroundColor: accentColor }} />
          TUS ABONOS REGISTRADOS
        </p>
        <div className="overflow-hidden rounded-md">
          <div
            className="grid grid-cols-[1fr_auto] px-2 py-1 font-bold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <span>Fecha & Hora · Concepto</span>
            <span>Importe</span>
          </div>
          <div className="grid grid-cols-[1fr_auto] bg-slate-50 px-2 py-1 text-slate-600">
            <span>01 · Abono a Reserva</span>
            <span className="font-bold text-emerald-600">$1,500.00</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * "Identidad Visual para PDFs": logotipo (archivo físico, se guarda al seleccionarlo) y colores de
 * marca (se guardan con "Guardar Configuración"). Los usa el comprobante / estado de cuenta PDF.
 */
export function BrandingSettingsCard() {
  const { data: branding, isLoading, isError } = useAgencyBranding();
  const { data: agency } = useAgency();
  const { mutate: updateBranding, isPending: isSaving } = useUpdateBranding();
  const { mutate: uploadLogo, isPending: isUploading } = useUploadAgencyLogo();
  const { mutate: removeLogo, isPending: isRemoving } = useRemoveAgencyLogo();

  const form = useForm<BrandingFormInput, unknown, BrandingInput>({
    resolver: zodResolver(brandingFormSchema),
    mode: "onChange",
    defaultValues: { ...DEFAULT_BRANDING_COLORS, accentColor: "" },
    // Sincroniza el formulario con la API sin efectos (compatible con el React Compiler).
    values: branding
      ? {
          primaryColor: branding.primaryColor,
          secondaryColor: branding.secondaryColor,
          accentColor: branding.accentColor ?? "",
        }
      : undefined,
  });
  const [primaryColor, secondaryColor, accentColor] = useWatch({
    control: form.control,
    name: ["primaryColor", "secondaryColor", "accentColor"],
  });
  const effectiveSecondary = previewColor(secondaryColor, DEFAULT_BRANDING_COLORS.secondaryColor);

  if (isError) {
    return (
      <div className="flex h-40 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-red-600">
        <AlertCircle className="h-5 w-5" />
        <p className="text-sm font-semibold">Error al cargar la identidad visual de la agencia.</p>
      </div>
    );
  }

  if (isLoading && !branding) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <Skeleton className="mb-2 h-6 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  const { errors, isDirty, isValid } = form.formState;

  return (
    <form onSubmit={form.handleSubmit((colors) => updateBranding(colors))}>
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5 text-indigo-600" /> Identidad Visual para PDFs
          </CardTitle>
          <CardDescription>
            Tu logotipo y colores aparecerán en los comprobantes y estados de cuenta que descargan
            tus clientes y tu equipo.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <div className="space-y-2">
              <div>
                <Label>Logotipo de la Agencia</Label>
                <p className="mt-0.5 text-xs text-slate-500">
                  Se guarda al seleccionarlo. Recomendado: PNG con fondo transparente.
                </p>
              </div>
              <LogoUploader
                logoPath={branding?.logoPath ?? null}
                isUploading={isUploading}
                isRemoving={isRemoving}
                onSelectFile={(file) => uploadLogo(file)}
                onRemove={() => removeLogo()}
              />
            </div>

            <div className="space-y-2">
              <Label>Vista previa del comprobante</Label>
              <ReceiptPreview
                companyName={agency?.name || "Tu agencia"}
                primaryColor={previewColor(primaryColor, DEFAULT_BRANDING_COLORS.primaryColor)}
                secondaryColor={effectiveSecondary}
                accentColor={previewColor(accentColor, effectiveSecondary)}
              />
            </div>
          </div>

          <div className="space-y-6">
            <Controller
              control={form.control}
              name="primaryColor"
              render={({ field }) => (
                <ColorPickerInput
                  id="primaryColor"
                  label="Color Primario de Marca"
                  description="Franja superior y encabezado de la tabla de abonos del PDF."
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.primaryColor?.message}
                  disabled={isSaving}
                />
              )}
            />
            <Controller
              control={form.control}
              name="secondaryColor"
              render={({ field }) => (
                <ColorPickerInput
                  id="secondaryColor"
                  label="Color Secundario"
                  description="Acentos del PDF: ícono del viaje y título de las cuentas bancarias."
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.secondaryColor?.message}
                  disabled={isSaving}
                />
              )}
            />
            <Controller
              control={form.control}
              name="accentColor"
              render={({ field }) => (
                <ColorPickerInput
                  id="accentColor"
                  label="Color de Acento (opcional)"
                  description="Detalles del PDF: marcas de sección y línea del resumen final."
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  onClear={() => field.onChange("")}
                  fallbackColor={effectiveSecondary}
                  emptyHint="Sin acento propio: el PDF usa el color secundario."
                  error={errors.accentColor?.message}
                  disabled={isSaving}
                />
              )}
            />
          </div>
        </CardContent>

        <CardFooter className="justify-end border-t bg-slate-50/50 px-6 py-4">
          <Button
            type="submit"
            disabled={!isDirty || !isValid || isSaving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 sm:w-auto"
          >
            {isSaving ? (
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
