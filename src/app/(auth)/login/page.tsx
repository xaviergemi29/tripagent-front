"use client";

import { useState } from "react";
import { Lock, Mail, Loader2, Eye, EyeOff, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useLogin } from "../../../features/settings/hooks/useAuth";
import { loginSchema, type LoginFormValues } from "../schemas/login.schema";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: login, isPending } = useLogin();

  const {
    handleSubmit,
    register,
    formState: { errors, isValid },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    login(data);
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    toast("Recuperación de contraseña", {
      description:
        "Por favor, comunícate con el administrador del sistema para restablecer tu acceso.",
      icon: <Info className="h-4 w-4 text-indigo-500" />,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
        {/* Banner Superior */}
        <div className="bg-indigo-600 px-8 py-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">TripAgent</h1>
          <p className="mt-2 text-sm font-medium text-indigo-200">Centro de Control Logístico</p>
        </div>

        {/* Formulario */}
        <div className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Campo: Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  id="email"
                  {...register("email")}
                  type="email"
                  autoComplete="email"
                  className={`w-full bg-slate-50 py-2.5 pr-3 pl-10 text-sm transition-colors focus-visible:ring-indigo-500 ${
                    errors.email ? "border-red-300 focus-visible:ring-red-500" : "border-slate-200"
                  }`}
                  placeholder="admin@agencia.com"
                />
              </div>
              {/* Contenedor de altura fija/mínima para evitar saltos bruscos */}
              <div className="min-h-[20px]">
                {errors.email && (
                  <p className="animate-in fade-in slide-in-from-top-1 text-xs font-medium text-red-500">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            {/* Campo: Contraseña */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 focus:underline focus:outline-none"
                >
                  ¿Olvidaste tu acceso?
                </button>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  id="password"
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className={`w-full bg-slate-50 py-2.5 pr-10 pl-10 text-sm transition-colors focus-visible:ring-indigo-500 ${
                    errors.password
                      ? "border-red-300 focus-visible:ring-red-500"
                      : "border-slate-200"
                  }`}
                  placeholder="••••••••"
                />

                {/* 👁️ Toggle Password Visibility */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="min-h-[20px]">
                {errors.password && (
                  <p className="animate-in fade-in slide-in-from-top-1 text-xs font-medium text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            {/* Acción Principal */}
            <Button
              type="submit"
              className="mt-2 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-bold text-white transition-all hover:bg-indigo-700 disabled:opacity-70"
              disabled={isPending || !isValid}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Verificando credenciales...
                </span>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
