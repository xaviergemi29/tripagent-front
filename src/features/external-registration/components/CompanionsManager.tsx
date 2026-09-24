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
  boardingPoints: { id: string; location: string; time: string }[];
}

export function CompanionsManager({ boardingPoints }: CompanionsManagerProps) {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<BookingFormValues>();
  const { lookupTraveler } = useTravelerLookup();

  const [lockedCompanions, setLockedCompanions] = useState<Record<number, boolean>>({});
  const [sameEmergencyContact, setSameEmergencyContact] = useState<Record<number, boolean>>({});
  const [sameBoardingPoint, setSameBoardingPoint] = useState<Record<number, boolean>>({});

  const hasCompanions = useWatch({ control, name: "hasCompanions", defaultValue: false });
  const mainBoardingPoint = useWatch({ control, name: "mainClient.boardingPoint" });
  const mainEmergencyName = useWatch({ control, name: "mainClient.emergencyContactName" });
  const mainEmergencyPhone = useWatch({ control, name: "mainClient.emergencyContactPhone" });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "companions",
  });

  const watchedCompanions = useWatch({ control, name: "companions" }) || [];

  // Búsqueda inteligente cuando el teléfono de acompañante es VÁLIDO (10 dígitos)
  const handleCompanionPhoneBlur = async (index: number, phoneValue: string) => {
    const cleanPhone = phoneValue.trim();
    if (!cleanPhone || cleanPhone.length !== 10 || lockedCompanions[index]) return;

    const traveler = await lookupTraveler(cleanPhone);

    if (traveler) {
      setValue(`companions.${index}.fullName`, traveler.fullName, { shouldValidate: true });
      setValue(`companions.${index}.email`, traveler.email || "", { shouldValidate: true });
      setValue(`companions.${index}.medicalNotes`, traveler.medicalNotes || "", {
        shouldValidate: true,
      });

      setLockedCompanions((prev) => ({ ...prev, [index]: true }));
      toast.success(`Acompañante ${index + 1} encontrado`, {
        description: "Se cargaron sus datos históricos.",
      });
    }
  };

  const handleAddCompanion = () => {
    const defaultBp = mainBoardingPoint || "";
    const defaultEmName = mainEmergencyName || "";
    const defaultEmPhone = mainEmergencyPhone || "";

    const newIndex = fields.length;

    append({
      fullName: "",
      whatsappPhone: "",
      email: "",
      emergencyContactName: defaultEmName,
      emergencyContactPhone: defaultEmPhone,
      medicalNotes: "",
      passengerType: "ADULT",
      boardingPoint: defaultBp,
    });

    // 🚀 UX: Por defecto copiamos punto de abordaje y contacto de emergencia del titular
    setSameEmergencyContact((prev) => ({ ...prev, [newIndex]: true }));
    setSameBoardingPoint((prev) => ({ ...prev, [newIndex]: true }));
  };

  return (
    <div className="space-y-6 rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
      <div className="space-y-4">
        <div className="space-y-1">
          <Label className="text-base font-bold text-slate-900">¿Cómo viajas esta vez?</Label>
          <p className="text-xs text-slate-500">
            Registra a las personas que te acompañan en este grupo.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() =>
              setValue("hasCompanions", false, { shouldValidate: true, shouldDirty: true })
            }
            className={`flex min-h-[72px] flex-col items-center justify-center rounded-xl border-2 p-4 transition-all ${
              !hasCompanions
                ? "border-indigo-600 bg-indigo-50/60 font-bold text-indigo-700 shadow-sm"
                : "border-slate-200 bg-white font-medium text-slate-600 hover:bg-slate-50"
            }`}
          >
            <User
              className={`mb-1 h-5 w-5 ${!hasCompanions ? "text-indigo-600" : "text-slate-400"}`}
            />
            <span className="text-xs sm:text-sm">Viajo solo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setValue("hasCompanions", true, { shouldValidate: true, shouldDirty: true });
              if (fields.length === 0) handleAddCompanion();
            }}
            className={`flex min-h-[72px] flex-col items-center justify-center rounded-xl border-2 p-4 transition-all ${
              hasCompanions
                ? "border-indigo-600 bg-indigo-50/60 font-bold text-indigo-700 shadow-sm"
                : "border-slate-200 bg-white font-medium text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Users
              className={`mb-1 h-5 w-5 ${hasCompanions ? "text-indigo-600" : "text-slate-400"}`}
            />
            <span className="text-xs sm:text-sm">Viajo acompañado</span>
          </button>
        </div>
      </div>

      {hasCompanions && (
        <div className="space-y-6 border-t pt-6">
          {fields.map((field, index) => {
            const isLocked = !!lockedCompanions[index];
            const isSameEmergency = !!sameEmergencyContact[index];
            const isSameBp = !!sameBoardingPoint[index];
            const currentCompanion = watchedCompanions[index] || field;
            const passengerType = currentCompanion.passengerType || "ADULT";

            return (
              <div
                key={field.id}
                className="relative space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm sm:p-5"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black tracking-wider text-slate-700 uppercase">
                      Acompañante {index + 1}
                    </span>
                    {isLocked && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                        <Lock className="h-3 w-3 text-amber-600" /> Verificado
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Selección Adulto / Niño */}
                <div className="flex items-center justify-between rounded-lg border bg-white p-3">
                  <span className="text-xs font-semibold text-slate-700">Tipo de pasajero:</span>
                  <RadioGroup
                    value={passengerType}
                    onValueChange={(val: "ADULT" | "CHILD") => {
                      setValue(`companions.${index}.passengerType`, val, { shouldValidate: true });
                      if (val === "CHILD") {
                        // 🚀 Limpiamos los campos opcionales para evitar ruido visual y errores de validación
                        setValue(`companions.${index}.whatsappPhone`, "");
                        setValue(`companions.${index}.email`, "");
                      }
                    }}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-1.5">
                      <RadioGroupItem value="ADULT" id={`adult-${index}`} />
                      <Label
                        htmlFor={`adult-${index}`}
                        className="cursor-pointer text-xs font-medium"
                      >
                        Adulto
                      </Label>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <RadioGroupItem value="CHILD" id={`child-${index}`} />
                      <Label
                        htmlFor={`child-${index}`}
                        className="cursor-pointer text-xs font-medium"
                      >
                        Niño
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Nombre Completo */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Nombre Completo *</Label>
                  <Input
                    {...register(`companions.${index}.fullName`)}
                    disabled={isLocked}
                    placeholder="Ej. Lizeth Colorado"
                    className="h-11 bg-white text-base sm:text-sm" // 🚀 44px de alto táctil
                  />
                  {errors.companions?.[index]?.fullName && (
                    <p className="text-xs text-red-500">
                      {errors.companions[index]?.fullName?.message}
                    </p>
                  )}
                </div>

                {/* Punto de abordaje con Checkbox por defecto */}
                <div className="space-y-2 rounded-lg border bg-white p-3">
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={isSameBp}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSameBoardingPoint((prev) => ({ ...prev, [index]: checked }));
                        if (checked) {
                          setValue(`companions.${index}.boardingPoint`, mainBoardingPoint || "", {
                            shouldValidate: true,
                          });
                        }
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Mismo punto de abordaje que el titular
                  </label>

                  {!isSameBp && (
                    <select
                      {...register(`companions.${index}.boardingPoint`)}
                      className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Selecciona punto de abordaje...</option>
                      {boardingPoints.map((point) => (
                        <option key={point.id} value={`${point.location} (${point.time})`}>
                          {point.location} - {point.time}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* WhatsApp y Email (Ocultos automáticamente si es NIÑO) */}
                {passengerType === "ADULT" && (
                  <div className="animate-in fade-in grid grid-cols-1 gap-3 duration-200 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-600">
                        WhatsApp (Opcional)
                      </Label>
                      <Input
                        {...register(`companions.${index}.whatsappPhone`)}
                        type="tel"
                        inputMode="numeric"
                        placeholder="10 dígitos"
                        className="h-11 bg-white text-base sm:text-sm"
                        onBlur={(e) => handleCompanionPhoneBlur(index, e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-600">
                        Email (Opcional)
                      </Label>
                      <Input
                        {...register(`companions.${index}.email`)}
                        type="email"
                        placeholder="correo@ejemplo.com"
                        className="h-11 bg-white text-base sm:text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Contacto de emergencia con Checkbox por defecto */}
                <div className="space-y-2 rounded-lg border bg-white p-3">
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={isSameEmergency}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSameEmergencyContact((prev) => ({ ...prev, [index]: checked }));
                        if (checked) {
                          setValue(
                            `companions.${index}.emergencyContactName`,
                            mainEmergencyName || "",
                            { shouldValidate: true },
                          );
                          setValue(
                            `companions.${index}.emergencyContactPhone`,
                            mainEmergencyPhone || "",
                            { shouldValidate: true },
                          );
                        }
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Usar el mismo contacto de emergencia que el titular
                  </label>

                  {!isSameEmergency && (
                    <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                      <Input
                        {...register(`companions.${index}.emergencyContactName`)}
                        placeholder="Nombre del familiar"
                        className="h-11 bg-white text-base sm:text-sm"
                      />
                      <Input
                        {...register(`companions.${index}.emergencyContactPhone`)}
                        type="tel"
                        inputMode="numeric"
                        placeholder="Teléfono 10 dígitos"
                        className="h-11 bg-white text-base sm:text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            onClick={handleAddCompanion}
            className="w-full border-2 border-dashed border-indigo-200 bg-indigo-50/50 py-5 font-semibold text-indigo-600 hover:bg-indigo-50"
          >
            <Plus className="mr-2 h-4 w-4" /> Añadir otro acompañante
          </Button>
        </div>
      )}
    </div>
  );
}
