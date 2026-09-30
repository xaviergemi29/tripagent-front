"use client";

import { ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RegistrationFooterProps {
  totalAmount: number;
  travelersCount: number;
  isSubmitting?: boolean;
  disabled?: boolean;
  onSubmit: () => void;
}

export function RegistrationFooter({
  totalAmount,
  travelersCount,
  isSubmitting = false,
  disabled = false,
  onSubmit,
}: RegistrationFooterProps) {
  return (
    <div className="space-y-4">
      {/* Card de Garantía de Reserva */}
      <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3">
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">Garantía de Asiento TripAgent</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              Registrado
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Tus lugares quedan asegurados de inmediato al completar el registro.
          </p>
        </div>
      </div>

      {/* Barra Inferior Fija (Sticky Footer) */}
      <div className="fixed right-0 bottom-0 left-0 z-40 border-t border-slate-200/80 bg-white/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-lg backdrop-blur-md">
        <div className="mx-auto flex max-w-md flex-col gap-1.5">
          {/* Fila de Resumen */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Resumen de registro</span>
            <span>Paso final</span>
          </div>

          <div className="flex items-center justify-between pb-1">
            <p className="text-sm font-bold text-slate-900">
              Total: ${totalAmount.toLocaleString()} MXN{" "}
              <span className="font-semibold text-emerald-600">
                ({travelersCount} {travelersCount === 1 ? "viajero" : "viajeros"})
              </span>
            </p>
          </div>

          {/* CTA Principal */}
          <Button
            type="button"
            onClick={onSubmit}
            disabled={disabled || isSubmitting}
            className="h-12 w-full rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-md hover:bg-indigo-700 disabled:bg-slate-300"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Procesando...</span>
              </div>
            ) : (
              <span>
                Completar Registro ({travelersCount} {travelersCount === 1 ? "viajero" : "viajeros"}
                ) →
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
