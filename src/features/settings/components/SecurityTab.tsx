"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShieldCheck, KeyRound, Loader2 } from "lucide-react";
import { useForm, useFormState } from "react-hook-form";
import { ChangePasswordInput, changePasswordSchema } from "@/features/auth/schemas/security.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useChangePassword } from "@/features/auth/hooks/useAuth";
import { useSession } from "@/features/auth/hooks/useSession";
import { Skeleton } from "@/components/ui/skeleton";
import type { AgencyRole } from "@/shared/constants/domain.constants";
import { AGENCY_ROLE_DICT } from "@/shared/utils/config/status-dictionaries.config";

export function SecurityTab() {
  const { isPending, mutateAsync: changePassword } = useChangePassword();
  const { data: session } = useSession();
  const { register, handleSubmit, reset, control } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  // `useFormState` en lugar de `formState` de `useForm` (mismo criterio que las demás pestañas,
  // por el React Compiler).
  const { errors, isValid } = useFormState({ control });

  const handlePasswordChange = async (formData: ChangePasswordInput): Promise<void> => {
    try {
      await changePassword(formData);
      reset();
    } catch {
      // `useChangePassword` ya muestra el error en un toast; se conservan los campos.
    }
  };

  const roleLabel = session
    ? (AGENCY_ROLE_DICT[session.role as AgencyRole] ?? session.role)
    : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="mb-4 border-b border-slate-100 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-slate-700" /> Seguridad de la Cuenta
          </CardTitle>
          <CardDescription>
            Administra tus credenciales de acceso y sesiones activas.
          </CardDescription>
        </CardHeader>

        {/* INFO DE SESIÓN (Read-Only) */}
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Sesión Actual</p>
              {/* Antes eran textos fijos ("admin@brujitours.com", "Administrador"). */}
              {session ? (
                <p className="mt-0.5 font-medium text-slate-900">{session.email}</p>
              ) : (
                <Skeleton className="mt-1 h-5 w-48" />
              )}
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-500 uppercase">Rol</p>
              {roleLabel ? (
                <p className="mt-0.5 font-medium text-slate-900">{roleLabel}</p>
              ) : (
                <Skeleton className="mt-1 ml-auto h-5 w-24" />
              )}
            </div>
          </div>

          {/* FORMULARIO DE PASSWORD */}
          <form onSubmit={handleSubmit(handlePasswordChange)} className="space-y-4 border-t pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPass">Contraseña Actual</Label>
              <Input
                id="currentPass"
                {...register("currentPassword")}
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.currentPassword)}
                disabled={isPending}
              />
              {errors.currentPassword && (
                <p className="text-xs font-medium text-red-500">{errors.currentPassword.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="newPass">Nueva Contraseña</Label>
                <Input
                  id="newPass"
                  {...register("newPassword")}
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.newPassword)}
                  disabled={isPending}
                />
                {errors.newPassword && (
                  <p className="text-xs font-medium text-red-500">{errors.newPassword.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPass">Confirmar Nueva Contraseña</Label>
                <Input
                  id="confirmPass"
                  {...register("confirmPassword")}
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  disabled={isPending}
                />
                {errors.confirmPassword && (
                  <p className="text-xs font-medium text-red-500">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="mt-4 bg-slate-900 hover:bg-slate-800"
              disabled={isPending || !isValid}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...
                </>
              ) : (
                <>
                  <KeyRound className="mr-2 h-4 w-4" /> Actualizar Contraseña
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
