"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, UserCheck, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { travelerSchema, type TravelerInput, type TravelerOutput } from "../schemas/travelerSchema";
import { useUpdateTraveler } from "../hooks/useTravelers";

interface Props {
  traveler: TravelerOutput | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditTravelerDrawer({ traveler, isOpen, onClose }: Props) {
  const { mutateAsync: updateTraveler, isPending } = useUpdateTraveler();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TravelerInput>({
    resolver: zodResolver(travelerSchema),
  });

  // Sincronizamos los valores del formulario cuando el traveler cambia o se abre el drawer
  useEffect(() => {
    if (traveler) {
      reset({
        whatsappPhone: traveler.whatsappPhone,
        email: traveler.email,
        fullName: traveler.fullName,
        emergencyContactName: traveler.emergencyContactName,
        emergencyContactPhone: traveler.emergencyContactPhone,
        medicalNotes: traveler.medicalNotes || "",
      });
    }
  }, [traveler]);

  const onSubmit = async(travelerData: TravelerInput) => {
    if (!traveler?.id) return;

    await updateTraveler({ travelerId: traveler.id, travelerUpdated: travelerData });
    onClose();
  };

  if (!isOpen || !traveler) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del Drawer */}
        <div className="flex justify-between items-center p-6 border-b bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900">Modificar Viajero</h2>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        {/* Formulario scrolleable */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Nombre Completo *</Label>
            <Input {...register("fullName")} />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">WhatsApp Principal *</Label>
            <Input {...register("whatsappPhone")} />
            {errors.whatsappPhone && <p className="text-xs text-destructive">{errors.whatsappPhone.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Correo Electrónico *</Label>
            <Input {...register("email")} type="email" />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <hr className="border-slate-100 my-2" />

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Contacto de Emergencia *</Label>
            <Input {...register("emergencyContactName")} />
            {errors.emergencyContactName && <p className="text-xs text-destructive">{errors.emergencyContactName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Teléfono de Emergencia *</Label>
            <Input {...register("emergencyContactPhone")} />
            {errors.emergencyContactPhone && <p className="text-xs text-destructive">{errors.emergencyContactPhone.message}</p>}
          </div>

          <hr className="border-slate-100 my-2" />

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Notas Médicas / Alergias
            </Label>
            <textarea 
              {...register("medicalNotes")}
              rows={3}
              className="w-full rounded-md border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ej. Alérgico a penicilina, asma leve..."
            />
            {errors.medicalNotes && <p className="text-xs text-destructive">{errors.medicalNotes.message}</p>}
          </div>

          {/* Footer de Acciones dentro del Drawer */}
          <div className="pt-4 flex flex-col  gap-3">
            <Button type="button" variant="outline" className="w-full" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              {isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}