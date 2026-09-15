"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { type QuickBookingFormValues, quickBookingSchema } from "../schemas/QuickBookingSchema";
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

  const onSubmit = (data: QuickBookingFormValues) => {
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

  const { onBlur: rhfWhatsappBlur, ...whatsappRest } = register("whatsapp");

  const handleWhatsappBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    rhfWhatsappBlur(e);
    const phone = e.target.value;

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

  const handleResetTraveler = () => {
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
                  placeholder="228 123 4567"
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
                className="bg-indigo-600 text-white hover:bg-indigo-700"
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
            {/* 🇲🇽 COPY ACTUALIZADO Y SIN ERRORES TIPOGRÁFICOS */}
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900">¡Lugares bloqueados! 🚌</h4>
              <p className="text-sm text-slate-500">
                Copia este enlace y envíaselo al titular por WhatsApp. El enlace caducará en 24
                horas.
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                readOnly
                value={magicLink}
                className="bg-slate-50 font-mono text-xs text-slate-600 focus-visible:ring-0"
              />
            </div>

            <Button
              onClick={handleCopy}
              className="w-full bg-indigo-600 font-bold text-white hover:bg-indigo-700"
            >
              <Copy className="mr-2 h-4 w-4" /> Copiar Enlace y Cerrar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
