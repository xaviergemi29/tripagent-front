"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, UserPlus, DollarSign } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { enrollTravelerSchema, type EnrollTravelerInput } from "../schemas/enrollTravelerSchema";
import { useCreateTraveler } from "../hooks/useTravelers";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeTours: Array<{ id: string; title: string; price: number }>;
}

export function CreateTravelerModal({ isOpen, onClose, activeTours }: Props) {
  const { mutate: createTraveler, isPending } = useCreateTraveler();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<EnrollTravelerInput>({
    resolver: zodResolver(enrollTravelerSchema),
    defaultValues: {
      paymentStatus: "PAID",
      paidAmount: 0,
      medicalNotes: "",
    },
  });

  console.log("isValid", isValid)
    console.log("errors", errors)

  // Al cambiar de tour, podemos autocompletar el costo total si lo deseamos
  const handleTourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tourId = e.target.value;
    setValue("tourId", tourId);
    const found = activeTours.find(t => t.id === tourId);
    if (found) {
      setValue("paidAmount", found.price); // Por defecto si se marca como pagado
    }
  };

  const onSubmit = (data: EnrollTravelerInput) => {
    createTraveler(data, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl animate-in zoom-in-95 duration-200 my-8">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-slate-50">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-lg text-slate-900">Inscribir Nuevo Viajero Manualmente</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          
          {/* 1. Selector de Tour (Obligatorio) */}
          <div className="space-y-2 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
            <Label className="text-sm font-bold text-indigo-950">1. Asignar a Tour Activo *</Label>
            <select
              className="w-full h-10 rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onChange={handleTourChange}
              defaultValue=""
            >
              <option value="" disabled>Selecciona una salida programada...</option>
              {activeTours.map((tour) => (
                <option key={tour.id} value={tour.id}>
                  {tour.title} (${tour.price} MXN)
                </option>
              ))}
            </select>
            {errors.tourId && <p className="text-xs text-destructive">{errors.tourId.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Datos Personales */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold text-slate-600">Nombre Completo *</Label>
              <Input {...register("fullName")} placeholder="Ej. Juan Pérez" />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">WhatsApp (Principal) *</Label>
              <Input {...register("whatsappPhone")} placeholder="+522281234567" />
              {errors.whatsappPhone && <p className="text-xs text-destructive">{errors.whatsappPhone.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Correo Electrónico *</Label>
              <Input {...register("email")} type="email" placeholder="correo@ejemplo.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            {/* Contacto de Emergencia */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Contacto de Emergencia *</Label>
              <Input {...register("emergencyContactName")} placeholder="Nombre del familiar" />
              {errors.emergencyContactName && <p className="text-xs text-destructive">{errors.emergencyContactName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Teléfono de Emergencia *</Label>
              <Input {...register("emergencyContactPhone")} placeholder="+522289990000" />
              {errors.emergencyContactPhone && <p className="text-xs text-destructive">{errors.emergencyContactPhone.message}</p>}
            </div>

            {/* Estado Financiero Inicial */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Estado de Pago Inicial *</Label>
              <select
                {...register("paymentStatus")}
                className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="PAID">🟢 Pagado / Liquidado</option>
                <option value="ADVANCE">🔵 Anticipo Recibido</option>
                <option value="PENDING">🟡 Pendiente de Pago</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Monto Recibido ($ MXN) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input {...register("paidAmount", { valueAsNumber: true })} type="number" className="pl-9" />
              </div>
              {errors.paidAmount && <p className="text-xs text-destructive">{errors.paidAmount.message}</p>}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold text-slate-600">Notas Médicas / Alergias (Opcional)</Label>
              <Input {...register("medicalNotes")} placeholder="Ej. Asma, alergia a penicilina..." />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isPending || !isValid} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isPending ? "Guardando..." : "Registrar e Inscribir"}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}