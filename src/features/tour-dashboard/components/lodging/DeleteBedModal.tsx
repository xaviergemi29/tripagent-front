import type { TargetBedDeletion } from "../../schemas/lodging.schema";
import { DeleteLodgingDialog } from "./DeleteLodgingDialog";

interface DeleteBedModalProps {
  targetBed: TargetBedDeletion | null;
  onClose: () => void;
  onConfirm: (target: TargetBedDeletion) => void;
  isDeleting?: boolean;
}

/** Confirma la eliminación de una cama; se abre mientras haya una cama objetivo. */
export function DeleteBedModal({
  targetBed,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteBedModalProps) {
  if (!targetBed) return null;
  const passenger = targetBed.assignedPassenger;

  return (
    <DeleteLodgingDialog
      isOpen
      onClose={onClose}
      onConfirm={() => onConfirm(targetBed)}
      isDeleting={isDeleting}
      title={`¿Eliminar ${targetBed.bedLabel}?`}
      description={
        <>
          Se eliminará este espacio de{" "}
          <strong className="font-semibold text-slate-900">{targetBed.roomName}</strong>. La
          capacidad del cuarto se reducirá en 1 lugar.
        </>
      }
      callout={
        passenger
          ? {
              isWarning: true,
              content: (
                <>
                  <strong className="font-semibold">{passenger.fullName}</strong> quedará sin cama
                  asignada y regresará automáticamente a{" "}
                  <span className="font-medium">&quot;Pasajeros sin habitación&quot;</span>.
                </>
              ),
            }
          : {
              isWarning: false,
              content: "Esta cama está libre, por lo que ningún pasajero se verá afectado.",
            }
      }
      confirmLabel="Sí, eliminar cama"
    />
  );
}
