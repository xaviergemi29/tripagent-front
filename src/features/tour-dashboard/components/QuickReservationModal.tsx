"use client";

import { ChangeEvent, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { type QuickBookingFormValues, quickBookingSchema } from "../schemas/quick-booking.schema";
import { useTravelerLookup } from "@/features/travelers/hooks/useTravelers";
import { useQuickReservation } from "@/features/external-registration/hooks/useBookings";

interface Props {
  tourId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickReservationModal({ tourId, isOpen, onClose }: Props) {
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isTravelerFound, setIsTravelerFound] = useState(false);
  const { mutate, isPending } = useQuickReservation(tourId);
  const { lookupTraveler } = useTravelerLookup();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors, isValid },
  } = useForm<QuickBookingFormValues>({
    resolver: zodResolver(quickBookingSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      whatsapp: "",
      email: "",
      numberPassengers: 1,
    },
  });

  if (!isOpen) return null;

  const onSubmit = (data: QuickBookingFormValues): void => {
    mutate(data, {
      onSuccess: (response) => {
        const url = `${window.location.origin}/register?token=${response?.token}`;
        setMagicLink(url);
      },
    });
  };

  const handleCopy = async () => {
    if (magicLink) {
      await navigator.clipboard.writeText(magicLink);
      toast.success("Enlace copiado al portapapeles");
      handleClose();
    }
  };

  const handleClose = () => {
    setMagicLink(null);
    setIsLookingUp(false);
    setIsTravelerFound(false);
    reset();
    onClose();
  };

  const handleOpenWhatsApp = (): void => {
    if (!magicLink) return;

    const { fullName, whatsapp } = getValues();
    const cleanPhone = whatsapp.replace(/\D/g, "");
    // Formatear código de país para México (52) si viene a 10 dígitos
    const formattedPhone = cleanPhone.length === 10 ? `52${cleanPhone}` : cleanPhone;

    const message = `¡Hola ${fullName}! Apartamos tus lugares para el tour. Completa tu registro y datos aquí: ${magicLink}`;
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

    window.open(waUrl, "_blank", "noopener,noreferrer");
    handleClose();
  };

  const {
    onBlur: rhfWhatsappBlur,
    onChange: rhfWhatsappChange,
    ...whatsappRest
  } = register("whatsapp");

  const handleWhatsappBlur = async (e: React.FocusEvent<HTMLInputElement>): Promise<void> => {
    rhfWhatsappBlur(e);
    const phone = e.target.value.trim();

    if (!phone || phone.length < 10) return;

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

  const handleWhatsappChange = (e: ChangeEvent<HTMLInputElement>): void => {
    let value = e.target.value.replace(/\s+/g, "");
    if (value.startsWith("+52")) {
      value = value.slice(3);
    } else if (value.startsWith("52") && value.length === 12) {
      value = value.slice(2);
    }
    e.target.value = value;
    rhfWhatsappChange(e);
  };

  const handleResetTraveler = (): void => {
    setIsTravelerFound(false);
    setValue("whatsapp", "");
    setValue("fullName", "");
    setValue("email", "");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="animate-in zoom-in-95 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-5">
          <h3 className="text-lg font-bold text-slate-900">Apartar Lugares (Rápido)</h3>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={isPending}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {!magicLink ? (
          <form onSubmit={handleSubmit(onSubmit)}>
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
                <Input
                  {...whatsappRest}
                  onBlur={handleWhatsappBlur}
                  onChange={handleWhatsappChange}
                  placeholder="2281234567"
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
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
                <svg viewBox="0 0 24 24" className="mr-2 h-5 w-5 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
                Enviar directo a WhatsApp
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleCopy}
                className="w-full border-slate-200 font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Copy className="mr-2 h-4 w-4 text-slate-500" /> Copiar Enlace y Cerrar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
