"use client";

import { useFormContext, useFieldArray, useWatch, Controller } from "react-hook-form";
import { getPassengerTypeAgeHint, getTodayInMexico } from "@/shared/utils/tour-date.util";
import { Users, User, Plus, Trash2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { BookingInput } from "../schemas/booking.schema";
import { useEffect, useState } from "react";

import { PassengerTypeSwitch, type PassengerCategory } from "./PassengerTypeSwitch";
import { PickupPointSelector } from "./PickupPointSelector";
import { FormFieldError } from "./FormFieldError";
import { usePublicTravelerLookup } from "../hooks/usePublicTravelerLookup";
import { PASSENGER_TYPE } from "@/shared/constants/domain.constants";
import { PhoneField } from "@/components/shared/PhoneField";
import {
  DEFAULT_PHONE_COUNTRY,
  parseStoredPhone,
  toE164,
  type PhoneCountry,
} from "@/shared/utils/phone.util";

/** Campos del acompañante que copian al titular mientras su casilla está marcada. */
type CompanionSyncPath =
  | `companions.${number}.emergencyContactName`
  | `companions.${number}.emergencyContactCountry`
  | `companions.${number}.emergencyContactPhone`
  | `companions.${number}.boardingPoint`;

/** Acompañante encontrado por WhatsApp (`lookup-traveler`). */
interface FoundCompanion {
  hasEmail: boolean;
  hasBirthDate: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactCountry: PhoneCountry;
}

interface CompanionsManagerProps {
  boardingPoints: { id: string; location: string; time: string }[];
  maxAllowedCompanions?: number;
}

export function CompanionsManager({
  boardingPoints,
  maxAllowedCompanions,
}: CompanionsManagerProps) {
  const {
    control,
    register,
    setValue,
    getValues,
    trigger,
    getFieldState,
    formState: { errors },
  } = useFormContext<BookingInput>();

  // Estado por acompañante, indexado por `field.id` de useFieldArray (estable al eliminar uno; con el
  // índice, al borrar el acompañante 1 el 2 heredaba su "Verificado" y sus casillas).
  // - foundCompanions: encontrados por WhatsApp: qué campos llegaron con valor (solo esos se
  //   bloquean) y su propio contacto de emergencia, que se usa al desmarcar la casilla.
  // - ownEmergencyContact / ownBoardingPoint: casillas "igual que el titular" DESMARCADAS. Sin
  //   entrada = marcada (el valor por defecto de todo acompañante nuevo).
  const [foundCompanions, setFoundCompanions] = useState<Record<string, FoundCompanion>>({});
  const [ownEmergencyContact, setOwnEmergencyContact] = useState<Record<string, boolean>>({});
  const [ownBoardingPoint, setOwnBoardingPoint] = useState<Record<string, boolean>>({});
  const token = getValues("token");
  const { lookupTraveler } = usePublicTravelerLookup(token);
  const hasCompanions = useWatch({ control, name: "hasCompanions", defaultValue: false });
  const mainBoardingPoint = useWatch({ control, name: "mainClient.boardingPoint" });
  const mainEmergencyName = useWatch({ control, name: "mainClient.emergencyContactName" });
  const mainEmergencyPhone = useWatch({ control, name: "mainClient.emergencyContactPhone" });
  // Países iniciales del acompañante: los del titular (los grupos suelen compartir lada).
  const mainWhatsappCountry =
    useWatch({ control, name: "mainClient.whatsappCountry" }) ?? DEFAULT_PHONE_COUNTRY;
  const mainEmergencyCountry =
    useWatch({ control, name: "mainClient.emergencyContactCountry" }) ?? mainWhatsappCountry;

  const { fields, append, remove } = useFieldArray({ control, name: "companions" });
  const watchedCompanions = useWatch({ control, name: "companions" }) || [];

  // Con la casilla marcada, el acompañante sigue al titular: si el titular cambia su contacto de
  // emergencia o su punto de abordaje después de agregar acompañantes, se copian de nuevo (antes se
  // enviaba la copia del momento en que se agregó). Se valida para mantener `isValid` al día.
  useEffect(() => {
    const sync = (path: CompanionSyncPath, value: string): boolean => {
      if (getValues(path) === value) return false;
      // Copiar un contacto todavía vacío del titular no debe pintar errores en el acompañante (el
      // viajero aún no llegó a ese campo): solo se valida con valor o si ya había un error.
      setValue(path, value, { shouldValidate: value !== "" || getFieldState(path).invalid });
      return true;
    };
    fields.forEach((field, index) => {
      if (!ownEmergencyContact[field.id]) {
        sync(`companions.${index}.emergencyContactName`, mainEmergencyName || "");
        const countryChanged = sync(
          `companions.${index}.emergencyContactCountry`,
          mainEmergencyCountry,
        );
        const phoneChanged = sync(
          `companions.${index}.emergencyContactPhone`,
          mainEmergencyPhone || "",
        );
        if (countryChanged && !phoneChanged) {
          void trigger(`companions.${index}.emergencyContactPhone`);
        }
      }
      if (!ownBoardingPoint[field.id]) {
        sync(`companions.${index}.boardingPoint`, mainBoardingPoint || "");
      }
    });
  }, [
    fields,
    ownEmergencyContact,
    ownBoardingPoint,
    mainEmergencyName,
    mainEmergencyPhone,
    mainEmergencyCountry,
    mainBoardingPoint,
    getValues,
    getFieldState,
    setValue,
    trigger,
  ]);

  // Mientras el contacto del titular sea inválido, su propio error ya se ve junto a su campo: bajo la
  // casilla del acompañante solo se avisa lo propio (p. ej., que es su mismo WhatsApp).
  const mainEmergencyHasErrors = Boolean(
    errors.mainClient?.emergencyContactName || errors.mainClient?.emergencyContactPhone,
  );

  const isStrictlySingle = maxAllowedCompanions === 0;
  const canAddMore = maxAllowedCompanions === undefined || fields.length < maxAllowedCompanions;

  const handleCompanionPhoneBlur = async (
    index: number,
    fieldId: string,
    phoneValue: string,
  ): Promise<void> => {
    // El esquema compara el WhatsApp con el contacto de emergencia (puede estar oculto si se usa el
    // del titular): sin revalidarlo, el botón quedaba deshabilitado sin ningún error visible.
    void trigger(`companions.${index}.emergencyContactPhone`);
    const phone = toE164(phoneValue, getValues(`companions.${index}.whatsappCountry`));
    if (!phone || foundCompanions[fieldId]) return;

    const traveler = await lookupTraveler(phone);
    if (traveler) {
      // El correo "N/A" de un menor cuenta como vacío (regla 3).
      const email = traveler.email && traveler.email !== "N/A" ? traveler.email : "";
      const birthDate = traveler.birthDate || "";
      const emergencyPhone = parseStoredPhone(
        traveler.emergencyContactPhone,
        null,
        mainEmergencyCountry,
      );
      setValue(`companions.${index}.fullName`, traveler.fullName, { shouldValidate: true });
      setValue(`companions.${index}.email`, email, { shouldValidate: true });
      setValue(`companions.${index}.birthDate`, birthDate, { shouldValidate: true });
      setFoundCompanions((prev) => ({
        ...prev,
        [fieldId]: {
          hasEmail: email !== "",
          hasBirthDate: birthDate !== "",
          emergencyContactName: traveler.emergencyContactName || "",
          emergencyContactPhone: emergencyPhone.nationalNumber,
          emergencyContactCountry: emergencyPhone.country,
        },
      }));
      toast.success(`Acompañante ${index + 1} encontrado`, {
        description: "Se cargaron sus datos históricos.",
      });
    }
  };

  /** Cambia el país de un teléfono del acompañante y revalida su número. */
  const setCompanionCountry = (
    index: number,
    field: "whatsapp" | "emergency",
    country: PhoneCountry,
  ): void => {
    if (field === "whatsapp") {
      setValue(`companions.${index}.whatsappCountry`, country, { shouldDirty: true });
      // El esquema compara el WhatsApp con el contacto de emergencia: se revalidan los dos.
      void trigger([
        `companions.${index}.whatsappPhone`,
        `companions.${index}.emergencyContactPhone`,
      ]);
    } else {
      setValue(`companions.${index}.emergencyContactCountry`, country, { shouldDirty: true });
      void trigger(`companions.${index}.emergencyContactPhone`);
    }
  };

  const handleAddCompanion = (): void => {
    const defaultBp = mainBoardingPoint || "";
    const defaultEmName = mainEmergencyName || "";
    const defaultEmPhone = mainEmergencyPhone || "";

    append({
      fullName: "",
      whatsappPhone: "",
      whatsappCountry: mainWhatsappCountry,
      email: "",
      birthDate: "",
      emergencyContactName: defaultEmName,
      emergencyContactPhone: defaultEmPhone,
      emergencyContactCountry: mainEmergencyCountry,
      passengerType: PASSENGER_TYPE.ADULT,
      boardingPoint: defaultBp,
    });
  };

  const mappedPoints = boardingPoints.map((point) => ({
    id: `${point.location} (${point.time})`,
    name: point.location,
    reference: "Punto de abordaje",
    time: point.time,
  }));

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
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
            onClick={() => {
              setValue("hasCompanions", false, { shouldValidate: true, shouldDirty: true });
              remove();
            }}
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
            disabled={isStrictlySingle}
            onClick={() => {
              setValue("hasCompanions", true, { shouldValidate: true, shouldDirty: true });
              if (fields.length === 0) {
                append({
                  fullName: "",
                  whatsappPhone: "",
                  whatsappCountry: mainWhatsappCountry,
                  email: "",
                  birthDate: "",
                  emergencyContactName: mainEmergencyName || "",
                  emergencyContactPhone: mainEmergencyPhone || "",
                  emergencyContactCountry: mainEmergencyCountry,
                  passengerType: PASSENGER_TYPE.ADULT,
                  boardingPoint: mainBoardingPoint || "",
                });
              }
            }}
            className={`flex min-h-[72px] flex-col items-center justify-center rounded-xl border-2 p-4 transition-all ${
              hasCompanions
                ? "border-indigo-600 bg-indigo-50/60 font-bold text-indigo-700 shadow-sm"
                : isStrictlySingle
                  ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-50" // UI de bloqueo
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
            const found = foundCompanions[field.id];
            const isLocked = !!found;
            const emergencyNameError = errors.companions?.[index]?.emergencyContactName?.message;
            const emergencyPhoneError = errors.companions?.[index]?.emergencyContactPhone?.message;
            const isSameEmergency = !ownEmergencyContact[field.id];
            const isSameBp = !ownBoardingPoint[field.id];
            const currentCompanion = watchedCompanions[index] || field;
            const isAdult = currentCompanion.passengerType === PASSENGER_TYPE.ADULT;

            return (
              <div
                key={field.id}
                className="relative space-y-4 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 shadow-sm sm:p-5"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black tracking-wider text-slate-700 uppercase">
                      Acompañante {index + 1}
                    </span>
                    {isLocked && (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        <Lock className="h-3 w-3 text-emerald-600" /> Verificado
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

                {/* Categoría Adulto / Niño */}
                <Controller
                  control={control}
                  name={`companions.${index}.passengerType`}
                  render={({ field }) => (
                    <PassengerTypeSwitch
                      value={field.value as PassengerCategory}
                      onChange={(val) => {
                        field.onChange(val);
                        if (val === PASSENGER_TYPE.CHILD) {
                          setValue(`companions.${index}.email`, "", { shouldValidate: true });
                        }
                        // Las reglas dependen del tipo (WhatsApp, correo, mensaje del contacto de
                        // emergencia): un error que ya no aplica no debe quedarse pegado. Solo se
                        // revalidan los campos que ya tenían error; no se pintan errores nuevos.
                        const stale = (
                          ["whatsappPhone", "email", "emergencyContactPhone"] as const
                        ).filter((name) => getFieldState(`companions.${index}.${name}`).invalid);
                        if (stale.length > 0) {
                          void trigger(stale.map((name) => `companions.${index}.${name}` as const));
                        }
                      }}
                    />
                  )}
                />

                {/* Nombre Completo */}
                <div className="space-y-1">
                  <Label
                    htmlFor={`companion-${index}-fullname`}
                    className="text-xs font-semibold text-slate-700"
                  >
                    Nombre Completo *
                  </Label>
                  <Input
                    id={`companion-${index}-fullname`}
                    autoComplete="off"
                    {...register(`companions.${index}.fullName`)}
                    disabled={isLocked}
                    placeholder="Ej. Lizeth Colorado"
                    className="h-11 bg-white text-base sm:text-sm"
                  />
                  {errors.companions?.[index]?.fullName && (
                    <FormFieldError>{errors.companions[index]?.fullName?.message}</FormFieldError>
                  )}
                </div>

                {/* Grid Dinámico para Datos Personales */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* WhatsApp (Siempre visible. Obligatorio para Adulto, Opcional para Niño) */}
                  <div className="animate-in fade-in space-y-1 duration-200">
                    <Label
                      htmlFor={`companion-${index}-whatsappphone`}
                      className="text-xs font-semibold text-slate-600"
                    >
                      WhatsApp{" "}
                      {isAdult ? (
                        "*"
                      ) : (
                        <span className="font-normal text-slate-400">(Opcional)</span>
                      )}
                    </Label>
                    <PhoneField
                      id={`companion-${index}-whatsappphone`}
                      registration={register(`companions.${index}.whatsappPhone`, {
                        deps: [`companions.${index}.emergencyContactPhone`],
                      })}
                      country={currentCompanion.whatsappCountry ?? mainWhatsappCountry}
                      onCountryChange={(country) => setCompanionCountry(index, "whatsapp", country)}
                      placeholder="Número"
                      aria-label={`WhatsApp del acompañante ${index + 1}`}
                      invalid={Boolean(errors.companions?.[index]?.whatsappPhone)}
                      disabled={isLocked}
                      inputClassName="h-11 bg-white text-base sm:text-sm"
                      onBlur={(value) => handleCompanionPhoneBlur(index, field.id, value)}
                    />
                    {errors.companions?.[index]?.whatsappPhone && (
                      <FormFieldError>
                        {errors.companions?.[index]?.whatsappPhone?.message}
                      </FormFieldError>
                    )}
                  </div>

                  {/* Email SOLO para Adultos */}
                  {isAdult && (
                    <div className="animate-in fade-in space-y-1 duration-200">
                      <Label
                        htmlFor={`companion-${index}-email`}
                        className="text-xs font-semibold text-slate-600"
                      >
                        Correo Electrónico *
                      </Label>
                      <Input
                        id={`companion-${index}-email`}
                        autoComplete="off"
                        {...register(`companions.${index}.email`)}
                        type="email"
                        placeholder="correo@ejemplo.com"
                        disabled={!!found?.hasEmail}
                        className="h-11 bg-white text-base sm:text-sm"
                      />
                      {errors.companions?.[index]?.email && (
                        <FormFieldError>
                          {errors.companions?.[index]?.email?.message}
                        </FormFieldError>
                      )}
                    </div>
                  )}

                  {/* Fecha de Nacimiento (OBLIGATORIO PARA AMBOS) */}
                  <div className={`space-y-1 ${isAdult && "sm:col-span-2"}`}>
                    <Label
                      htmlFor={`companion-${index}-birthdate`}
                      className="text-xs font-semibold text-slate-700"
                    >
                      Fecha de Nacimiento *
                    </Label>
                    <Input
                      id={`companion-${index}-birthdate`}
                      autoComplete="off"
                      {...register(`companions.${index}.birthDate`)}
                      type="date"
                      max={getTodayInMexico()}
                      disabled={!!found?.hasBirthDate}
                      className="w-max-full h-11 appearance-none bg-white text-base sm:text-sm"
                    />
                    {errors.companions?.[index]?.birthDate && (
                      <FormFieldError>
                        {errors.companions[index]?.birthDate?.message}
                      </FormFieldError>
                    )}
                    {/* Aviso, no bloquea: la edad no coincide con Adulto / Niño (2026-11-17). */}
                    {getPassengerTypeAgeHint(
                      currentCompanion.passengerType,
                      currentCompanion.birthDate,
                    ) && (
                      <p className="flex items-start gap-1 text-xs text-amber-700">
                        {getPassengerTypeAgeHint(
                          currentCompanion.passengerType,
                          currentCompanion.birthDate,
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Punto de abordaje */}
                <div className="space-y-2 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={isSameBp}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setOwnBoardingPoint((prev) => ({ ...prev, [field.id]: !checked }));
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
                    <div className="border-t border-slate-100 pt-2">
                      <Controller
                        control={control}
                        name={`companions.${index}.boardingPoint`}
                        render={({ field, fieldState }) => (
                          <PickupPointSelector
                            points={mappedPoints}
                            value={field.value}
                            onChange={field.onChange}
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                    </div>
                  )}
                </div>

                {/* Contacto de emergencia */}
                <div className="space-y-2 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={isSameEmergency}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setOwnEmergencyContact((prev) => ({ ...prev, [field.id]: !checked }));
                        // Marcado: el contacto del titular. Desmarcado: el propio del acompañante
                        // encontrado por WhatsApp o vacío (antes quedaba el del titular).
                        const contact = checked
                          ? {
                              name: mainEmergencyName || "",
                              phone: mainEmergencyPhone || "",
                              country: mainEmergencyCountry,
                            }
                          : {
                              name: found?.emergencyContactName ?? "",
                              phone: found?.emergencyContactPhone ?? "",
                              country: found?.emergencyContactCountry ?? mainEmergencyCountry,
                            };
                        setValue(`companions.${index}.emergencyContactName`, contact.name, {
                          shouldValidate: true,
                        });
                        setValue(`companions.${index}.emergencyContactCountry`, contact.country);
                        setValue(`companions.${index}.emergencyContactPhone`, contact.phone, {
                          shouldValidate: true,
                        });
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Usar el mismo contacto de emergencia que el titular
                  </label>

                  {/* Con la casilla marcada los campos no se ven, pero pueden ser inválidos (p. ej.,
                      el titular puso de emergencia al propio acompañante): el error debe verse (si el titular ya lo capturó). */}
                  {isSameEmergency &&
                    !mainEmergencyHasErrors &&
                    // Con el contacto del titular aún vacío, el aviso correcto es el del titular.
                    Boolean(mainEmergencyName || mainEmergencyPhone) &&
                    (emergencyNameError || emergencyPhoneError) && (
                      <FormFieldError>
                        {emergencyPhoneError ?? emergencyNameError} Desmarca la casilla para
                        capturar otro contacto.
                      </FormFieldError>
                    )}

                  {!isSameEmergency && (
                    <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Input
                          {...register(`companions.${index}.emergencyContactName`)}
                          placeholder="Nombre del familiar"
                          className="h-11 bg-white text-base sm:text-sm"
                        />
                        {errors.companions?.[index]?.emergencyContactName && (
                          <FormFieldError>
                            {errors.companions?.[index]?.emergencyContactName.message}
                          </FormFieldError>
                        )}
                      </div>
                      <div className="space-y-1">
                        <PhoneField
                          registration={register(`companions.${index}.emergencyContactPhone`)}
                          country={currentCompanion.emergencyContactCountry ?? mainEmergencyCountry}
                          onCountryChange={(country) =>
                            setCompanionCountry(index, "emergency", country)
                          }
                          placeholder="Teléfono"
                          aria-label={`Teléfono de emergencia del acompañante ${index + 1}`}
                          invalid={Boolean(errors.companions?.[index]?.emergencyContactPhone)}
                          inputClassName="h-11 bg-white text-base sm:text-sm"
                        />
                        {errors.companions?.[index]?.emergencyContactPhone && (
                          <FormFieldError>
                            {errors.companions?.[index]?.emergencyContactPhone.message}
                          </FormFieldError>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {canAddMore && (
            <Button
              type="button"
              variant="outline"
              onClick={handleAddCompanion}
              className="w-full border-2 border-dashed border-indigo-200 bg-indigo-50/50 py-5 font-semibold text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50"
            >
              <Plus className="mr-2 h-4 w-4" /> Añadir otro acompañante
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
