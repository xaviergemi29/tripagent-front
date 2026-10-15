"use client";

import { AlertTriangle, Info, X, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface VoidPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmVoid: () => void | Promise<void>;
  onVoidAndRecapture: () => void | Promise<void>;
  amountFormatted: string;
  travelerName: string;
  isSubmitting?: boolean;
}

export const VoidPaymentModal: React.FC<VoidPaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirmVoid,
  onVoidAndRecapture,
  amountFormatted,
  travelerName,
  isSubmitting = false,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-rose-100/80 bg-rose-50 sm:h-9 sm:w-9">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900 sm:text-lg">
              Anular Abono
            </DialogTitle>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar modal"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        <div className="space-y-4 py-4">
          <p className="text-sm leading-snug font-semibold text-slate-800 sm:text-base">
            ¿Deseas anular este abono de{" "}
            <span className="font-bold text-rose-600">{amountFormatted}</span>?
          </p>

          <div className="flex items-start gap-2.5 rounded-xl border border-slate-200/70 bg-slate-50 p-3 sm:p-3.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
            <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
              Se descontarán{" "}
              <strong className="font-semibold text-slate-900">{amountFormatted}</strong> de los
              pagos de <strong className="font-semibold text-slate-900">{travelerName}</strong> y se
              guardará el registro del movimiento.
            </p>
          </div>
        </div>

        {/* 🚀 FIX: Eliminamos sm:flex-wrap para forzar una sola línea y alineamos con gap-3 */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={onConfirmVoid}
            className="w-full rounded-xl border-rose-200 px-4 py-2.5 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800 sm:w-auto sm:text-sm"
          >
            {isSubmitting ? "Anulando..." : "Confirmar anulación"}
          </Button>

          <Button
            type="button"
            disabled={isSubmitting}
            onClick={onVoidAndRecapture}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-[0.98] sm:w-auto sm:text-sm"
          >
            <RefreshCw className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Anular y volver a capturar</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
