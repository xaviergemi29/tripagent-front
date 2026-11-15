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

interface RemovePassengerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  passengerName?: string;
  isSubmitting?: boolean;
}

export function RemovePassengerDialog({
  isOpen,
  onClose,
  onConfirm,
  passengerName,
  isSubmitting,
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
            asiento asignado, se liberará. El saldo total de la reserva se ajustará automáticamente
            (sin retención de fondos). Si necesitas aplicar una penalización manual, abre su perfil
            completo.
          </AlertDialogDescription>
        </AlertDialogHeader>
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
