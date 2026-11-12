"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  UserCheck,
  ShieldAlert,
  Calendar,
  CalendarOff,
  AlertTriangle,
  User,
  Baby,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useUpdateTraveler } from "../hooks/useTravelers";
import { editTravelerSchema, type EditTravelerFormInput } from "../schemas/traveler.schema";
import type { TravelerInput, TravelerOutput } from "../schemas/traveler.schema";

interface ExtendedTraveler extends TravelerOutput {
  nextTourName?: string | null;
  nextTourDate?: string | null;
  totalTrips?: number;
}

interface Props {
  traveler: ExtendedTraveler | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditTravelerDrawer({ traveler, isOpen, onClose }: Props) {
  const { mutateAsync: updateTraveler, isPending } = useUpdateTraveler();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditTravelerFormInput>({
    resolver: zodResolver(editTravelerSchema),
    defaultValues: { passengerType: "ADULT" },
  });

  const watchPassengerType = watch("passengerType");

  useEffect(() => {
    if (traveler) {
      reset({
        passengerType: "ADULT",
        whatsappPhone: traveler.whatsappPhone || "",
        email: traveler.email || "",
        fullName: traveler.fullName,
        emergencyContactName: traveler.emergencyContactName,
        emergencyContactPhone: traveler.emergencyContactPhone || "",
        medicalNotes: traveler.medicalNotes || "",
        birthDate: traveler.birthDate || "",
      });
    }
  }, [traveler]);

  const onSubmit = async (formData: EditTravelerFormInput) => {
    if (!traveler?.id) return;

    // 1. Destructuramos para aislar 'passengerType'
    const { passengerType, ...cleanData } = formData;

    // 2. Sanitizamos el payload (strings vacíos a undefined)
    const payload: Partial<TravelerInput> = {
      fullName: cleanData.fullName,
      birthDate: cleanData.birthDate,
      whatsappPhone: cleanData.whatsappPhone || undefined,
      email: cleanData.email || undefined,
      emergencyContactName: cleanData.emergencyContactName,
      emergencyContactPhone: cleanData.emergencyContactPhone,
      medicalNotes: cleanData.medicalNotes || undefined,
    };

    // 3. Ejecutamos la mutación con el key correcto: 'travelerData'
    await updateTraveler({
      travelerId: traveler.id,
      travelerData: payload as TravelerInput,
    });
    onClose();
  };

  if (!isOpen || !traveler) return null;

  const initials = traveler.fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="animate-in fade-in fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-sm duration-200"
      onClick={onClose}
    >
      <div
        className="animate-in slide-in-from-right flex h-full w-full max-w-md flex-col bg-white shadow-2xl duration-300"
        onClick={(e) => e.stopPropagation()}
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
                  <h2 className="text-base leading-none font-bold text-slate-900">
                    {traveler.fullName}
                  </h2>
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
                              new Date(traveler.nextTourDate),
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
            <Button variant="ghost" size="icon" onClick={onClose} className="-mt-2 -mr-2 h-8 w-8">
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
                onClick={() => setValue("passengerType", "ADULT")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-all",
                  watchPassengerType === "ADULT"
                    ? "border border-slate-200 bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                <User className="h-4 w-4" /> Adulto
              </button>
              <button
                type="button"
                onClick={() => setValue("passengerType", "CHILD")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-all",
                  watchPassengerType === "CHILD"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                <Baby className="h-4 w-4" /> Niño (Menor)
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              {watchPassengerType === "CHILD"
                ? "Para menores: WhatsApp opcional, correo omitido y cobertura de seguro sujeta a edad."
                : "Tarifa estándar de adulto con contacto y correo oficial obligatorio."}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              {watchPassengerType === "CHILD" ? "Nombre Completo del Menor *" : "Nombre Completo *"}
            </Label>
            <Input {...register("fullName")} />
            {errors.fullName && (
              <p className="text-destructive text-xs">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Fecha de Nacimiento *</label>
              <span className="rounded border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">
                Requerido para seguro
              </span>
            </div>
            <Input type="date" {...register("birthDate")} className="appearance-none" />
            {errors.birthDate && (
              <p className="text-destructive text-xs">{errors.birthDate.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              WhatsApp{" "}
              {watchPassengerType === "ADULT" ? "*" : "(Opcional si tiene celular en ruta)"}
            </label>
            <Input
              {...register("whatsappPhone")}
              placeholder="Ej. 2281422143"
              type="tel"
              inputMode="numeric"
            />
            {errors.whatsappPhone && (
              <p className="text-destructive text-xs">{errors.whatsappPhone.message}</p>
            )}
          </div>

          {watchPassengerType === "ADULT" ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Correo Electrónico *</Label>
              <Input {...register("email")} type="email" placeholder="correo@ejemplo.com" />
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
              <Label className="text-xs font-semibold text-slate-700">
                Contacto de Emergencia *
              </Label>
              <Input {...register("emergencyContactName")} />
              {errors.emergencyContactName && (
                <p className="text-destructive text-xs">{errors.emergencyContactName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Teléfono de Emergencia *
              </Label>
              <Input
                {...register("emergencyContactPhone")}
                type="tel"
                inputMode="numeric"
                placeholder="10 dígitos"
              />
              {errors.emergencyContactPhone && (
                <p className="text-destructive text-xs">{errors.emergencyContactPhone.message}</p>
              )}
            </div>
          </div>

          <hr className="my-2 border-slate-100" />

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1 text-xs font-semibold text-slate-700">
              <ShieldAlert className="h-3.5 w-3.5 text-slate-400" /> Notas Médicas / Alergias
            </Label>
            <textarea
              {...register("medicalNotes")}
              rows={3}
              className="w-full rounded-md border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
            onClick={onClose}
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
      </div>
    </div>
  );
}
