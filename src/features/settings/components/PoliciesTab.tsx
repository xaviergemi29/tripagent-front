"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Save, ScrollText } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { POLICIES_MAX_LENGTH } from "@/shared/constants/domain.constants";
import { useAgency, useUpdateAgencyPolicies } from "../hooks/useAgency";
import {
  agencyPoliciesFormSchema,
  type AgencyPoliciesFormInput,
  type AgencyPoliciesInput,
} from "../schemas/agency.schema";

const PLACEHOLDER = [
  "Ej.:",
  "• El anticipo no es reembolsable.",
  "• Cancelaciones con más de 7 días de anticipación: se retiene el 20% del total.",
  "• Presentarse 15 minutos antes de la hora de abordaje con identificación oficial.",
  "• Los menores de edad viajan acompañados de un adulto responsable.",
].join("\n");

/**
 * Políticas generales de la agencia. Se imprimen en el estado de cuenta PDF (cliente y operador),
 * después de las políticas específicas de cada tour.
 */
export function PoliciesTab() {
  const { data: agency, isLoading, isError } = useAgency();
  const { mutate: savePolicies, isPending } = useUpdateAgencyPolicies();

  const form = useForm<AgencyPoliciesFormInput, unknown, AgencyPoliciesInput>({
    resolver: zodResolver(agencyPoliciesFormSchema),
    mode: "onChange",
    defaultValues: { policies: "" },
    // Sincroniza con la API sin efectos (compatible con el React Compiler).
    values: agency ? { policies: agency.policies ?? "" } : undefined,
  });
  const policies = useWatch({ control: form.control, name: "policies" }) ?? "";

  if (isError) {
    return (
      <div className="flex h-40 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-red-600">
        <AlertCircle className="h-5 w-5" />
        <p className="text-sm font-semibold">Error al cargar las políticas de la agencia.</p>
      </div>
    );
  }

  if (isLoading && !agency) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <Skeleton className="mb-2 h-6 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-56 w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  const { errors, isDirty, isValid } = form.formState;
  const isOverLimit = policies.length > POLICIES_MAX_LENGTH;

  return (
    <form onSubmit={form.handleSubmit((values) => savePolicies(values))}>
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ScrollText className="h-5 w-5 text-indigo-600" /> Políticas de la Agencia
          </CardTitle>
          <CardDescription>
            Condiciones generales de cancelación, pagos y viaje. Se imprimen al final del estado de
            cuenta PDF, después de las políticas específicas de cada tour (que se capturan en el
            formulario del tour).
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-2">
          <Label htmlFor="agency-policies">Políticas generales</Label>
          <Textarea
            id="agency-policies"
            rows={12}
            placeholder={PLACEHOLDER}
            disabled={isPending}
            aria-invalid={Boolean(errors.policies)}
            className="min-h-56 resize-y text-sm leading-relaxed"
            {...form.register("policies")}
          />
          <div className="flex items-start justify-between gap-3 text-xs">
            <p className={errors.policies ? "text-red-500" : "text-slate-500"}>
              {errors.policies?.message ??
                "Cada salto de línea se respeta en el PDF. Déjalo vacío para no imprimir políticas."}
            </p>
            <span
              className={cn(
                "shrink-0 tabular-nums",
                isOverLimit ? "font-semibold text-red-500" : "text-slate-400",
              )}
            >
              {policies.length.toLocaleString("es-MX")} /{" "}
              {POLICIES_MAX_LENGTH.toLocaleString("es-MX")}
            </span>
          </div>
        </CardContent>

        <CardFooter className="justify-end border-t bg-slate-50/50 px-6 py-4">
          <Button
            type="submit"
            disabled={!isDirty || !isValid || isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 sm:w-auto"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar Políticas
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
