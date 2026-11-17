"use client";

import { useForm, useFormState, useWatch } from "react-hook-form";
import { getPassengerTypeAgeHint, getTodayInMexico } from "@/shared/utils/tour-date.util";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, ShieldAlert, Calendar, CalendarOff, AlertTriangle, User, Baby } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { parseDateOnly } from "@/shared/utils/tour-date.util";
import { useUpdateTraveler } from "../hooks/useTravelers";
import { editTravelerSchema, type EditTravelerFormInput } from "../schemas/traveler.schema";
import type { TravelerInput, TravelerOutput } from "../schemas/traveler.schema";
import { PASSENGER_TYPE } from "@/shared/constants/domain.constants";
import { PhoneField } from "@/components/shared/PhoneField";
import { getPhoneCountryLabel, parseStoredPhone, toE164 } from "@/shared/utils/phone.util";

interface ExtendedTraveler extends TravelerOutput {
  nextTourName?: string | null;
  nextTourDate?: string | null;
  totalTrips?: number;
}

interface EditTravelerDrawerProps {
  traveler: ExtendedTraveler | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditTravelerDrawer({ traveler, isOpen, onClose }: EditTravelerDrawerProps) {
  const { mutateAsync: updateTraveler, isPending } = useUpdateTraveler();
  // Teléfonos guardados (E.164 o 10 dígitos anteriores) → país + número nacional. Un registro sin
  // país tiene la lada inferida (México): se pide confirmarla al guardar.
  const storedWhatsapp = parseStoredPhone(traveler?.whatsappPhone, traveler?.whatsappCountry);
  const storedEmergency = parseStoredPhone(
    traveler?.emergencyContactPhone,
    traveler?.emergencyContactCountry,
    storedWhatsapp.country,
  );

  const { register, handleSubmit, setValue, trigger, control, reset } =
    useForm<EditTravelerFormInput>({
      resolver: zodResolver(editTravelerSchema),
      defaultValues: {
        passengerType: PASSENGER_TYPE.ADULT,
        whatsappCountry: storedWhatsapp.country,
        emergencyContactCountry: storedEmergency.country,
      },
      values: traveler
        ? {
            passengerType: PASSENGER_TYPE.ADULT,
            whatsappPhone: storedWhatsapp.nationalNumber,
            whatsappCountry: storedWhatsapp.country,
            email: traveler.email || "",
            fullName: traveler.fullName,
            emergencyContactName: traveler.emergencyContactName,
            emergencyContactPhone: storedEmergency.nationalNumber,
            emergencyContactCountry: storedEmergency.country,
            medicalNotes: traveler.medicalNotes || "",
            birthDate: traveler.birthDate || "",
          }
        : undefined,
    });

  const { errors } = useFormState({ control });
  const watchPassengerType = useWatch({ control, name: "passengerType" });
  const watchBirthDate = useWatch({ control, name: "birthDate" });
  const ageHint = getPassengerTypeAgeHint(watchPassengerType, watchBirthDate);
  const whatsappCountry = useWatch({ control, name: "whatsappCountry" });
  const emergencyContactCountry = useWatch({ control, name: "emergencyContactCountry" });

  const handleClose = (): void => {
    reset();
    onClose();
  };

  const onSubmit = async (formData: EditTravelerFormInput) => {
    if (!traveler?.id) return;

    // 1. Payload campo por campo (strings vacíos a undefined); `passengerType` es solo del
    //    formulario y no se envía.
    //    Los teléfonos viajan en E.164 con su país (así se confirma la lada de un registro anterior).
    const whatsappPhone = toE164(formData.whatsappPhone, formData.whatsappCountry) ?? undefined;
    const payload: Partial<TravelerInput> = {
      fullName: formData.fullName,
      birthDate: formData.birthDate,
      whatsappPhone,
      ...(whatsappPhone && { whatsappCountry: formData.whatsappCountry }),
      email: formData.email || undefined,
      emergencyContactName: formData.emergencyContactName,
      emergencyContactPhone:
        toE164(formData.emergencyContactPhone, formData.emergencyContactCountry) ??
        formData.emergencyContactPhone,
      emergencyContactCountry: formData.emergencyContactCountry,
      medicalNotes: formData.medicalNotes || undefined,
    };

    // 2. Ejecutamos la mutación con el key correcto: 'travelerData'. Si la API rechaza (p. ej. 409
    //    por WhatsApp duplicado), `useUpdateTraveler` ya muestra el aviso: el drawer sigue abierto
    //    con lo capturado y el error no queda sin manejar (antes Next mostraba su pantalla roja).
    try {
      await updateTraveler({
        travelerId: traveler.id,
        travelerData: payload as TravelerInput,
      });
    } catch {
      return;
    }
    handleClose();
  };

  if (!isOpen || !traveler) return null;

  const initials = traveler.fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Sheet open onOpenChange={(open) => !open && handleClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        aria-describedby={undefined}
        className="gap-0 bg-white p-0 shadow-2xl data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        {/* Header del Drawer */}
        <div className="flex flex-col gap-4 border-b bg-slate-50 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-base leading-none font-bold text-slate-900">
                    {traveler.fullName}
                  </SheetTitle>
                  {traveler.totalTrips && traveler.totalTrips > 0 && (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                      Frecuente ({traveler.totalTrips})
                    </span>
                  )}
                </div>

                <div className="mt-2">
                  {traveler.nextTourName ? (
                    <div className="inline-flex items-center gap-1.5 rounded-md border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                      <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                      <span>
                        Próximo viaje: {traveler.nextTourName} •{" "}
                        {traveler.nextTourDate
                          ? new Intl.DateTimeFormat("es-MX", { dateStyle: "short" }).format(
                              parseDateOnly(traveler.nextTourDate),
                            )
                          : ""}
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                      <CalendarOff className="h-3.5 w-3.5 text-slate-400" />
                      <span>Sin viajes programados</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Button
              aria-label="Cerrar"
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="-mt-2 -mr-2 h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Formulario scrolleable */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 space-y-5 overflow-y-auto p-6">
          {traveler.medicalNotes && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200/80 bg-amber-50/70 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div className="text-xs leading-relaxed text-amber-900">
                <span className="font-semibold text-amber-950">Nota médica registrada: </span>
                {traveler.medicalNotes}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Categoría de Viajero *</label>
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setValue("passengerType", PASSENGER_TYPE.ADULT)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-all",
                  watchPassengerType === PASSENGER_TYPE.ADULT
                    ? "border border-slate-200 bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                <User className="h-4 w-4" /> Adulto
              </button>
              <button
                type="button"
                onClick={() => setValue("passengerType", PASSENGER_TYPE.CHILD)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-all",
                  watchPassengerType === PASSENGER_TYPE.CHILD
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                <Baby className="h-4 w-4" /> Niño (Menor)
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              {watchPassengerType === PASSENGER_TYPE.CHILD
                ? "Para menores: WhatsApp opcional, correo omitido y cobertura de seguro sujeta a edad."
                : "Tarifa estándar de adulto con contacto y correo oficial obligatorio."}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="edit-traveler-fullname"
              className="text-xs font-semibold text-slate-700"
            >
              {watchPassengerType === PASSENGER_TYPE.CHILD
                ? "Nombre Completo del Menor *"
                : "Nombre Completo *"}
            </Label>
            <Input id="edit-traveler-fullname" {...register("fullName")} />
            {errors.fullName && (
              <p className="text-destructive text-xs">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="edit-traveler-birthdate"
                className="text-xs font-semibold text-slate-700"
              >
                Fecha de Nacimiento *
              </label>
              <span className="rounded border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">
                Requerido para seguro
              </span>
            </div>
            <Input
              id="edit-traveler-birthdate"
              type="date"
              max={getTodayInMexico()}
              {...register("birthDate")}
              className="appearance-none"
            />
            {errors.birthDate && (
              <p className="text-destructive text-xs">{errors.birthDate.message}</p>
            )}
            {/* Aviso, no bloquea: la edad no coincide con Adulto / Niño (2026-11-17). */}
            {ageHint && <p className="flex items-start gap-1 text-xs text-amber-700">{ageHint}</p>}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="edit-traveler-whatsappphone"
              className="text-xs font-semibold text-slate-700"
            >
              WhatsApp{" "}
              {watchPassengerType === PASSENGER_TYPE.ADULT
                ? "*"
                : "(Opcional si tiene celular en ruta)"}
            </label>
            <PhoneField
              id="edit-traveler-whatsappphone"
              registration={register("whatsappPhone")}
              country={whatsappCountry}
              onCountryChange={(country) => {
                setValue("whatsappCountry", country, { shouldDirty: true });
                void trigger("whatsappPhone");
              }}
              placeholder="Ej. 2281422143"
              aria-label="WhatsApp"
              invalid={Boolean(errors.whatsappPhone)}
            />
            {traveler.whatsappPhone && !storedWhatsapp.confirmed && (
              <p className="text-xs text-amber-700">
                Lada sin confirmar: se asumió {getPhoneCountryLabel(storedWhatsapp.country)}. Revisa
                el país y guarda para confirmarla.
              </p>
            )}
            {errors.whatsappPhone && (
              <p className="text-destructive text-xs">{errors.whatsappPhone.message}</p>
            )}
          </div>

          {watchPassengerType === PASSENGER_TYPE.ADULT ? (
            <div className="space-y-1.5">
              <Label htmlFor="edit-traveler-email" className="text-xs font-semibold text-slate-700">
                Correo Electrónico *
              </Label>
              <Input
                id="edit-traveler-email"
                {...register("email")}
                type="email"
                placeholder="correo@ejemplo.com"
              />
              {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
            </div>
          ) : (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-500">
              No aplica para menores (la cobranza y comunicación recae en el titular de la reserva).
            </div>
          )}

          <hr className="my-2 border-slate-100" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-traveler-emergencycontactname"
                className="text-xs font-semibold text-slate-700"
              >
                Contacto de Emergencia *
              </Label>
              <Input
                id="edit-traveler-emergencycontactname"
                {...register("emergencyContactName")}
              />
              {errors.emergencyContactName && (
                <p className="text-destructive text-xs">{errors.emergencyContactName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-traveler-emergencycontactphone"
                className="text-xs font-semibold text-slate-700"
              >
                Teléfono de Emergencia *
              </Label>
              <PhoneField
                id="edit-traveler-emergencycontactphone"
                registration={register("emergencyContactPhone")}
                country={emergencyContactCountry}
                onCountryChange={(country) => {
                  setValue("emergencyContactCountry", country, { shouldDirty: true });
                  void trigger("emergencyContactPhone");
                }}
                placeholder="Teléfono"
                aria-label="Teléfono de Emergencia"
                invalid={Boolean(errors.emergencyContactPhone)}
              />
              {errors.emergencyContactPhone && (
                <p className="text-destructive text-xs">{errors.emergencyContactPhone.message}</p>
              )}
            </div>
          </div>

          <hr className="my-2 border-slate-100" />

          <div className="space-y-1.5">
            <Label
              htmlFor="edit-traveler-medicalnotes"
              className="flex items-center gap-1 text-xs font-semibold text-slate-700"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-slate-400" /> Notas Médicas / Alergias
            </Label>
            <textarea
              id="edit-traveler-medicalnotes"
              {...register("medicalNotes")}
              rows={3}
              className="w-full rounded-md border border-slate-200 p-3 text-base focus:ring-2 focus:ring-indigo-500 focus:outline-none sm:text-sm"
              placeholder="Ej. Alérgico a penicilina, intolerancia a la lactosa, asma..."
            />
            {errors.medicalNotes && (
              <p className="text-destructive text-xs">{errors.medicalNotes.message}</p>
            )}
          </div>
        </form>

        {/* Footer del Drawer */}
        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="w-full text-slate-700 sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isPending}
            className="w-full bg-indigo-600 font-medium text-white shadow-xs hover:bg-indigo-700 sm:w-auto"
          >
            {isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
