"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useForm, useFormState, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, AtSign, Building2, Eye, EyeOff, Loader2, User } from "lucide-react";

import { PhoneField } from "@/components/shared/PhoneField";
import { SimplifiedPrivacyNotice } from "@/components/shared/SimplifiedPrivacyNotice";
import { SUPPORT_EMAIL, TRIPAGENT_ADDRESS, TRIPAGENT_LEGAL_NAME } from "@/lib/support-config";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/lib/api-client";
import { DEFAULT_PHONE_COUNTRY, toE164 } from "@/shared/utils/phone.util";
import { SUBSCRIPTION_PLAN } from "@/shared/constants/domain.constants";
import {
  registerAgencyFormSchema,
  type RegisterAgencyFormInput,
  type RegisterAgencyInput,
} from "../schemas/register-agency.schema";
import { useRegisterAgency } from "../hooks/useRegisterAgency";

interface RegisterAgencyFormProps {
  /** `?plan=` de la URL (hoy hay un solo plan; se envía como dato informativo). */
  plan: string;
}

const LABEL_CLASS = "mb-1.5 block text-xs font-bold tracking-wider text-slate-600 uppercase";
const SHELL_CLASS =
  "flex h-12 items-center gap-2 rounded-2xl border bg-slate-50/70 px-4 transition-all focus-within:border-indigo-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-600/10";
const INPUT_CLASS =
  "h-full w-full min-w-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60";

/** Mensaje de error de un campo. */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-xs font-semibold text-red-600">
      {message}
    </p>
  );
}

/** Contenedor con el estilo base de los campos (input + ícono a la derecha). */
function FieldShell({ invalid, children }: { invalid: boolean; children: ReactNode }) {
  return (
    <div className={cn(SHELL_CLASS, invalid ? "border-red-300" : "border-slate-200/90")}>
      {children}
    </div>
  );
}

/** Formulario de alta de agencia: crea la cuenta, abre la sesión y lleva a /tours. */
export function RegisterAgencyForm({ plan }: RegisterAgencyFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { mutate, isPending, error, reset: resetMutation } = useRegisterAgency();

  const form = useForm<RegisterAgencyFormInput, unknown, RegisterAgencyInput>({
    resolver: zodResolver(registerAgencyFormSchema),
    mode: "onTouched",
    defaultValues: {
      fullName: "",
      agencyName: "",
      whatsapp: "",
      whatsappCountry: DEFAULT_PHONE_COUNTRY,
      email: "",
      password: "",
      plan,
    },
  });
  const { register, handleSubmit, setValue, trigger, setError, control } = form;
  const { errors } = useFormState({ control });
  const whatsappCountry = useWatch({ control, name: "whatsappCountry" });

  // 409 (correo ya registrado) se explica junto al correo; lo demás (429, red, 500) arriba.
  const generalError = error && error.status !== 409 ? error : null;

  const onSubmit = (values: RegisterAgencyInput) => {
    const whatsapp = toE164(values.whatsapp, values.whatsappCountry) ?? values.whatsapp;
    mutate(
      { ...values, whatsapp },
      {
        onError: (apiError: ApiError) => {
          if (apiError.status === 409) setError("email", { message: apiError.message });
        },
      },
    );
  };

  return (
    <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-10">
      <span className="mb-4 hidden items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 sm:inline-flex">
        🇲🇽 {SUBSCRIPTION_PLAN.trialDaysTotal} días gratis · Sin tarjeta de crédito
      </span>
      <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 sm:hidden">
        🇲🇽 {SUBSCRIPTION_PLAN.trialDaysTotal} días gratis ($0 MXN hoy) · Sin tarjeta
      </span>

      <h1 className="mb-2 text-3xl leading-tight font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        Crea la cuenta de tu agencia
      </h1>
      <p className="mb-6 text-sm text-slate-500 sm:text-base">
        Configura tu primera salida grupal en menos de 2 minutos.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {generalError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50/90 p-3 text-xs font-medium text-red-800"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
            {generalError.message || "No pudimos crear tu cuenta. Inténtalo de nuevo."}
          </div>
        )}

        <div>
          <label htmlFor="register-full-name" className={LABEL_CLASS}>
            Tu nombre completo
          </label>
          <FieldShell invalid={!!errors.fullName}>
            <input
              id="register-full-name"
              autoComplete="name"
              placeholder="Ej. Carlos Mendoza"
              disabled={isPending}
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? "register-full-name-error" : undefined}
              className={INPUT_CLASS}
              {...register("fullName")}
            />
            <User className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          </FieldShell>
          <FieldError id="register-full-name-error" message={errors.fullName?.message} />
        </div>

        <div>
          <label htmlFor="register-agency-name" className={LABEL_CLASS}>
            Nombre de tu agencia
          </label>
          <FieldShell invalid={!!errors.agencyName}>
            <input
              id="register-agency-name"
              autoComplete="organization"
              placeholder="Ej. Viajes Aventureros MX"
              disabled={isPending}
              aria-invalid={!!errors.agencyName}
              aria-describedby={errors.agencyName ? "register-agency-name-error" : undefined}
              className={INPUT_CLASS}
              {...register("agencyName")}
            />
            <Building2 className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          </FieldShell>
          <FieldError id="register-agency-name-error" message={errors.agencyName?.message} />
        </div>

        <div>
          <label htmlFor="register-whatsapp" className={LABEL_CLASS}>
            WhatsApp de contacto
          </label>
          <PhoneField
            id="register-whatsapp"
            autoComplete="tel-national"
            registration={register("whatsapp")}
            country={whatsappCountry}
            onCountryChange={(country) => {
              setValue("whatsappCountry", country, { shouldDirty: true });
              if (errors.whatsapp) void trigger("whatsapp");
            }}
            placeholder="228 123 4567"
            disabled={isPending}
            invalid={!!errors.whatsapp}
            inputClassName="h-12 rounded-2xl border-slate-200/90 bg-slate-50/70 text-sm focus-visible:bg-white"
          />
          {errors.whatsapp ? (
            <FieldError id="register-whatsapp-error" message={errors.whatsapp.message} />
          ) : (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
              Te enviaremos aquí tu acceso y soporte personalizado.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="register-email" className={LABEL_CLASS}>
            Correo electrónico de acceso
          </label>
          <FieldShell invalid={!!errors.email}>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="carlos@tuagencia.com"
              disabled={isPending}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "register-email-error" : undefined}
              className={INPUT_CLASS}
              {...register("email", {
                onChange: () => {
                  if (error?.status === 409) resetMutation();
                },
              })}
            />
            <AtSign className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          </FieldShell>
          <FieldError id="register-email-error" message={errors.email?.message} />
          {error?.status === 409 && (
            <p className="mt-1 text-xs text-slate-600">
              <Link href="/login" className="font-semibold text-indigo-600 hover:underline">
                Ir a iniciar sesión
              </Link>
            </p>
          )}
        </div>

        <div>
          <label htmlFor="register-password" className={LABEL_CLASS}>
            Contraseña
          </label>
          <FieldShell invalid={!!errors.password}>
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              disabled={isPending}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "register-password-error" : undefined}
              className={INPUT_CLASS}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="shrink-0 rounded-md p-1 text-slate-400 hover:text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </FieldShell>
          <FieldError id="register-password-error" message={errors.password?.message} />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 text-base font-bold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Creando cuenta de agencia...
            </>
          ) : (
            <>Activar mis {SUBSCRIPTION_PLAN.trialDaysTotal} días gratis →</>
          )}
        </button>

        <p className="mt-4 text-center text-xs text-slate-400">
          Al registrarte aceptas nuestros{" "}
          <Link href="/terminos" className="underline hover:text-slate-600">
            Términos de Servicio
          </Link>{" "}
          y{" "}
          <Link href="/privacidad" className="underline hover:text-slate-600">
            Aviso de Privacidad
          </Link>
          .
        </p>

        {/* Aviso de privacidad simplificado (LFPDPPP arts. 15-16): TripAgent es el responsable. */}
        <SimplifiedPrivacyNotice
          responsibleName={TRIPAGENT_LEGAL_NAME}
          responsibleAddress={TRIPAGENT_ADDRESS}
          dataCollected="tu nombre, el nombre de tu agencia, tu WhatsApp y tu correo"
          purpose="crear y administrar la cuenta de tu agencia, darte soporte y gestionar tu suscripción"
          rightsContact={`escribe a ${SUPPORT_EMAIL}`}
          fullNoticeHref="/privacidad"
        />
      </form>
    </section>
  );
}
