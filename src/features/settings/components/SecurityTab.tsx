"use client";

import type { UseFormRegisterReturn } from "react-hook-form";
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

/** Campo de contraseña con etiqueta arriba y altura táctil cómoda (h-12) en celular. */
function PasswordField({
  id,
  label,
  autoComplete,
  registration,
  error,
  disabled,
}: {
  id: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  registration: UseFormRegisterReturn;
  error?: string;
  disabled: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 text-xs font-semibold text-slate-700">
        {label}
      </Label>
      <Input
        id={id}
        type="password"
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        disabled={disabled}
        className="h-12 rounded-xl border-slate-200 bg-white px-4 py-3 text-sm focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-100 sm:h-10 sm:py-2"
        {...registration}
      />
      {error && <p className="mt-1 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}

/**
 * Configuración → Seguridad: sesión actual (correo y rol de `useSession`) y cambio de contraseña
 * (`POST /auth/change-password`). Diseño mobile-first: campos apilados y botón de ancho completo en
 * celular. No hay autenticación de dos pasos (2FA) en el MVP.
 */
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
    <div className="mx-auto max-w-2xl">
      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Seguridad de la Cuenta</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Administra tus credenciales de acceso y sesiones activas.
            </p>
          </div>
        </div>

        {/* Sesión actual (solo lectura). Antes eran textos fijos ("admin@brujitours.com"). */}
        <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Sesión Actual
            </p>
            {session ? (
              <p className="mt-0.5 text-sm font-semibold break-all text-slate-800">
                {session.email}
              </p>
            ) : (
              <Skeleton className="mt-1 h-5 w-40" />
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Rol</p>
            {roleLabel ? (
              <p className="mt-0.5 text-xs font-bold text-slate-700">{roleLabel}</p>
            ) : (
              <Skeleton className="mt-1 ml-auto h-4 w-20" />
            )}
          </div>
        </div>

        <form
          onSubmit={handleSubmit(handlePasswordChange)}
          className="mt-5 space-y-4 border-t border-slate-100 pt-5"
        >
          <PasswordField
            id="currentPass"
            label="Contraseña Actual"
            autoComplete="current-password"
            registration={register("currentPassword")}
            error={errors.currentPassword?.message}
            disabled={isPending}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PasswordField
              id="newPass"
              label="Nueva Contraseña"
              autoComplete="new-password"
              registration={register("newPassword")}
              error={errors.newPassword?.message}
              disabled={isPending}
            />
            <PasswordField
              id="confirmPass"
              label="Confirmar Nueva Contraseña"
              autoComplete="new-password"
              registration={register("confirmPassword")}
              error={errors.confirmPassword?.message}
              disabled={isPending}
            />
          </div>

          <Button
            type="submit"
            className="mt-4 h-auto w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold hover:bg-slate-800 sm:w-auto"
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
      </section>
    </div>
  );
}
