"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Copy, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { bookingFormSchema, BookingOutput, type BookingFormValues } from "../schemas/bookingSchema";
import { CompanionsManager } from "./CompanionsManager";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTravelerLookup } from "@/features/travelers/hooks/useTravelers";
import { useCreateBooking } from "../hooks/useBookings";
import { useState } from "react";

export function TourRegistrationView({
  token,
  initialGroupId,
  boardingPoints,
}: {
  token: string;
  initialGroupId?: string;
  boardingPoints: { id: string; location: string; time: string }[];
}) {
  const [groupId] = useState(() => initialGroupId || crypto.randomUUID());
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { mutateAsync: createBooking, isPending } = useCreateBooking();
  const [isMainClientFound, setIsMainClientFound] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<BookingOutput>();

  const { lookupTraveler } = useTravelerLookup();

  const methods = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    mode: "onTouched",
    defaultValues: {
      token,
      mainClient: {
        fullName: "",
        whatsappPhone: "",
        email: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        medicalNotes: "",
        birthDate: "",
      },
      hasCompanions: false,
      companionMethod: "MANUAL",
      groupId,
      companions: [],
    },
  });

  const handleFieldBlur = async (value: string) => {
    if (!value || value.trim().length < 3 || isMainClientFound) return;

    setIsLookingUp(true);
    const traveler = await lookupTraveler(value);
    setIsLookingUp(false);

    if (traveler) {
      methods.setValue("mainClient.fullName", traveler.fullName, { shouldValidate: true });
      methods.setValue("mainClient.whatsappPhone", traveler.whatsappPhone, {
        shouldValidate: true,
      });
      methods.setValue("mainClient.email", traveler.email, { shouldValidate: true });
      methods.setValue("mainClient.emergencyContactName", traveler.emergencyContactName, {
        shouldValidate: true,
      });
      methods.setValue("mainClient.emergencyContactPhone", traveler.emergencyContactPhone, {
        shouldValidate: true,
      });
      methods.setValue("mainClient.medicalNotes", traveler.medicalNotes || "", {
        shouldValidate: true,
      });

      setIsMainClientFound(true);

      toast.success("¡Cliente registrado encontrado!", {
        description: "Tus datos personales se han cargado y bloqueado por seguridad.",
      });
    }
  };

  const onSubmit = async (data: BookingFormValues) => {
    const payload = {
      ...data,
      companions: data.companionMethod === "SHARE_LINK" ? [] : data.companions,
    };

    try {
      const data = await createBooking(payload);
      setPaymentDetails(data);
      setIsSuccess(true);
    } catch (error) {
      // El hook ya dispara un toast de error, pero el catch es necesario
      // si la promesa explota, para evitar que la app se rompa silenciosamente.
      console.error("Fallo en la mutación:", error);
    }

    console.log("Enviando a Node.js:", payload);
  };

  const { onBlur: rhfPhoneOnBlur, ...rhfPhoneRest } = methods.register("mainClient.whatsappPhone");
  const { onBlur: rhfEmailOnBlur, ...rhfEmailRest } = methods.register("mainClient.email");
  console.log("!methods.formState.isValid", methods.formState.isValid);
  const { errors } = methods.formState;
  console.log(methods.formState.errors);

  if (isSuccess && paymentDetails) {
    console.log("paymentDetails", paymentDetails);
    return (
      <div className="animate-in zoom-in-95 mx-auto max-w-2xl space-y-6 duration-300">
        {/* Cabecera de Éxito */}
        <div className="space-y-4 rounded-2xl border bg-white px-6 py-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">
              ¡Tus lugares están pre-reservados! ⏳
            </h2>
            <p className="font-medium text-slate-500">
              Hemos apartado tu cupo por 24 horas. Completa tu pago para asegurar tu lugar
              definitivamente.
            </p>
          </div>
        </div>

        {/* Módulo de Pagos */}
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b bg-slate-50 p-6">
            <h3 className="text-lg font-bold text-slate-900">Completa tu pago</h3>
            <p className="mt-1 text-sm text-slate-500">
              Elige el método de pago que prefieras para confirmar definitivamente tu viaje.
            </p>
          </div>

          <div className="space-y-6 p-6">
            {/* Opción 1: Link de Pago (La más fácil para el usuario) */}
            {paymentDetails?.acceptsCreditCard && (
              <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-5">
                <h4 className="flex items-center gap-2 font-semibold text-indigo-900">
                  Pago con Tarjeta
                </h4>
                <p className="text-sm text-indigo-700/80">
                  Paga de forma segura a través de nuestra pasarela.
                </p>
                <Button
                  className="w-full bg-indigo-600 text-white hover:bg-indigo-700 sm:w-auto"
                  onClick={() => window.open(paymentDetails?.paymentLink || "", "_blank")}
                >
                  Pagar en Línea Ahora
                </Button>
              </div>
            )}

            {/* Opción 2: Transferencia (Requiere acción manual del usuario) */}
            {paymentDetails?.acceptsBankTransfer && (
              <div className="space-y-4 rounded-xl border p-5">
                <h4 className="font-semibold text-slate-900">Transferencia Bancaria (SPEI)</h4>

                {/* Bloque Copiable */}
                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="font-mono text-sm whitespace-pre-wrap text-slate-700">
                    {paymentDetails.bankDetails}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full border-indigo-200 font-semibold text-indigo-600 hover:bg-indigo-50 sm:w-auto"
                    onClick={() => {
                      navigator.clipboard.writeText(paymentDetails.bankDetails || "");
                      toast.success("Datos bancarios copiados al portapapeles");
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copiar CLABE y Datos
                  </Button>
                </div>

                {/* Bloque de Contacto Directo */}
                <div className="space-y-3 pt-2">
                  <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-600">
                    <strong>Importante:</strong> Tras realizar tu transferencia, envíanos la captura
                    del comprobante por WhatsApp.
                  </div>
                  <a
                    // Idealmente el teléfono viene de la BD, aquí usamos el que el PM sugirió
                    href={`https://wa.me/522281234567?text=${encodeURIComponent("Hola, acabo de realizar mi pago SPEI para mi reserva.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <Button
                      type="button"
                      className="h-11 w-full border-none bg-[#25D366] font-bold text-white hover:bg-[#1DA851]"
                    >
                      {/* Ícono nativo de WhatsApp vectorizado */}
                      <svg viewBox="0 0 24 24" className="mr-2 h-5 w-5 fill-current">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                      </svg>
                      Enviar comprobante por WhatsApp
                    </Button>
                  </a>
                </div>
              </div>
            )}

            {/* Opción 3: Efectivo */}
            {paymentDetails?.acceptsCash && (
              <div className="space-y-2 rounded-xl border p-5">
                <h4 className="font-semibold text-slate-900">Pago en Efectivo</h4>
                <p className="text-sm text-slate-600">{paymentDetails?.cashInstructions}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="mx-auto max-w-2xl space-y-8">
        <div className="relative space-y-4 rounded-xl border bg-white p-6 shadow-sm">
          {isLookingUp && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/50 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          )}

          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-xl font-bold text-slate-900">Tus Datos</h2>
            {isMainClientFound && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md border bg-amber-50 px-2.5 py-1 text-xs text-amber-800">
                  <Lock className="h-3.5 w-3.5 text-amber-600" /> Verificado
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsMainClientFound(false);
                    methods.resetField("mainClient.whatsappPhone");
                    // ... resetear otros campos
                  }}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label>Teléfono de WhatsApp *</Label>
            <Input
              {...rhfPhoneRest}
              disabled={isMainClientFound}
              onBlur={async (e) => {
                rhfPhoneOnBlur(e);
                await handleFieldBlur(e.target.value);
              }}
              placeholder="Ej. 228 123 4567"
              className={isMainClientFound ? "cursor-not-allowed bg-slate-100" : ""}
            />
            {errors.mainClient?.whatsappPhone && (
              <p className="mt-1 text-xs text-red-500">{errors.mainClient.whatsappPhone.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Nombre Completo *</Label>
              <Input
                {...methods.register("mainClient.fullName")}
                disabled={isMainClientFound}
                className={isMainClientFound ? "cursor-not-allowed bg-slate-100" : ""}
              />
              {errors.mainClient?.fullName && (
                <p className="mt-1 text-xs text-red-500">{errors.mainClient.fullName.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Correo Electrónico *</Label>
              <Input
                {...rhfEmailRest}
                type="email"
                disabled={isMainClientFound}
                onBlur={async (e) => {
                  rhfEmailOnBlur(e);
                  await handleFieldBlur(e.target.value);
                }}
                className={isMainClientFound ? "cursor-not-allowed bg-slate-100" : ""}
              />
              {errors.mainClient?.email && (
                <p className="mt-1 text-xs text-red-500">{errors.mainClient.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 border-t pt-2 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Contacto de Emergencia (Nombre) *</Label>
              <Input
                {...methods.register("mainClient.emergencyContactName")}
                placeholder="Familiar o tutor"
              />
              {errors.mainClient?.emergencyContactName && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.mainClient.emergencyContactName.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Teléfono de Emergencia *</Label>
              <Input
                {...methods.register("mainClient.emergencyContactPhone")}
                placeholder="228 999 ..."
              />
              {errors.mainClient?.emergencyContactPhone && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.mainClient.emergencyContactPhone.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1 pt-2">
            <Label>Notas Médicas / Alergias (Opcional)</Label>
            <Input
              {...methods.register("mainClient.medicalNotes")}
              placeholder="Ej. Asma, lesión en rodilla..."
            />
          </div>

          {/* 1. UI para el Cumpleaños */}
          <div className="space-y-1.5 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 md:col-span-2">
            <Label className="text-xs font-semibold text-indigo-900">
              Fecha de nacimiento (Opcional - ¡Tenemos sorpresas! 🎂)
            </Label>
            <Input type="date" {...methods.register("mainClient.birthDate")} className="bg-white" />
          </div>

          {/* 2. UI para el Punto de Abordaje */}
          {/* NOTA: boardingPointsOptions vendría de la configuración del Tour (Data Fetching previo) */}
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-semibold text-slate-600">
              ¿En qué punto subirás al autobús? *
            </Label>
            <select
              {...methods.register("mainClient.boardingPoint")}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">Selecciona una opción...</option>
              {boardingPoints.map((point) => (
                <option key={point.id} value={`${point.location} (${point.time})`}>
                  {point.location} - {point.time}
                </option>
              ))}
            </select>
            {errors.mainClient?.boardingPoint && (
              <p className="mt-1 text-xs text-red-500">{errors.mainClient.boardingPoint.message}</p>
            )}
          </div>
        </div>

        <CompanionsManager token={token} groupId={groupId} boardingPoints={boardingPoints} />

        <Button
          disabled={!methods.formState.isValid || isPending}
          type="submit"
          className="h-12 w-full bg-indigo-600 text-base font-bold text-white shadow-sm hover:bg-indigo-700"
          size="lg"
        >
          {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
          Completar Registro
        </Button>
      </form>
    </FormProvider>
  );
}
