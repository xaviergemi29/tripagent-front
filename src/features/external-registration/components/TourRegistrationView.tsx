"use client";

import { useForm, FormProvider, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Edit2 } from "lucide-react";
import { useState } from "react";

import { bookingFormSchema, type BookingInput } from "../schemas/booking.schema";
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
    email?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
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
  const router = useRouter();
  const { lookupTraveler } = usePublicTravelerLookup(token);

  const methods = useForm<BookingInput>({
    resolver: zodResolver(bookingFormSchema),
    mode: "onChange",
    defaultValues: {
      token,
      mainClient: {
        fullName: prefillData?.fullName || "",
        whatsappPhone: prefillData?.whatsappPhone || "",
        email: prefillData?.email || "",
        emergencyContactName: prefillData?.emergencyContactName || "",
        emergencyContactPhone: prefillData?.emergencyContactPhone || "",
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
    const cleanPhone = phoneValue.replace(/\D/g, "").trim();
    if (cleanPhone.length !== 10 || isMainClientFound) return;

    setIsLookingUp(true);
    try {
      const traveler = await lookupTraveler(cleanPhone);
      if (traveler) {
        methods.setValue("mainClient.fullName", traveler.fullName, { shouldValidate: true });
        methods.setValue("mainClient.email", traveler.email || "", { shouldValidate: true });
        // La búsqueda pública no devuelve notas médicas ni contactos de emergencia (datos sensibles):
        // el viajero los captura en el formulario.
        methods.setValue("mainClient.birthDate", traveler.birthDate || "", {
          shouldValidate: true,
        });
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
      await createBooking(formData);
      router.refresh();
    } catch (error) {
      console.error("Error procesando registro:", error);
    }
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
              <Label className="text-xs font-semibold text-slate-700">Teléfono de WhatsApp *</Label>
              <Input
                {...methods.register("mainClient.whatsappPhone", {
                  onBlur: (e) => handlePhoneBlur(e.target.value),
                })}
                type="tel"
                inputMode="numeric"
                placeholder="Ej. 2281234567"
                disabled={isMainClientFound}
                className={`h-11 text-base transition-colors sm:text-sm ${
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
                <Label className="text-xs font-semibold text-slate-700">Nombre Completo *</Label>
                <Input
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
                <Label className="text-xs font-semibold text-slate-700">Correo Electrónico *</Label>
                <Input
                  {...methods.register("mainClient.email")}
                  type="email"
                  placeholder="correo@ejemplo.com"
                  disabled={isMainClientFound}
                  className={`h-11 text-base transition-colors sm:text-sm ${
                    isMainClientFound
                      ? "cursor-not-allowed border-slate-200 bg-slate-100/80 font-semibold text-slate-700"
                      : "bg-white"
                  }`}
                />
              </div>
            </div>

            {/* Fecha de Nacimiento y Notas Médicas del Titular */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Fecha de Nacimiento</Label>
                <Input
                  suppressHydrationWarning
                  {...methods.register("mainClient.birthDate")} // O "companions.${index}.birthDate"
                  type="date"
                  disabled={isMainClientFound && methods.getValues("mainClient.birthDate") != ""}
                  className={`w-max-full h-11 appearance-none text-base transition-colors sm:text-sm ${
                    isMainClientFound
                      ? "cursor-not-allowed border-slate-200 bg-slate-100/80 font-semibold text-slate-700"
                      : "bg-white"
                  }`}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  Notas Médicas (Opcional)
                </Label>
                <Input
                  {...methods.register("mainClient.medicalNotes")}
                  placeholder="Ej. Alergias, condiciones especiales..."
                  className={`h-11 text-base transition-colors sm:text-sm ${
                    isMainClientFound
                      ? "cursor-not-allowed border-slate-200 bg-slate-100/80 font-semibold text-slate-700"
                      : "bg-white"
                  }`}
                />
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
                <Label className="text-xs font-semibold text-slate-700">
                  Contacto de Emergencia *
                </Label>
                <Input
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
                <Label className="text-xs font-semibold text-slate-700">
                  Teléfono de Emergencia *
                </Label>
                <Input
                  {...methods.register("mainClient.emergencyContactPhone")}
                  type="tel"
                  inputMode="numeric"
                  placeholder="Teléfono 10 dígitos"
                  className="h-11 text-base sm:text-sm"
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
