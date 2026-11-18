"use client";

import { useForm, FormProvider, useWatch, Controller } from "react-hook-form";
import { getTodayInMexico } from "@/shared/utils/tour-date.util";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Edit2 } from "lucide-react";
import { useState } from "react";

import {
  bookingFormSchema,
  toPublicRegisterInput,
  type BookingInput,
} from "../schemas/booking.schema";
import { CompanionsManager } from "./CompanionsManager";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCreateBooking } from "../hooks/useBookings";

import { PublicBookingLayout } from "@/components/layout/public/PublicBookingLayout";
import { TourSummaryCard } from "./TourSummaryCard";
import { PickupPointSelector } from "./PickupPointSelector";
import { RegistrationFooter } from "./RegistrationFooter";
import { PoliciesCheckbox } from "./PoliciesCheckbox";
import { PoliciesConsentModal } from "./PoliciesConsentModal";
import { usePublicTravelerLookup } from "../hooks/usePublicTravelerLookup";
import { useRouter } from "next/navigation";
import type { Currency } from "@/shared/constants/domain.constants";
import { PhoneField } from "@/components/shared/PhoneField";
import { SavedMedicalNotesHint } from "./SavedMedicalNotesHint";
import {
  getStoredPhoneCountry,
  parseStoredPhone,
  toE164,
  type PhoneCountry,
} from "@/shared/utils/phone.util";

interface TourRegistrationViewProps {
  token: string;
  boardingPoints: { id: string; location: string; time: string }[];
  tourInfo: {
    title: string;
    departureDateTime: string;
    /** Moneda del tour (la envía la API en PENDING_REGISTRATION). */
    currency?: Currency;
    reservedSeats?: number;
    priceTotalPerPassenger?: number;
    depositPerPassenger?: number | null;
  };
  agencyName: string;
  /** Enlace al aviso de privacidad de la agencia (null si no lo ha capturado). */
  agencyPrivacyNoticeUrl?: string | null;
  /** Políticas generales de la agencia (texto plano; null si no las ha capturado). */
  agencyPolicies?: string | null;
  /** Logotipo de la agencia (`meta.agency.logoPath` del Magic Link). */
  agencyLogoPath?: string | null;
  /** WhatsApp de la agencia (`meta.agency.phone`), para el pie común. */
  agencyPhone?: string | null;
  prefillData?: {
    fullName?: string;
    whatsappPhone?: string;
    /** País del WhatsApp guardado (`null` = lada sin confirmar). */
    whatsappCountry?: string | null;
    email?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactCountry?: string | null;
    medicalNotes?: string;
    birthDate?: string;
    boardingPoint?: string;
  } | null;
}

export function TourRegistrationView({
  token,
  boardingPoints,
  tourInfo,
  agencyName,
  agencyPrivacyNoticeUrl,
  agencyPolicies,
  agencyLogoPath,
  agencyPhone,
  prefillData,
}: TourRegistrationViewProps) {
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isPoliciesModalOpen, setIsPoliciesModalOpen] = useState(false);
  const { mutateAsync: createBooking, isPending } = useCreateBooking();
  const [isMainClientFound, setIsMainClientFound] = useState(
    !!(prefillData?.whatsappPhone && prefillData?.fullName),
  );
  // Solo se bloquean los datos que llegaron guardados (prellenado o búsqueda por WhatsApp). Con el
  // valor actual del formulario, una fecha recién escrita (aunque fuera inválida) quedaba bloqueada
  // y un correo vacío quedaba deshabilitado: el registro nunca se podía completar.
  const [savedFields, setSavedFields] = useState({
    email: Boolean(prefillData?.email),
    birthDate: Boolean(prefillData?.birthDate),
  });
  const isEmailLocked = isMainClientFound && savedFields.email;
  const isBirthDateLocked = isMainClientFound && savedFields.birthDate;
  const router = useRouter();
  const { lookupTraveler } = usePublicTravelerLookup(token);
  // País inicial: el del teléfono de la agencia (México si no tiene); el de emergencia sigue al del
  // titular. Los teléfonos precargados (E.164 o 10 dígitos anteriores) se separan en país + número.
  const prefillWhatsapp = parseStoredPhone(
    prefillData?.whatsappPhone,
    prefillData?.whatsappCountry,
    getStoredPhoneCountry(agencyPhone),
  );
  const prefillEmergency = parseStoredPhone(
    prefillData?.emergencyContactPhone,
    prefillData?.emergencyContactCountry,
    prefillWhatsapp.country,
  );

  const methods = useForm<BookingInput>({
    resolver: zodResolver(bookingFormSchema),
    mode: "onChange",
    defaultValues: {
      token,
      mainClient: {
        fullName: prefillData?.fullName || "",
        whatsappPhone: prefillWhatsapp.nationalNumber,
        whatsappCountry: prefillWhatsapp.country,
        email: prefillData?.email || "",
        emergencyContactName: prefillData?.emergencyContactName || "",
        emergencyContactPhone: prefillEmergency.nationalNumber,
        emergencyContactCountry: prefillEmergency.country,
        medicalNotes: prefillData?.medicalNotes || "",
        birthDate: prefillData?.birthDate || "",
        boardingPoint: prefillData?.boardingPoint || "",
      },
      hasCompanions: false,
      companionMethod: "MANUAL",
      companions: [],
      privacyNoticeAccepted: false,
    },
  });

  const handlePhoneBlur = async (phoneValue: string): Promise<void> => {
    const phone = toE164(phoneValue, methods.getValues("mainClient.whatsappCountry"));
    if (!phone || isMainClientFound) return;

    setIsLookingUp(true);
    try {
      const traveler = await lookupTraveler(phone);
      if (traveler) {
        methods.setValue("mainClient.fullName", traveler.fullName, { shouldValidate: true });
        methods.setValue("mainClient.email", traveler.email || "", { shouldValidate: true });
        // La búsqueda pública no devuelve notas médicas ni contactos de emergencia (datos sensibles):
        // el viajero los captura en el formulario.
        methods.setValue("mainClient.birthDate", traveler.birthDate || "", {
          shouldValidate: true,
        });
        setSavedFields({ email: Boolean(traveler.email), birthDate: Boolean(traveler.birthDate) });
        setIsMainClientFound(true);
      }
    } catch (error) {
      // 🛡️ IMPORTANTE: Capturamos el error aquí para evitar que un 401/500
      // de la API de búsqueda dispare un interceptor global que te mande al login.
      console.warn("No se encontró viajero previo o la API no respondió:", error);
    } finally {
      setIsLookingUp(false);
    }
  };

  /** "Aceptar y continuar" del modal: marca la casilla obligatoria y cierra el modal. */
  const handleAcceptPolicies = (): void => {
    methods.setValue("privacyNoticeAccepted", true, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    setIsPoliciesModalOpen(false);
  };

  const onSubmit = async (formData: BookingInput): Promise<void> => {
    try {
      // Los teléfonos viajan en E.164 con su país.
      await createBooking(toPublicRegisterInput(formData));
      router.refresh();
    } catch (error) {
      console.error("Error procesando registro:", error);
    }
  };

  const whatsappCountry = useWatch({
    control: methods.control,
    name: "mainClient.whatsappCountry",
  });
  const emergencyCountry = useWatch({
    control: methods.control,
    name: "mainClient.emergencyContactCountry",
  });

  /** Cambia el país del WhatsApp; si el teléfono de emergencia sigue vacío, toma el mismo país. */
  const handleWhatsappCountryChange = (country: PhoneCountry): void => {
    methods.setValue("mainClient.whatsappCountry", country, { shouldDirty: true });
    if (!methods.getValues("mainClient.emergencyContactPhone")) {
      methods.setValue("mainClient.emergencyContactCountry", country, { shouldDirty: true });
    }
    void methods.trigger("mainClient.whatsappPhone");
  };

  const watchedCompanions = useWatch({ control: methods.control, name: "companions" }) || [];
  const hasCompanions = useWatch({ control: methods.control, name: "hasCompanions" });
  const currentPassengersCount = 1 + (hasCompanions ? watchedCompanions.length : 0);
  const lockedSeats = tourInfo.reservedSeats || currentPassengersCount;
  const maxAllowedCompanions = tourInfo.reservedSeats ? tourInfo.reservedSeats - 1 : undefined;

  const mappedPoints = boardingPoints.map((point) => ({
    id: `${point.location} (${point.time})`,
    name: point.location,
    reference: "Punto de abordaje",
    time: point.time,
  }));

  return (
    // pb-40: espacio para la barra fija de "Completar Registro" (RegistrationFooter).
    <PublicBookingLayout
      className="pb-40"
      headerProps={{
        agencyName,
        agencyLogoPath,
        statusBadgeText: "Registro de viajeros",
        statusVariant: "brand",
        tourTitle: tourInfo.title,
        departureDate: tourInfo.departureDateTime,
      }}
      footerProps={{
        agencyName,
        agencyWhatsApp: agencyPhone,
        whatsappMessage: `Hola, tengo dudas con el registro de mi reservación para "${tourInfo.title}".`,
      }}
    >
      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate={true}
          suppressHydrationWarning
        >
          {/* 2. Resumen del Tour con Finanzas */}
          <TourSummaryCard
            tour={{
              priceTotalPerPassenger: tourInfo.priceTotalPerPassenger || 0,
              depositPerPassenger: tourInfo.depositPerPassenger,
              currency: tourInfo.currency,
            }}
            lockedSeatsCount={lockedSeats}
          />

          <div className="relative space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
            {isLookingUp && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            )}
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900">Datos del Titular</h2>
              {isMainClientFound && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMainClientFound(false)}
                  className="h-8 gap-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Cambiar / Editar
                </Button>
              )}
            </div>
            {isMainClientFound && (
              // Decisión del PM (2026-11-14): para un viajero que ya existía, la agencia conserva los
              // datos registrados y solo se completan los campos que le falten.
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                Ya tienes datos registrados con {agencyName}: se conservarán y solo se completarán
                los que falten. Para corregirlos, contacta a la agencia.
              </p>
            )}
            <div className="space-y-1">
              <Label
                htmlFor="titular-mainclient-whatsappphone"
                className="text-xs font-semibold text-slate-700"
              >
                Teléfono de WhatsApp *
              </Label>
              <PhoneField
                autoComplete="tel-national"
                id="titular-mainclient-whatsappphone"
                registration={methods.register("mainClient.whatsappPhone")}
                country={whatsappCountry}
                onCountryChange={handleWhatsappCountryChange}
                onBlur={handlePhoneBlur}
                placeholder="Ej. 2281234567"
                aria-label="Teléfono de WhatsApp"
                invalid={Boolean(methods.formState.errors.mainClient?.whatsappPhone)}
                disabled={isMainClientFound}
                inputClassName={`h-11 text-base transition-colors sm:text-sm ${
                  isMainClientFound
                    ? "cursor-not-allowed border-slate-200 bg-slate-100/80 font-semibold text-slate-700"
                    : "border-slate-300 bg-white text-slate-900 focus:border-indigo-600"
                }`}
              />
              {methods.formState.errors.mainClient?.whatsappPhone && (
                <p className="text-xs text-red-500">
                  {methods.formState.errors.mainClient.whatsappPhone.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label
                  htmlFor="titular-mainclient-fullname"
                  className="text-xs font-semibold text-slate-700"
                >
                  Nombre Completo *
                </Label>
                <Input
                  id="titular-mainclient-fullname"
                  autoComplete="name"
                  {...methods.register("mainClient.fullName")}
                  placeholder="Nombre y Apellidos"
                  className={`h-11 text-base transition-colors sm:text-sm ${
                    isMainClientFound
                      ? "cursor-not-allowed border-slate-200 bg-slate-100/80 font-semibold text-slate-700"
                      : "bg-white"
                  }`}
                />
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="titular-mainclient-email"
                  className="text-xs font-semibold text-slate-700"
                >
                  Correo Electrónico *
                </Label>
                <Input
                  id="titular-mainclient-email"
                  autoComplete="email"
                  {...methods.register("mainClient.email")}
                  type="email"
                  placeholder="correo@ejemplo.com"
                  disabled={isEmailLocked}
                  className={`h-11 text-base transition-colors sm:text-sm ${
                    isEmailLocked
                      ? "cursor-not-allowed border-slate-200 bg-slate-100/80 font-semibold text-slate-700"
                      : "bg-white"
                  }`}
                />
              </div>
            </div>

            {/* Fecha de Nacimiento y Notas Médicas del Titular */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label
                  htmlFor="titular-mainclient-birthdate"
                  className="text-xs font-semibold text-slate-700"
                >
                  Fecha de Nacimiento *
                </Label>
                <Input
                  id="titular-mainclient-birthdate"
                  autoComplete="bday"
                  suppressHydrationWarning
                  {...methods.register("mainClient.birthDate")}
                  type="date"
                  max={getTodayInMexico()}
                  disabled={isBirthDateLocked}
                  className={`w-max-full h-11 appearance-none text-base transition-colors sm:text-sm ${
                    isBirthDateLocked
                      ? "cursor-not-allowed border-slate-200 bg-slate-100/80 font-semibold text-slate-700"
                      : "bg-white"
                  }`}
                />
                {methods.formState.errors.mainClient?.birthDate && (
                  <p className="text-xs text-red-500">
                    {methods.formState.errors.mainClient.birthDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="titular-mainclient-medicalnotes"
                  className="text-xs font-semibold text-slate-700"
                >
                  Notas Médicas (Opcional)
                </Label>
                <Input
                  id="titular-mainclient-medicalnotes"
                  {...methods.register("mainClient.medicalNotes")}
                  placeholder="Ej. Alergias, condiciones especiales..."
                  // Sigue editable con el viajero encontrado (antes se veía gris como si estuviera
                  // bloqueado): las notas no llegan de la búsqueda y aquí se pueden completar.
                  aria-describedby={
                    isMainClientFound ? "titular-mainclient-medicalnotes-hint" : undefined
                  }
                  className="h-11 bg-white text-base sm:text-sm"
                />
                {isMainClientFound && (
                  <SavedMedicalNotesHint
                    id="titular-mainclient-medicalnotes-hint"
                    agencyName={agencyName}
                  />
                )}
              </div>
            </div>
            {/* 3. Selector de Abordaje para el Titular (Refactorizado con Controller) */}
            <div className="pt-2">
              <Controller
                control={methods.control}
                name="mainClient.boardingPoint"
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
            <div className="grid grid-cols-1 gap-3 border-t pt-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label
                  htmlFor="titular-mainclient-emergencycontactnam"
                  className="text-xs font-semibold text-slate-700"
                >
                  Contacto de Emergencia *
                </Label>
                <Input
                  id="titular-mainclient-emergencycontactnam"
                  {...methods.register("mainClient.emergencyContactName")}
                  placeholder="Nombre del familiar"
                  className="h-11 text-base sm:text-sm"
                />
                {methods.formState.errors.mainClient?.emergencyContactName && (
                  <p className="text-xs text-red-500">
                    {methods.formState.errors.mainClient.emergencyContactName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="titular-mainclient-emergencycontactpho"
                  className="text-xs font-semibold text-slate-700"
                >
                  Teléfono de Emergencia *
                </Label>
                <PhoneField
                  id="titular-mainclient-emergencycontactpho"
                  registration={methods.register("mainClient.emergencyContactPhone")}
                  country={emergencyCountry}
                  onCountryChange={(country) => {
                    methods.setValue("mainClient.emergencyContactCountry", country, {
                      shouldDirty: true,
                    });
                    void methods.trigger("mainClient.emergencyContactPhone");
                  }}
                  placeholder="Teléfono"
                  aria-label="Teléfono de Emergencia"
                  invalid={Boolean(methods.formState.errors.mainClient?.emergencyContactPhone)}
                  inputClassName="h-11 text-base sm:text-sm"
                />
                {methods.formState.errors.mainClient?.emergencyContactPhone && (
                  <p className="text-xs text-red-500">
                    {methods.formState.errors.mainClient.emergencyContactPhone.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <CompanionsManager
            boardingPoints={boardingPoints}
            maxAllowedCompanions={maxAllowedCompanions}
            agencyName={agencyName}
          />

          {/* Políticas y aviso de privacidad (LFPDPPP): casilla obligatoria (regla 19). El modal
              muestra las políticas de la agencia; "Aceptar y continuar" marca la casilla. */}
          <Controller
            name="privacyNoticeAccepted"
            control={methods.control}
            render={({ field, fieldState }) => (
              <PoliciesCheckbox
                checked={field.value === true}
                onChange={(checked) => {
                  field.onChange(checked);
                  field.onBlur();
                }}
                onOpenModal={() => setIsPoliciesModalOpen(true)}
                agencyName={agencyName}
                errorMessage={fieldState.error?.message}
              />
            )}
          />

          {/* 5. Sticky Footer (Se encarga de ejecutar el submit del form) */}
          <RegistrationFooter
            totalAmount={lockedSeats * (tourInfo.priceTotalPerPassenger || 0)}
            currency={tourInfo.currency}
            travelersCount={lockedSeats}
            isSubmitting={isPending}
            disabled={!methods.formState.isValid}
            onSubmit={methods.handleSubmit(onSubmit)}
          />
        </form>
      </FormProvider>

      <PoliciesConsentModal
        isOpen={isPoliciesModalOpen}
        onClose={() => setIsPoliciesModalOpen(false)}
        onAccept={handleAcceptPolicies}
        policiesText={agencyPolicies}
        privacyNoticeUrl={agencyPrivacyNoticeUrl}
        agencyName={agencyName}
      />
    </PublicBookingLayout>
  );
}
