"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, Loader2, MessageSquare } from "lucide-react";

export interface ReleaseSlotDialogProps {
  isOpen: boolean;
  onClose: () => void;
  titularName: string;
  /** Identificador de la reserva o del acompañante/lugar a eliminar */
  slotId?: string | number;
  onConfirm: () => Promise<void> | void;
}

export function ReleaseSlotDialog({
  isOpen,
  onClose,
  titularName,
  slotId,
  onConfirm,
}: ReleaseSlotDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Error al liberar lugar:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <AlertDialogContent className="max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-xl sm:rounded-2xl">
        <AlertDialogHeader className="space-y-4">
          {/* Ícono de Alerta destacado */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600">
            <AlertTriangle className="h-7 w-7 stroke-[2]" />
          </div>
          <div className="space-y-2 text-center sm:text-center">
            <AlertDialogTitle className="text-xl font-bold tracking-tight text-slate-900">
              ¿Liberar este lugar reservado?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed font-normal text-slate-600">
              Se liberará <strong className="font-semibold text-slate-900">1 lugar</strong> del
              grupo de{" "}
              <strong className="font-semibold text-slate-900">
                {titularName || "este titular"}
              </strong>{" "}
              y se restará del saldo total de su reserva. El cupo volverá a estar disponible para la
              venta.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        {/* Nota informativa contextual sobre WhatsApp */}
        <div className="my-2 flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 text-xs text-slate-600">
          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <p className="leading-snug">
            Si el cliente desea registrar a otra persona después, indícale que te notifique por
            WhatsApp para apartar un nuevo lugar.
          </p>
        </div>

        {/* Acciones del Modal */}
        <AlertDialogFooter className="mt-4 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end sm:space-x-0">
          <AlertDialogCancel
            disabled={isSubmitting}
            onClick={onClose}
            className="h-10 w-full rounded-xl border-slate-200 px-5 font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:w-auto"
          >
            Cancelar
          </AlertDialogCancel>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 font-medium text-white shadow-sm shadow-rose-200 transition-all hover:bg-rose-700 sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Liberando...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Liberar lugar</span>
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
