"use client";

import { useState, type ChangeEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2, Minus, Plus } from "lucide-react";
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

interface PreBookingDialogProps {
  tourId: string;
  tourTitle: string;
  availableSeats: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPTY_FORM: PreBookingFormInput = { fullName: "", whatsapp: "", numberPassengers: 1 };

export function PreBookingDialog({
  tourId,
  tourTitle,
  availableSeats,
  open,
  onOpenChange,
}: PreBookingDialogProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { mutate, isPending, error, reset: resetMutation } = usePreBooking();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<PreBookingFormInput>({
    resolver: zodResolver(createPreBookingFormSchema(availableSeats)),
    mode: "onChange",
    defaultValues: EMPTY_FORM,
  });

  const numberPassengers = useWatch({ control, name: "numberPassengers" });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      // Al cerrar se limpia todo para que una nueva apertura empiece de cero.
      setIsSubmitted(false);
      resetMutation();
      reset(EMPTY_FORM);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = (values: PreBookingFormInput) => {
    mutate({ ...values, tourId }, { onSuccess: () => setIsSubmitted(true) });
  };

  const changeSeats = (delta: number) => {
    const next = Math.min(Math.max(1, (Number(numberPassengers) || 1) + delta), availableSeats);
    setValue("numberPassengers", next, { shouldValidate: true });
  };

  const { onChange: rhfWhatsappChange, ...whatsappField } = register("whatsapp");
  const handleWhatsappChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Acepta "+52 228 123 4567" o "52…" y deja solo los 10 dígitos nacionales.
    let digits = e.target.value.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("52")) digits = digits.slice(2);
    e.target.value = digits.slice(0, 10);
    rhfWhatsappChange(e);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden rounded-3xl p-0">
        {isSubmitted ? (
          <div className="flex flex-col items-center gap-4 px-6 pt-10 pb-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </div>
            <DialogHeader className="items-center gap-2">
              <DialogTitle className="text-2xl font-black text-slate-900">
                ¡Solicitud enviada!
              </DialogTitle>
              <DialogDescription className="text-base leading-relaxed text-slate-600">
                Nuestro equipo confirmará tus lugares por WhatsApp en breve.
              </DialogDescription>
            </DialogHeader>
            <Button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="mt-2 h-12 w-full rounded-2xl bg-indigo-700 text-base font-bold hover:bg-indigo-800"
            >
              Entendido
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <DialogHeader className="gap-1 border-b border-slate-100 px-6 pt-6 pb-4 text-left">
              <DialogTitle className="text-xl font-black text-slate-900">
                Iniciar Reserva
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                {tourTitle} · Te contactamos por WhatsApp para confirmar.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 px-6 py-5">
              <div className="space-y-1.5">
                <Label htmlFor="pre-booking-name" className="text-sm font-semibold text-slate-700">
                  Nombre completo
                </Label>
                <Input
                  id="pre-booking-name"
                  autoComplete="name"
                  placeholder="Ej. Mariana Ruiz"
                  disabled={isPending}
                  aria-invalid={!!errors.fullName}
                  className="h-12 rounded-xl text-base"
                  {...register("fullName")}
                />
                {errors.fullName && <FieldError message={errors.fullName.message} />}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="pre-booking-whatsapp"
                  className="text-sm font-semibold text-slate-700"
                >
                  WhatsApp
                </Label>
                <Input
                  id="pre-booking-whatsapp"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="10 dígitos"
                  disabled={isPending}
                  aria-invalid={!!errors.whatsapp}
                  className="h-12 rounded-xl text-base"
                  onChange={handleWhatsappChange}
                  {...whatsappField}
                />
                {errors.whatsapp && <FieldError message={errors.whatsapp.message} />}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pre-booking-seats" className="text-sm font-semibold text-slate-700">
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
                    max={availableSeats}
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
                    disabled={isPending || numberPassengers >= availableSeats}
                    onClick={() => changeSeats(1)}
                    className="h-12 w-12 rounded-xl"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {errors.numberPassengers ? (
                  <FieldError message={errors.numberPassengers.message} />
                ) : (
                  <p className="text-xs text-slate-500">
                    {availableSeats === 1
                      ? "Queda 1 lugar disponible"
                      : `Quedan ${availableSeats} lugares disponibles`}
                  </p>
                )}
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error.message}</span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-6 py-4">
              <Button
                type="submit"
                disabled={isPending}
                className="h-12 w-full rounded-2xl bg-indigo-700 text-base font-bold hover:bg-indigo-800"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
                  </>
                ) : (
                  "Enviar solicitud"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
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
