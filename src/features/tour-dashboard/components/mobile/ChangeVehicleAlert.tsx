import { AlertTriangle } from "lucide-react";
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

interface ChangeVehicleAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  assignedSeatsCount: number;
}

export function ChangeVehicleAlert({
  isOpen,
  onClose,
  onConfirm,
  assignedSeatsCount,
}: ChangeVehicleAlertProps) {
  // Si no hay asientos asignados, confirmamos directamente (este bypass lo manejaremos en el padre, pero por seguridad lo dejamos listo)
  const isDestructive = assignedSeatsCount > 0;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="w-[90vw] max-w-sm rounded-2xl p-6">
        <AlertDialogHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <AlertDialogTitle className="text-center text-lg font-bold">
            ¿Deseas cambiar el vehículo del tour?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm text-slate-600">
            {isDestructive
              ? "Al cambiar el vehículo, los asientos asignados actualmente no se conservarán. Tendrás que asignar manualmente los asientos de los viajeros en el nuevo vehículo. ¿Deseas continuar?"
              : "Selecciona la nueva distribución para este viaje."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 flex-col gap-2 sm:flex-col">
          <AlertDialogCancel className="h-11 w-full rounded-xl border-slate-200 font-semibold text-slate-600">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={`h-11 w-full rounded-xl font-semibold text-white ${
              isDestructive
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isDestructive ? "Sí, cambiar vehículo" : "Actualizar vehículo"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
