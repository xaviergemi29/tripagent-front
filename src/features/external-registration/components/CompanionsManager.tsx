"use client";

import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import { Users, User, Plus, Trash2, Lock } from "lucide-react";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { BookingFormValues } from "../schemas/booking.schema";
import { useTravelerLookup } from "@/features/travelers/hooks/useTravelers";
import { useState } from "react";

interface CompanionsManagerProps {
  token: string;
  groupId: string;
  boardingPoints: { id: string; location: string; time: string }[];
}

export function CompanionsManager({ boardingPoints }: CompanionsManagerProps) {
  const {
    control,
    register,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<BookingFormValues>();
  const { lookupTraveler } = useTravelerLookup();

  const [lockedCompanions, setLockedCompanions] = useState<Record<number, boolean>>({});
  const [sameEmergencyContact, setSameEmergencyContact] = useState<Record<number, boolean>>({});

  const hasCompanions = useWatch({ control, name: "hasCompanions", defaultValue: false });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "companions",
  });

  const watchedCompanions = useWatch({ control, name: "companions" }) || [];

  const handleCompanionBlur = async (index: number, value: string) => {
    if (!value || value.trim().length < 3 || lockedCompanions[index]) return;

    const traveler = await lookupTraveler(value);

    if (traveler) {
      setValue(`companions.${index}.fullName`, traveler.fullName, { shouldValidate: true });
      setValue(`companions.${index}.whatsappPhone`, traveler.whatsappPhone, {
        shouldValidate: true,
      });
      setValue(`companions.${index}.email`, traveler.email, { shouldValidate: true });
      setValue(`companions.${index}.emergencyContactName`, traveler.emergencyContactName, {
        shouldValidate: true,
      });
      setValue(`companions.${index}.emergencyContactPhone`, traveler.emergencyContactPhone, {
        shouldValidate: true,
      });
      setValue(`companions.${index}.medicalNotes`, traveler.medicalNotes || "", {
        shouldValidate: true,
      });

      setLockedCompanions((prev) => ({ ...prev, [index]: true }));

      toast.success(`Acompañante ${index + 1} encontrado`, {
        description: "Se autocompletaron sus datos históricos.",
      });
    }
  };

  const handleRemoveCompanion = (index: number) => {
    remove(index);
    setLockedCompanions((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setSameEmergencyContact((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  // Copia los datos de contacto del cliente principal (Titular)
  const handleToggleSameEmergency = (index: number, checked: boolean) => {
    setSameEmergencyContact((prev) => ({ ...prev, [index]: checked }));
    if (checked) {
      const mainName = getValues("mainClient.emergencyContactName");
      const mainPhone = getValues("mainClient.emergencyContactPhone");
      setValue(`companions.${index}.emergencyContactName`, mainName, { shouldValidate: true });
      setValue(`companions.${index}.emergencyContactPhone`, mainPhone, { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-6 rounded-xl border bg-white p-6 shadow-sm">
      <div className="space-y-4">
        <div className="space-y-1">
          <Label className="flex items-center gap-2 text-base font-semibold">
            ¿Cómo viajas esta vez?
          </Label>
          <p className="text-sm text-slate-500">
            Selecciona si viajas solo o necesitas registrar acompañantes en tu grupo.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() =>
              setValue("hasCompanions", false, { shouldValidate: true, shouldDirty: true })
            }
            className={`flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all duration-200 ${
              !hasCompanions
                ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            <User
              className={`mb-2 h-6 w-6 ${!hasCompanions ? "text-indigo-600" : "text-slate-400"}`}
            />
            <span className="font-semibold">Viajo solo</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setValue("hasCompanions", true, { shouldValidate: true, shouldDirty: true })
            }
            className={`flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all duration-200 ${
              hasCompanions
                ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Users
              className={`mb-2 h-6 w-6 ${hasCompanions ? "text-indigo-600" : "text-slate-400"}`}
            />
            <span className="font-semibold">Viajo acompañado</span>
          </button>
        </div>
      </div>

      {hasCompanions && (
        <div className="animate-in fade-in slide-in-from-top-4 space-y-6 border-t pt-6 duration-300">
          <div className="space-y-6">
            {fields.map((field, index) => {
              const isLocked = !!lockedCompanions[index];
              const isSameEmergency = !!sameEmergencyContact[index];
              const { onBlur: phoneOnBlur, ...phoneRest } = register(
                `companions.${index}.whatsappPhone`,
              );
              const { onBlur: emailOnBlur, ...emailRest } = register(`companions.${index}.email`);
              const currentCompanion = watchedCompanions[index] || field;
              const passengerType = currentCompanion.passengerType || "ADULT";

              return (
                <div
                  key={field.id}
                  className="relative space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-bold tracking-wider text-slate-700 uppercase">
                        Acompañante {index + 1}
                      </Label>
                      {isLocked && (
                        <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                          <Lock className="h-3 w-3 text-amber-600" /> Verificado
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="hover:text-destructive h-8 w-8 text-slate-400 hover:bg-red-50"
                      onClick={() => handleRemoveCompanion(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* VOCABULARIO TURÍSTICO: Adulto vs Niño */}
                  <div className="flex items-center gap-4 rounded-lg border bg-white p-3">
                    <Label className="text-sm font-semibold text-slate-600">
                      Este pasajero es:
                    </Label>
                    <RadioGroup
                      value={passengerType}
                      onValueChange={(val: "ADULT" | "CHILD") => {
                        setValue(`companions.${index}.passengerType`, val, {
                          shouldValidate: true,
                        });
                        if (val === "CHILD") {
                          setValue(`companions.${index}.whatsappPhone`, "");
                          setValue(`companions.${index}.email`, "");
                        }
                      }}
                      disabled={isLocked}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ADULT" id={`adult-${index}`} />
                        <Label htmlFor={`adult-${index}`} className="cursor-pointer font-medium">
                          Adulto
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="CHILD" id={`child-${index}`} />
                        <Label htmlFor={`child-${index}`} className="cursor-pointer font-medium">
                          Niño
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-xs font-semibold text-slate-600">
                        Nombre Completo *
                      </Label>
                      <Input
                        {...register(`companions.${index}.fullName`)}
                        disabled={isLocked}
                        placeholder="Ej. Juan Pérez"
                        className={isLocked ? "cursor-not-allowed bg-slate-200/60" : "bg-white"}
                      />
                      {errors.companions?.[index]?.fullName && (
                        <p className="text-destructive text-xs">
                          {errors.companions[index]?.fullName?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-xs font-semibold text-slate-600">
                        ¿En qué punto subirás al autobús? *
                      </Label>
                      <select
                        {...register(`companions.${index}.boardingPoint`)}
                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="">Selecciona una opción...</option>
                        {boardingPoints.map((point) => (
                          <option key={point.id} value={`${point.location} (${point.time})`}>
                            {point.location} - {point.time}
                          </option>
                        ))}
                      </select>
                      {errors.companions?.[index]?.boardingPoint && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors.companions?.[index]?.boardingPoint.message}
                        </p>
                      )}
                    </div>

                    {passengerType === "ADULT" && (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-600">
                            WhatsApp (Opcional)
                          </Label>
                          <Input
                            {...phoneRest}
                            disabled={isLocked}
                            onBlur={async (e) => {
                              phoneOnBlur(e);
                              await handleCompanionBlur(index, e.target.value);
                            }}
                            placeholder="228 123 4567"
                            className={isLocked ? "cursor-not-allowed bg-slate-200/60" : "bg-white"}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-600">
                            Correo Electrónico (Opcional)
                          </Label>
                          <Input
                            {...emailRest}
                            type="email"
                            disabled={isLocked}
                            onBlur={async (e) => {
                              emailOnBlur(e);
                              await handleCompanionBlur(index, e.target.value);
                            }}
                            placeholder="correo@ejemplo.com"
                            className={isLocked ? "cursor-not-allowed bg-slate-200/60" : "bg-white"}
                          />
                        </div>
                      </>
                    )}

                    {/* CHECKBOX PARA CONTACTO DE EMERGENCIA IGUAL AL TITULAR */}
                    <div className="pt-1 md:col-span-2">
                      <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={isSameEmergency}
                          onChange={(e) => handleToggleSameEmergency(index, e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Usar el mismo contacto de emergencia que el titular
                      </label>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">
                        Contacto de Emergencia *
                      </Label>
                      <Input
                        {...register(`companions.${index}.emergencyContactName`)}
                        disabled={isSameEmergency}
                        placeholder="Nombre del familiar"
                        className={isSameEmergency ? "bg-slate-100" : "bg-white"}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">
                        Teléfono de Emergencia *
                      </Label>
                      <Input
                        {...register(`companions.${index}.emergencyContactPhone`)}
                        disabled={isSameEmergency}
                        placeholder="228 123 4567"
                        className={isSameEmergency ? "bg-slate-100" : "bg-white"}
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-xs font-semibold text-slate-600">
                        Notas Médicas / Alergias (Opcional)
                      </Label>
                      <Input
                        {...register(`companions.${index}.medicalNotes`)}
                        placeholder="Ej. Asma, alergia a picaduras..."
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({
                  fullName: "",
                  whatsappPhone: "",
                  email: "",
                  emergencyContactName: "",
                  emergencyContactPhone: "",
                  medicalNotes: "",
                  passengerType: "ADULT",
                  boardingPoint: "",
                })
              }
              className="w-full border-2 border-dashed py-6 text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
            >
              <Plus className="mr-2 h-5 w-5" /> Añadir Persona
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
