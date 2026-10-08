"use client";

import { useForm, FormProvider, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Edit2 } from "lucide-react";
import { useState } from "react";

import {
  bookingFormSchema,
  mainClientSchema,
  BookingOutput,
  type BookingFormValues,
} from "../schemas/booking.schema";
import { CompanionsManager } from "./CompanionsManager";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCreateBooking } from "../hooks/useBookings";
import { BookingSuccessView } from "./BookingSuccessView";

// Nuevos componentes UI
import { RegistrationHeader } from "./RegistrationHeader";
import { TourSummaryCard } from "./TourSummaryCard";
import { PickupPointSelector } from "./PickupPointSelector";
import { RegistrationFooter } from "./RegistrationFooter";
import { usePublicTravelerLookup } from "../hooks/usePublicTravelerLookup";
import { useRouter } from "next/navigation";

interface TourRegistrationViewProps {
  token: string;
  boardingPoints: { id: string; location: string; time: string }[];
  tourInfo: {
    title: string;
    departureDateTime: string;
    reservedSeats?: number;
    priceTotalPerPassenger?: number;
    depositPerPassenger?: number | null;
  };
  agencyName?: string;
}

export function TourRegistrationView({
  token,
  boardingPoints,
  tourInfo,
  agencyName,
}: TourRegistrationViewProps) {
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { mutateAsync: createBooking, isPending } = useCreateBooking();
  const [isMainClientFound, setIsMainClientFound] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingOutput>();
  const router = useRouter();
  const { lookupTraveler } = usePublicTravelerLookup(token);

  const methods = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    mode: "onChange",
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
        boardingPoint: "",
      },
      hasCompanions: false,
      companionMethod: "MANUAL",
      companions: [],
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
        methods.setValue("mainClient.emergencyContactName", traveler.emergencyContactName || "", {
          shouldValidate: true,
        });
        methods.setValue("mainClient.emergencyContactPhone", traveler.emergencyContactPhone || "", {
          shouldValidate: true,
        });
        methods.setValue("mainClient.medicalNotes", traveler.medicalNotes || "", {
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

  const onSubmit = async (formData: BookingFormValues): Promise<void> => {
    try {
      const result = await createBooking(formData);
      setBookingResult(result);
      setIsSuccess(true);
      router.refresh();
    } catch (error) {
      console.error("Error procesando registro:", error);
    }
  };

  const watchedCompanions = useWatch({ control: methods.control, name: "companions" }) || [];
  const hasCompanions = useWatch({ control: methods.control, name: "hasCompanions" });
  const totalRegistered = 1 + (hasCompanions ? watchedCompanions.length : 0);

  // if (isSuccess && bookingResult) {
  //   return (
  //     <BookingSuccessView
  //       booking={bookingResult}
  //       tourInfo={tourInfo}
  //       formData={methods.getValues()}
  //     />
  //   );
  // }

  // Adapter para inyectar el formato exacto que RHF y Zod esperan ("Lugar (Hora)")
  const mappedPoints = boardingPoints.map((point) => ({
    id: `${point.location} (${point.time})`,
    name: point.location,
    reference: "Punto de abordaje",
    time: point.time,
  }));

  return (
    <div className="min-h-screen bg-[#faf8ff] pb-24">
      {/* 1. Header de Agencia Pegajoso */}
      <RegistrationHeader agencyName={agencyName} />

      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit)}
          className="mx-auto max-w-xl space-y-6 px-4 pt-5"
          noValidate={true}
          suppressHydrationWarning
        >
          {/* 2. Resumen del Tour con Finanzas */}
          <TourSummaryCard
            tour={{
              name: tourInfo.title,
              departureDate: tourInfo.departureDateTime,
              priceTotalPerPassenger: tourInfo.priceTotalPerPassenger || 0,
              depositPerPassenger: tourInfo.depositPerPassenger,
            }}
            lockedSeatsCount={totalRegistered}
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
              </div>
            </div>
          </div>

          <CompanionsManager boardingPoints={boardingPoints} />

          {/* 5. Sticky Footer (Se encarga de ejecutar el submit del form) */}
          <RegistrationFooter
            totalAmount={totalRegistered * (tourInfo.priceTotalPerPassenger || 0)}
            travelersCount={totalRegistered}
            isSubmitting={isPending}
            disabled={!methods.formState.isValid}
            onSubmit={methods.handleSubmit(onSubmit)}
          />
        </form>
      </FormProvider>
    </div>
  );
}
