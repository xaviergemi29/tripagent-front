"use client";

import { useState } from "react";
import { Lock, Mail, Loader2, Eye, EyeOff, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useLogin } from "../hooks/useAuth";
import { loginSchema, type LoginFormValues } from "../schemas/loginSchema";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: login, isPending } = useLogin();

  const {
    handleSubmit,
    register,
    formState: { errors, isValid }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange", // Valida en tiempo real mientras el usuario escribe
    defaultValues: {
      email: "",
      password: "",
    }
  });

  const onSubmit = (data: LoginFormValues) => {
    login(data);
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    toast("Recuperación de contraseña", {
      description: "Por favor, comunícate con el administrador del sistema para restablecer tu acceso.",
      icon: <Info className="w-4 h-4 text-indigo-500" />
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Banner Superior */}
        <div className="bg-indigo-600 px-8 py-10 text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">TripAgent</h1>
          <p className="text-indigo-200 mt-2 text-sm font-medium">Centro de Control Logístico</p>
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
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  id="email"
                  {...register("email")}
                  type="email"
                  autoComplete="email"
                  className={`w-full pl-10 pr-3 py-2.5 bg-slate-50 text-sm focus-visible:ring-indigo-500 transition-colors ${
                    errors.email ? "border-red-300 focus-visible:ring-red-500" : "border-slate-200"
                  }`}
                  placeholder="admin@agencia.com"
                />
              </div>
              {/* Contenedor de altura fija/mínima para evitar saltos bruscos */}
              <div className="min-h-[20px]">
                {errors.email && (
                  <p className="text-xs text-red-500 font-medium animate-in fade-in slide-in-from-top-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            {/* Campo: Contraseña */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  Contraseña
                </label>
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium focus:outline-none focus:underline"
                >
                  ¿Olvidaste tu acceso?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  id="password"
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 text-sm focus-visible:ring-indigo-500 transition-colors ${
                    errors.password ? "border-red-300 focus-visible:ring-red-500" : "border-slate-200"
                  }`}
                  placeholder="••••••••"
                />
                
                {/* 👁️ Toggle Password Visibility */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="min-h-[20px]">
                {errors.password && (
                  <p className="text-xs text-red-500 font-medium animate-in fade-in slide-in-from-top-1">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            {/* Acción Principal */}
            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 mt-2 rounded-lg text-sm font-bold transition-all disabled:opacity-70"
              disabled={isPending || !isValid}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Verificando credenciales...
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