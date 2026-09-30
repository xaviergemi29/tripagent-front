"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Compass,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useLogin } from "../../../features/settings/hooks/useAuth";
import { loginSchema, type LoginFormValues } from "../schemas/login.schema";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const { mutate: login, isPending } = useLogin();

  const {
    handleSubmit,
    register,
    formState: { errors, isValid },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Limpiar el error del servidor en cuanto el usuario empiece a corregir
  const handleInputChange = (): void => {
    if (authError) setAuthError(null);
  };

  const onSubmit = (data: LoginFormValues): void => {
    setAuthError(null);

    // Inyectamos los callbacks directamente en la llamada a la mutación para controlar la UI local
    login(data);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-slate-50/70 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] p-4">
      <div className="w-full max-w-[420px] space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
        {/* Header de Marca */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-xs">
            <Compass className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">TripAgent</h1>
          <p className="mt-0.5 text-sm font-medium text-slate-500">Centro de Control Logístico</p>
          <div className="mx-auto mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Panel de Agencia
          </div>
        </div>

        {/* Formulario RHF */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {authError && (
            <div
              role="alert"
              aria-live="polite"
              className="animate-in fade-in-50 zoom-in-95 duration-200"
            >
              <Alert
                variant="destructive"
                className="flex items-start gap-2.5 rounded-xl border-red-200 bg-red-50/90 p-3 text-red-800 shadow-xs"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <AlertDescription className="text-xs leading-relaxed font-medium">
                  {authError}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Campo: Correo Electrónico */}
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-xs font-bold tracking-wider text-slate-700 uppercase"
            >
              Correo Electrónico
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                placeholder="admin@agencia.com"
                disabled={isPending}
                className={`h-11 rounded-xl pl-10 text-sm transition-colors ${
                  errors.email || authError
                    ? "border-red-300 bg-red-50/10 focus-visible:ring-red-400"
                    : "border-slate-200 bg-white focus-visible:ring-indigo-600"
                }`}
                {...register("email", { onChange: handleInputChange })}
              />
            </div>
            <div className="min-h-[20px]">
              {errors.email && (
                <p className="animate-in fade-in slide-in-from-top-1 mt-1 text-xs font-semibold text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          {/* Campo: Contraseña */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-xs font-bold tracking-wider text-slate-700 uppercase"
              >
                Contraseña
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                ¿Olvidaste tu acceso?
              </Link>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••••••"
                disabled={isPending}
                className={`h-11 rounded-xl pr-10 pl-10 text-sm transition-colors ${
                  errors.password || authError
                    ? "border-red-300 bg-red-50/10 focus-visible:ring-red-400"
                    : "border-slate-200 bg-white focus-visible:ring-indigo-600"
                }`}
                {...register("password", { onChange: handleInputChange })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="min-h-[20px]">
              {errors.password && (
                <p className="animate-in fade-in slide-in-from-top-1 mt-1 text-xs font-semibold text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          {/* Botón de Envío */}
          <Button
            type="submit"
            disabled={isPending || !isValid}
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-md transition-all hover:bg-indigo-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Validando acceso...
              </>
            ) : (
              <>
                Iniciar Sesión <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="flex items-center justify-center gap-1.5 border-t border-slate-100 pt-4 text-xs font-medium text-emerald-700">
          <ShieldCheck className="h-4 w-4 text-emerald-600" /> Acceso seguro para tu agencia
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        TripAgent • Plataforma para agencias de tours
      </p>
    </div>
  );
}
