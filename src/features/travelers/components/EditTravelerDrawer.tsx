"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, UserCheck, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  travelerSchema,
  type TravelerInput,
  type TravelerOutput,
} from "../schemas/traveler.schema";
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

  const onSubmit = async (travelerData: TravelerInput) => {
    if (!traveler?.id) return;

    await updateTraveler({ travelerId: traveler.id, travelerUpdated: travelerData });
    onClose();
  };

  if (!isOpen || !traveler) return null;

  return (
    <div
      className="animate-in fade-in fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-sm duration-200"
      onClick={onClose}
    >
      <div
        className="animate-in slide-in-from-right flex h-full w-full max-w-md flex-col bg-white shadow-2xl duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del Drawer */}
        <div className="flex items-center justify-between border-b bg-slate-50 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Modificar Viajero</h2>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Formulario scrolleable */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 space-y-5 overflow-y-auto p-6">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Nombre Completo *</Label>
            <Input {...register("fullName")} />
            {errors.fullName && (
              <p className="text-destructive text-xs">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">WhatsApp Principal *</Label>
            <Input {...register("whatsappPhone")} />
            {errors.whatsappPhone && (
              <p className="text-destructive text-xs">{errors.whatsappPhone.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Correo Electrónico *</Label>
            <Input {...register("email")} type="email" />
            {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
          </div>

          <hr className="my-2 border-slate-100" />

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Contacto de Emergencia *</Label>
            <Input {...register("emergencyContactName")} />
            {errors.emergencyContactName && (
              <p className="text-destructive text-xs">{errors.emergencyContactName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Teléfono de Emergencia *</Label>
            <Input {...register("emergencyContactPhone")} />
            {errors.emergencyContactPhone && (
              <p className="text-destructive text-xs">{errors.emergencyContactPhone.message}</p>
            )}
          </div>

          <hr className="my-2 border-slate-100" />

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1 text-xs font-semibold text-slate-600">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600" /> Notas Médicas / Alergias
            </Label>
            <textarea
              {...register("medicalNotes")}
              rows={3}
              className="w-full rounded-md border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Ej. Alérgico a penicilina, asma leve..."
            />
            {errors.medicalNotes && (
              <p className="text-destructive text-xs">{errors.medicalNotes.message}</p>
            )}
          </div>

          {/* Footer de Acciones dentro del Drawer */}
          <div className="flex flex-col gap-3 pt-4">
            <Button type="button" variant="outline" className="w-full" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
