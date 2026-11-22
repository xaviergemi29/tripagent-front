"use client";

import { useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowRight,
  CalendarX2,
  CheckCircle2,
  Info,
  Loader2,
  Lock,
  Minus,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPreBookingFormSchema, type PreBookingFormInput } from "../pre-booking.schema";
import { usePreBooking } from "../hooks/usePreBooking";
import { PhoneField } from "@/components/shared/PhoneField";
import { SimplifiedPrivacyNotice } from "@/components/shared/SimplifiedPrivacyNotice";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { DEFAULT_PHONE_COUNTRY, toE164, type PhoneCountry } from "@/shared/utils/phone.util";
import { buildWhatsAppUrl, toPhoneDigits } from "@/shared/utils/share-links.util";
import { CONFLICT_CODE } from "@/shared/constants/domain.constants";
import type { ApiError } from "@/lib/api-client";

interface PreBookingDialogProps {
  tourId: string;
  tourTitle: string;
  availableSeats: number;
  /** Teléfono de la agencia para el WhatsApp de los avisos (sin teléfono no se ofrece el botón). */
  agencyPhone?: string | null;
  /** Agencia responsable de los datos (aviso de privacidad simplificado, LFPDPPP arts. 15-16). */
  agencyName?: string;
  agencyAddress?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** País inicial del WhatsApp: el del teléfono de la agencia (México si no tiene). */
  defaultPhoneCountry?: PhoneCountry;
}

/**
 * Resultado que reemplaza al formulario: solicitud enviada, lugares agotados mientras el cliente
 * llenaba sus datos, o tour que ya no recibe solicitudes en línea (ya salió, la agencia pausó las
 * reservas o el tour dejó de publicarse).
 */
type DialogOutcome = "SUBMITTED" | "SOLD_OUT" | "CLOSED";

export function PreBookingDialog({
  tourId,
  tourTitle,
  availableSeats,
  agencyPhone = null,
  agencyName = "La agencia",
  agencyAddress = null,
  open,
  onOpenChange,
  defaultPhoneCountry = DEFAULT_PHONE_COUNTRY,
}: PreBookingDialogProps) {
  const emptyForm: PreBookingFormInput = {
    fullName: "",
    whatsapp: "",
    whatsappCountry: defaultPhoneCountry,
    numberPassengers: 1,
  };
  const [outcome, setOutcome] = useState<DialogOutcome | null>(null);
  // Lugares que la API reportó al rechazar por cupo: el folleto de fondo se refresca, pero el tope
  // del formulario baja de inmediato, sin esperar la nueva página.
  const [reportedSeats, setReportedSeats] = useState<number | null>(null);
  const seatsLeft = Math.min(availableSeats, reportedSeats ?? availableSeats);
  const { mutate, isPending, error, reset: resetMutation } = usePreBooking();

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    control,
    reset,
    formState: { errors, isValid },
  } = useForm<PreBookingFormInput>({
    resolver: zodResolver(createPreBookingFormSchema(seatsLeft)),
    mode: "onChange",
    defaultValues: emptyForm,
  });

  const numberPassengers = useWatch({ control, name: "numberPassengers" });
  const whatsappCountry = useWatch({ control, name: "whatsappCountry" });

  // Errores que se explican junto a su campo; cualquier otro (429, red, 500) va en el aviso general.
  const isAlreadyBooked = error?.code === CONFLICT_CODE.ALREADY_BOOKED;
  const isSeatsAdjusted = error?.code === CONFLICT_CODE.CAPACITY_EXCEEDED;
  const generalError = error && !isAlreadyBooked && !isSeatsAdjusted ? error : null;

  const agencyWhatsAppUrl = (message: string) =>
    toPhoneDigits(agencyPhone) ? buildWhatsAppUrl(agencyPhone, { message }) : null;

  const handleOpenChange = (nextOpen: boolean): void => {
    if (!nextOpen) {
      // Al cerrar se limpia todo para que una nueva apertura empiece de cero.
      setOutcome(null);
      setReportedSeats(null);
      resetMutation();
      reset(emptyForm);
    }
    onOpenChange(nextOpen);
  };

  const handleConflict = (apiError: ApiError): void => {
    if (apiError.status === 404 || apiError.code === CONFLICT_CODE.BOOKINGS_CLOSED) {
      setOutcome("CLOSED");
      return;
    }
    if (apiError.code === CONFLICT_CODE.CAPACITY_EXCEEDED) {
      const remaining = Math.max(0, apiError.availableSeats ?? 0);
      if (remaining === 0) {
        setOutcome("SOLD_OUT");
        return;
      }
      // Aún hay lugares, pero menos de los pedidos: se ajusta la solicitud y el cliente decide si
      // la envía de nuevo. Nombre y WhatsApp se conservan.
      setReportedSeats(remaining);
      setValue("numberPassengers", remaining, { shouldValidate: true });
    }
  };

  const onSubmit = (values: PreBookingFormInput): void => {
    // La API recibe el número completo en E.164 con su país.
    const whatsapp = toE164(values.whatsapp, values.whatsappCountry) ?? values.whatsapp;
    mutate(
      { ...values, whatsapp, tourId },
      { onSuccess: () => setOutcome("SUBMITTED"), onError: handleConflict },
    );
  };

  const changeSeats = (delta: number): void => {
    const next = Math.min(Math.max(1, (Number(numberPassengers) || 1) + delta), seatsLeft);
    setValue("numberPassengers", next, { shouldValidate: true });
  };

  // Al corregir el WhatsApp desaparece el aviso de "ya tiene una solicitud".
  const whatsappRegistration = register("whatsapp", {
    onChange: () => {
      if (isAlreadyBooked) resetMutation();
    },
  });

  const renderContent = () => {
    if (outcome === "SUBMITTED") {
      return (
        <OutcomeView
          tone="success"
          title="¡Solicitud enviada!"
          description="Nuestro equipo confirmará tus lugares por WhatsApp en breve."
          primary={
            <Button
              type="button"
              autoFocus
              onClick={() => handleOpenChange(false)}
              className="h-12 w-full rounded-2xl bg-indigo-700 text-base font-bold hover:bg-indigo-800"
            >
              Entendido
            </Button>
          }
        />
      );
    }

    if (outcome === "SOLD_OUT" || outcome === "CLOSED") {
      const isSoldOut = outcome === "SOLD_OUT";
      const whatsappUrl = agencyWhatsAppUrl(
        isSoldOut
          ? `¡Hola! Quise apartar lugar en *${tourTitle}* desde el folleto, pero se agotaron. ¿Me avisan si se libera alguno?`
          : `¡Hola! Vi el folleto de *${tourTitle}* y me gustaría apartar lugar. ¿Me pueden ayudar?`,
      );
      return (
        <OutcomeView
          tone="neutral"
          title={isSoldOut ? "Se agotaron los lugares" : "Ya no recibimos solicitudes en línea"}
          description={
            isSoldOut
              ? "Mientras llenabas tus datos se apartaron los últimos lugares de este viaje. No se registró tu solicitud."
              : "Este viaje ya no acepta solicitudes desde el folleto. No se registró tu solicitud."
          }
          hint={
            whatsappUrl
              ? isSoldOut
                ? "Escríbenos: si se libera un lugar, te avisamos."
                : "Escríbenos y te ayudamos a apartar tu lugar."
              : undefined
          }
          primary={
            whatsappUrl ? (
              <Button
                asChild
                className="h-12 w-full rounded-2xl bg-[#008069] text-base font-bold text-white hover:bg-[#006e5a]"
              >
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" autoFocus>
                  <WhatsAppIcon className="h-5 w-5" />
                  {isSoldOut ? "Pedir que me avisen" : "Escribir por WhatsApp"}
                </a>
              </Button>
            ) : null
          }
          secondary={
            <Button
              type="button"
              variant={whatsappUrl ? "ghost" : "default"}
              autoFocus={!whatsappUrl}
              onClick={() => handleOpenChange(false)}
              className="h-11 w-full rounded-2xl text-sm font-semibold"
            >
              Volver al folleto
            </Button>
          }
        />
      );
    }

    return (
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* pr-8: los nombres largos de tour hacen salto de línea sin chocar con la ✕ de cierre. */}
        <DialogHeader className="gap-0 border-b border-slate-100 px-6 pt-6 pr-14 pb-4 text-left">
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            Iniciar Reserva
          </DialogTitle>
          <DialogDescription asChild>
            <div>
              <p className="mt-0.5 text-sm leading-snug font-semibold break-words text-indigo-600">
                {tourTitle}
              </p>
              <p className="mt-0.5 text-xs font-normal text-slate-500">
                Te contactamos por WhatsApp para confirmar.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <Label htmlFor="pre-booking-name" className="text-sm font-medium text-slate-700">
              Nombre completo
            </Label>
            <Input
              id="pre-booking-name"
              autoComplete="name"
              placeholder="Tu nombre y apellido (ej. Mariana Ruiz)"
              disabled={isPending}
              aria-invalid={!!errors.fullName}
              className="h-12 rounded-xl text-base"
              {...register("fullName")}
            />
            {errors.fullName && <FieldError message={errors.fullName.message} />}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pre-booking-whatsapp" className="text-sm font-medium text-slate-700">
              WhatsApp
            </Label>
            <PhoneField
              autoComplete="tel-national"
              id="pre-booking-whatsapp"
              registration={whatsappRegistration}
              country={whatsappCountry}
              onCountryChange={(country) => {
                setValue("whatsappCountry", country, { shouldDirty: true });
                void trigger("whatsapp");
              }}
              // Los "10 dígitos" solo aplican a México; con otro país, un texto neutro (regla 21).
              placeholder={whatsappCountry === "MX" ? "10 dígitos (ej. 228 123 4567)" : "Tu número"}
              disabled={isPending}
              invalid={!!errors.whatsapp || isAlreadyBooked}
              inputClassName="h-12 rounded-xl text-base"
            />
            {errors.whatsapp ? (
              <FieldError message={errors.whatsapp.message} />
            ) : (
              isAlreadyBooked && (
                <AlreadyBookedNotice
                  whatsappUrl={agencyWhatsAppUrl(
                    `¡Hola! Ya envié una solicitud para *${tourTitle}* desde el folleto. ¿Me ayudan con mis lugares?`,
                  )}
                />
              )
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pre-booking-seats" className="text-sm font-medium text-slate-700">
              Cantidad de lugares
            </Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Quitar un lugar"
                disabled={isPending || numberPassengers <= 1}
                onClick={() => changeSeats(-1)}
                className="h-12 w-12 rounded-xl"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="pre-booking-seats"
                type="number"
                inputMode="numeric"
                min={1}
                max={seatsLeft}
                disabled={isPending}
                aria-invalid={!!errors.numberPassengers}
                className="h-12 flex-1 rounded-xl text-center text-lg font-bold"
                {...register("numberPassengers", { valueAsNumber: true })}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Agregar un lugar"
                disabled={isPending || numberPassengers >= seatsLeft}
                onClick={() => changeSeats(1)}
                className="h-12 w-12 rounded-xl"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {isSeatsAdjusted ? (
              <div
                role="status"
                className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
              >
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Mientras llenabas tus datos se apartaron algunos lugares.{" "}
                  <strong>
                    {seatsLeft === 1 ? "Queda 1 lugar" : `Quedan ${seatsLeft} lugares`}
                  </strong>
                  : ajustamos tu solicitud. Revísala y envíala de nuevo.
                </span>
              </div>
            ) : errors.numberPassengers ? (
              <FieldError message={errors.numberPassengers.message} />
            ) : (
              <p
                className={`text-xs font-medium ${seatsLeft === 1 ? "text-amber-600" : "text-slate-500"}`}
              >
                {seatsLeft === 1
                  ? "• Queda 1 lugar disponible"
                  : `• Quedan ${seatsLeft} lugares disponibles`}
              </p>
            )}
          </div>

          {generalError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{generalError.message}</span>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 px-6 py-4">
          {/* Deshabilitado hasta que nombre, WhatsApp y lugares sean válidos (mismo schema Zod). */}
          <Button
            type="submit"
            disabled={isPending || !isValid}
            className="h-auto w-full rounded-2xl bg-indigo-600 px-4 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:bg-indigo-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
              </>
            ) : (
              <>
                Enviar solicitud <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </Button>
          <SimplifiedPrivacyNotice
            responsibleName={agencyName}
            responsibleAddress={agencyAddress}
            dataCollected="tu nombre y tu WhatsApp"
            purpose="dar seguimiento a tu solicitud de reserva y la gestión logística de este viaje"
            viaTripAgent
            rightsContact="contacta a la agencia por WhatsApp"
            fullNoticeHref="/privacidad#viajeros"
            variant="card"
          />
          <p className="flex items-center justify-center gap-1.5 pt-3 pb-1 text-[11px] font-medium text-slate-400">
            <Lock className="h-3 w-3" aria-hidden="true" />
            Enlace seguro • Con tecnología TripAgent MX
          </p>
        </div>
      </form>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden rounded-3xl p-0">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}

/** Pantalla de resultado: ícono, título, explicación y acciones (reemplaza al formulario). */
function OutcomeView({
  tone,
  title,
  description,
  hint,
  primary,
  secondary,
}: {
  tone: "success" | "neutral";
  title: string;
  description: string;
  hint?: string;
  primary?: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 pt-10 pb-8 text-center">
      <div
        className={
          tone === "success"
            ? "flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100"
            : "flex h-16 w-16 items-center justify-center rounded-full bg-amber-100"
        }
      >
        {tone === "success" ? (
          <CheckCircle2 className="h-9 w-9 text-emerald-600" />
        ) : (
          <CalendarX2 className="h-8 w-8 text-amber-700" />
        )}
      </div>
      <DialogHeader className="items-center gap-2">
        <DialogTitle className="text-2xl font-black text-slate-900">{title}</DialogTitle>
        <DialogDescription className="text-base leading-relaxed text-slate-600">
          {description}
        </DialogDescription>
      </DialogHeader>
      {hint && <p className="text-sm font-medium text-slate-700">{hint}</p>}
      {(primary || secondary) && (
        <div className="mt-2 flex w-full flex-col gap-2">
          {primary}
          {secondary}
        </div>
      )}
    </div>
  );
}

/** El WhatsApp ya tiene una solicitud en este viaje: no se duplica, se canaliza a la agencia. */
function AlreadyBookedNotice({ whatsappUrl }: { whatsappUrl: string | null }) {
  return (
    <div
      role="alert"
      className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
    >
      <p className="flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Este WhatsApp ya tiene una solicitud para este viaje. La agencia te contactará para
          confirmarla; si necesitas más lugares, escríbele.
        </span>
      </p>
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-6 inline-flex items-center gap-1.5 font-semibold text-[#008069] underline-offset-2 hover:underline"
        >
          <WhatsAppIcon className="h-4 w-4" />
          Escribir a la agencia
        </a>
      )}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  return (
    <p className="flex items-center gap-1 text-xs font-medium text-red-600">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}
