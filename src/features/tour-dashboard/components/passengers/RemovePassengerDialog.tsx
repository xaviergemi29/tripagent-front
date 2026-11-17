import { AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Currency } from "@/shared/constants/domain.constants";
import { formatCurrency } from "@/shared/utils/currency.util";

interface RemovePassengerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  passengerName?: string;
  isSubmitting?: boolean;
  /** Lo que el grupo ya abonó (para explicar la retención). */
  paidAmount?: number;
  /**
   * Vista previa de lo que se retendrá: el excedente de lo abonado sobre el nuevo total, con tope
   * del precio de un lugar (`previewCompanionDropRetention`; la API aplica la regla).
   */
  retainedAmount?: number;
  tourCurrency?: Currency;
}

export function RemovePassengerDialog({
  isOpen,
  onClose,
  onConfirm,
  passengerName,
  isSubmitting,
  paidAmount = 0,
  retainedAmount = 0,
  tourCurrency,
}: RemovePassengerDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            ¿Dar de baja a este acompañante?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Estás a punto de cancelar el lugar de <strong>{passengerName}</strong>. Si tiene un
            asiento asignado, se liberará.{" "}
            {retainedAmount > 0
              ? "Como el grupo ya abonó más que el nuevo total, el excedente se retiene como penalización."
              : "Al total de la reserva se le descontará el precio de un lugar, sin retención; lo ya abonado no cambia."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {/* Por qué el total no baja el precio completo del lugar (decisión del usuario, 2026-11-17). */}
        {retainedAmount > 0 && (
          <p
            role="note"
            className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
          >
            El grupo ya abonó{" "}
            <strong>{formatCurrency(paidAmount, { currency: tourCurrency })}</strong>. Se retendrán{" "}
            <strong>{formatCurrency(retainedAmount, { currency: tourCurrency })}</strong> por la
            baja y la reserva queda liquidada.
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Volver</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? "Cancelando..." : "Confirmar Baja"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
