"use client";

import { UserPlus, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { TitularRowOutput } from "../schemas/tour-dashboard.schema";
import { formatCurrency } from "@/shared/utils/currency.util";
import type { Currency } from "@/shared/constants/domain.constants";

interface AddPassengerDialogProps {
  isOpen: boolean;
  titular?: TitularRowOutput;
  tourCurrency?: Currency;
  isSubmitting?: boolean;
  freeSeatsCount?: number;
  onClose: () => void;
  onConfirm: () => void;
}

export function AddPassengerDialog({
  isOpen,
  titular,
  tourCurrency = "MXN",
  isSubmitting = false,
  freeSeatsCount,
  onClose,
  onConfirm,
}: AddPassengerDialogProps) {
  if (!titular) return null;

  const formattedPrice = formatCurrency(titular.unitPrice, { currency: tourCurrency });
  const titularFirstName = titular.fullName.trim().split(" ")[0];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="w-[95vw] rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl sm:max-w-xl sm:p-8">
        <DialogHeader className="space-y-3 text-left">
          <div className="flex items-center gap-3">
            {/* Contenedor Squircle Índigo */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-indigo-100/70 bg-indigo-50 text-indigo-600">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg leading-tight font-bold text-slate-900">
                ¿Agregar un lugar a la reserva?
              </DialogTitle>
              {typeof freeSeatsCount === "number" && (
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100/80 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    {freeSeatsCount} lugares libres en el tour
                  </span>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>
        {/* Cuerpo del Modal */}
        <div className="space-y-4 py-2">
          <p className="text-sm leading-relaxed text-slate-600">
            Se apartará 1 lugar adicional en la reserva de{" "}
            <strong className="font-semibold text-slate-900">{titular.fullName}</strong>. El costo
            unitario de este tour (
            <strong className="font-semibold text-slate-900">{formattedPrice}</strong>
            {tourCurrency !== "MXN" ? ` ${tourCurrency}` : ""}) se sumará a la deuda pendiente de la
            reserva.
          </p>

          {/* Caja explicativa sobre el Magic Link */}
          <div className="flex items-start gap-3 rounded-2xl border border-indigo-100/80 bg-indigo-50/40 p-3.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
            <p className="text-xs leading-relaxed text-slate-600">
              El enlace que ya le compartiste a{" "}
              <strong className="font-medium text-slate-800">{titularFirstName}</strong> por
              WhatsApp se actualizará automáticamente para que puedan llenar los datos de esta
              persona.
            </p>
          </div>
        </div>
        {/* Acciones */}
        <DialogFooter className="flex flex-col-reverse gap-2.5 pt-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-11 rounded-xl border-slate-200 px-5 text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isSubmitting || (typeof freeSeatsCount === "number" && freeSeatsCount <= 0)}
            className="h-11 rounded-xl bg-indigo-600 px-5 font-medium text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98]"
          >
            {isSubmitting ? "Sumando lugar..." : `Confirmar y sumar lugar (+ ${formattedPrice})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
