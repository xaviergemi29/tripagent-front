import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteLodgingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  title: string;
  description: ReactNode;
  /** Con pasajeros afectados el aviso es ámbar; sin ellos, informativo. */
  callout: { isWarning: boolean; content: ReactNode };
  confirmLabel: string;
}

/**
 * Base de los diálogos de eliminación de hospedaje. No usa `ConfirmDialog` porque este muestra un
 * aviso contextual según la ocupación y no debe cerrarse mientras la API elimina.
 */
export function DeleteLodgingDialog({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  title,
  description,
  callout,
  confirmLabel,
}: DeleteLodgingDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <DialogContent className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 ring-8 ring-red-50/50">
            <Trash2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">
            {title}
          </DialogTitle>
          <DialogDescription className="mt-1.5 text-sm leading-relaxed text-slate-600">
            {description}
          </DialogDescription>
        </DialogHeader>

        {callout.isWarning ? (
          <div className="mt-2 flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/90 p-3.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-amber-950">{callout.content}</p>
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50 p-3">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
            <p className="text-xs text-slate-600">{callout.content}</p>
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="h-10 rounded-xl px-4 text-sm font-medium"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="h-10 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? "Eliminando..." : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
