// src/features/bookings/components/QuickReservationModal.tsx
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
    const [isLookingUp, setIsLookingUp] = useState(false); // 👈 Estado visual de búsqueda
    const [isTravelerFound, setIsTravelerFound] = useState(false); // 👈 Nuevo estado
    const { mutate, isPending } = useQuickReservation(tourId);
    const { lookupTraveler } = useTravelerLookup(); // 👈 Instanciamos el buscador

    // Configuración de React Hook Form
    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors, isValid }
    } = useForm<QuickBookingFormValues>({
        resolver: zodResolver(quickBookingSchema),
        mode: "onChange",
        defaultValues: {
            fullName: "",
            whatsapp: "",
            email: "",
            numberPassengers: 1,
        }
    });

    if (!isOpen) return null;

    // El handleSubmit de RHF ya previene el default y solo se ejecuta si Zod pasa
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

    // 👈 1. Separamos el onBlur nativo de RHF del resto de las props del input
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
            toast.success("Viajero encontrado", { description: "Datos autocompletados desde el historial." });
        }

    }

    const handleResetTraveler = () => {
        setIsTravelerFound(false);
        setValue("whatsapp", "");
        setValue("fullName", "");
        setValue("email", "");
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={handleClose}>
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

                <div className="flex justify-between items-center p-5 border-b">
                    <h3 className="font-bold text-lg text-slate-900">Apartar Lugares (Rápido)</h3>
                    <Button type="button" variant="ghost" size="icon" onClick={handleClose} disabled={isPending}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {!magicLink ? (
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <Label>Nombre del Titular *</Label>
                                <Input
                                    {...register("fullName")}
                                    placeholder="Ej. Carlos Pérez"
                                    disabled={isPending || isTravelerFound} // 👈 Bloqueado
                                />
                                {errors.fullName && (
                                    <p className="text-xs text-red-500 font-medium">{errors.fullName.message}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label>WhatsApp de Contacto *</Label>
                                {isLookingUp && <span className="text-xs text-indigo-600">Buscando...</span>}
                                {isTravelerFound && (
                                    <button type="button" onClick={handleResetTraveler} className="text-xs text-indigo-600 hover:underline">
                                        Cambiar número
                                    </button>
                                )}
                                <Input
                                    {...whatsappRest}
                                    onBlur={handleWhatsappBlur} // 👈 Inyectamos nuestro interceptor
                                    placeholder="228 999 .."
                                    disabled={isPending || isTravelerFound} // 👈 Bloqueado
                                />
                                {errors.whatsapp && (
                                    <p className="text-xs text-red-500 font-medium">{errors.whatsapp.message}</p>
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
                                    <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
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
                                    <p className="text-xs text-red-500 font-medium">{errors.numberPassengers.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
                                Cancelar
                            </Button>
                            {/* Deshabilitamos si la mutación está cargando o si el formulario NO es válido */}
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isPending || !isValid}>
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Apartar y Crear Link
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="p-6 text-center space-y-6">
                        {/* ... Tu código de éxito permanece igual ... */}
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Check className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-bold text-lg text-slate-900">¡Lugares Apartados!</h4>
                            <p className="text-sm text-slate-500">¡Listo! Lugares apartados. Envíale este link al titular para que complete sus datos.. Copia el enlace y mándaselo al cliente por WhatsApp.</p>
                        </div>

                        <div className="flex gap-2">
                            <Input readOnly value={magicLink} className="bg-slate-50 text-slate-600 font-mono text-xs focus-visible:ring-0" />
                        </div>

                        <Button onClick={handleCopy} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Copy className="w-4 h-4 mr-2" /> Copiar Enlace y Cerrar
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}