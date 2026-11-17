"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Copy, Check, Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import {
  type QuickBookingFormInput,
  quickBookingSchema,
} from "@/features/tour-dashboard/schemas/quick-booking.schema";
import { useTravelerLookup } from "@/features/travelers/hooks/useTravelers";
import { useQuickReservation } from "@/features/tour-dashboard/hooks/useBookingActions";
import { copyToClipboard } from "@/shared/utils/clipboard";
import { buildMagicLinkUrl, buildWhatsAppUrl } from "@/shared/utils/share-links.util";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { PhoneField } from "@/components/shared/PhoneField";
import { useAgency } from "@/features/settings/hooks/useAgency";
import { getStoredPhoneCountry, toE164 } from "@/shared/utils/phone.util";

interface Props {
  tourId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickReservationModal({ tourId, isOpen, onClose }: Props) {
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isTravelerFound, setIsTravelerFound] = useState(false);
  const { mutate, isPending } = useQuickReservation();
  const { lookupTraveler } = useTravelerLookup();
  // País inicial del WhatsApp: el del teléfono de la agencia (México si no tiene).
  const { data: agency } = useAgency();
  const defaultCountry = getStoredPhoneCountry(agency?.phone, agency?.phoneCountry);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    trigger,
    reset,
    control,
    formState: { errors, isValid },
  } = useForm<QuickBookingFormInput>({
    resolver: zodResolver(quickBookingSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      whatsapp: "",
      whatsappCountry: defaultCountry,
      email: "",
      numberPassengers: 1,
    },
  });
  const whatsappCountry = useWatch({ control, name: "whatsappCountry" });

  const handleClose = (): void => {
    setMagicLink(null);
    setIsLookingUp(false);
    setIsTravelerFound(false);
    reset({
      fullName: "",
      whatsapp: "",
      whatsappCountry: defaultCountry,
      email: "",
      numberPassengers: 1,
    });
    onClose();
  };

  const onSubmit = (formData: QuickBookingFormInput): void => {
    // La API recibe el número completo en E.164 con su país.
    const payload = {
      ...formData,
      whatsapp: toE164(formData.whatsapp, formData.whatsappCountry) ?? formData.whatsapp,
      tourId,
    };
    mutate(payload, {
      onSuccess: (response) => {
        setMagicLink(buildMagicLinkUrl(response.token));
      },
    });
  };

  /** Copia el Magic Link y cierra el modal. Si no se pudo copiar, el modal sigue abierto
   * para que el operador copie el enlace a mano desde el campo. */
  const handleCopyAndClose = async (): Promise<void> => {
    if (!magicLink) return;
    const success = await copyToClipboard(magicLink);

    if (success) {
      toast.success("Enlace copiado al portapapeles");
      handleClose();
    } else {
      toast.error("Error al copiar", {
        description: "Por favor, copia el enlace manualmente.",
      });
    }
  };

  const handleOpenWhatsApp = (): void => {
    if (!magicLink) return;

    const { fullName, whatsapp, whatsappCountry: country } = getValues();
    const message = `¡Hola ${fullName}! Apartamos tus lugares para el tour. Completa tu registro y datos aquí: ${magicLink}`;
    const waUrl = buildWhatsAppUrl(toE164(whatsapp, country) ?? whatsapp, { message });

    window.open(waUrl, "_blank", "noopener,noreferrer");
    handleClose();
  };

  /** Al salir del campo busca al viajero por su número completo (E.164). */
  const handleWhatsappBlur = async (value: string): Promise<void> => {
    const phone = toE164(value, getValues("whatsappCountry"));
    if (!phone) return;

    setIsLookingUp(true);
    const traveler = await lookupTraveler(phone);
    setIsLookingUp(false);

    if (traveler) {
      setValue("fullName", traveler.fullName, { shouldValidate: true, shouldDirty: true });
      if (traveler.email) {
        setValue("email", traveler.email, { shouldValidate: true, shouldDirty: true });
      }
      setIsTravelerFound(true);
      toast.success("Viajero encontrado", {
        description: "Datos autocompletados desde el historial.",
      });
    }
  };

  const handleCountryChange = (country: QuickBookingFormInput["whatsappCountry"]): void => {
    setValue("whatsappCountry", country, { shouldDirty: true });
    void trigger("whatsapp");
  };

  const handleResetTraveler = (): void => {
    setIsTravelerFound(false);
    setValue("whatsapp", "");
    setValue("fullName", "");
    setValue("email", "");
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <AlertDialogContent className="w-full max-w-md gap-0 overflow-hidden p-0 sm:rounded-2xl">
        <AlertDialogDescription className="sr-only">
          Formulario para reservar lugares rápidamente y generar un enlace mágico de pago.
        </AlertDialogDescription>

        <AlertDialogHeader className="flex flex-row items-center justify-between space-y-0 border-b p-5">
          <AlertDialogTitle className="text-lg font-bold text-slate-900">
            Apartar Lugares (Rápido)
          </AlertDialogTitle>
          <Button
            aria-label="Cerrar"
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={isPending}
            className="h-8 w-8 text-slate-500 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </AlertDialogHeader>

        {!magicLink ? (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
            <div className="space-y-4 p-6">
              <div className="space-y-1.5">
                <Label>Nombre del Titular *</Label>
                <Input
                  {...register("fullName")}
                  placeholder="Ej. Carlos Pérez"
                  disabled={isPending || isTravelerFound}
                />
                {errors.fullName && (
                  <p className="text-xs font-medium text-red-500">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>WhatsApp de Contacto *</Label>
                {isLookingUp && <span className="text-xs text-indigo-600">Buscando...</span>}
                {isTravelerFound && (
                  <button
                    type="button"
                    onClick={handleResetTraveler}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Cambiar número
                  </button>
                )}
                <PhoneField
                  registration={register("whatsapp")}
                  country={whatsappCountry}
                  onCountryChange={handleCountryChange}
                  onBlur={handleWhatsappBlur}
                  placeholder="2281234567"
                  aria-label="WhatsApp de Contacto"
                  invalid={Boolean(errors.whatsapp)}
                  disabled={isPending || isTravelerFound}
                />
                {errors.whatsapp && (
                  <p className="text-xs font-medium text-red-500">{errors.whatsapp.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="email@gmail.com"
                  disabled={isPending}
                />
                {errors.email && (
                  <p className="text-xs font-medium text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Cantidad de Lugares a Apartar *</Label>
                <Input
                  {...register("numberPassengers", { valueAsNumber: true })}
                  type="number"
                  min="1"
                  disabled={isPending}
                />
                {errors.numberPassengers && (
                  <p className="text-xs font-medium text-red-500">
                    {errors.numberPassengers.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t bg-slate-50 p-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 font-semibold text-white hover:bg-indigo-700"
                disabled={isPending || !isValid}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Apartar y Crear Link
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 p-6 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900">¡Lugares bloqueados! 🚌</h4>
              <p className="text-sm text-slate-500">
                Envía el enlace al titular por WhatsApp o cópialo manualmente. El enlace caducará en
                24 horas.
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                readOnly
                value={magicLink}
                className="bg-slate-50 font-mono text-xs text-slate-600 focus-visible:ring-0"
              />
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <Button
                type="button"
                onClick={handleOpenWhatsApp}
                className="h-11 w-full border-none bg-[#25D366] font-bold text-white shadow-sm hover:bg-[#1DA851]"
              >
                <WhatsAppIcon className="mr-2 h-5 w-5 fill-current" />
                Enviar directo a WhatsApp
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleCopyAndClose}
                className="w-full border-slate-200 font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Copy className="mr-2 h-4 w-4 text-slate-500" /> Copiar Enlace y Cerrar
              </Button>
            </div>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
