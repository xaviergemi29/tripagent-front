import type { TargetRoomDeletion } from "../../schemas/lodging.schema";
import { DeleteLodgingDialog } from "./DeleteLodgingDialog";

interface DeleteRoomModalProps {
  targetRoom: TargetRoomDeletion | null;
  onClose: () => void;
  onConfirm: (target: TargetRoomDeletion) => void;
  isDeleting?: boolean;
}

/** Confirma la eliminación de una habitación; se abre mientras haya una habitación objetivo. */
export function DeleteRoomModal({
  targetRoom,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteRoomModalProps) {
  if (!targetRoom) return null;
  const count = targetRoom.assignedPassengersCount;

  return (
    <DeleteLodgingDialog
      isOpen
      onClose={onClose}
      onConfirm={() => onConfirm(targetRoom)}
      isDeleting={isDeleting}
      title={`¿Eliminar ${targetRoom.roomName}?`}
      description={
        <>
          Se eliminará la habitación y sus{" "}
          <strong className="font-semibold text-slate-900">
            {targetRoom.totalBeds} {targetRoom.totalBeds === 1 ? "lugar" : "lugares"}
          </strong>{" "}
          de la disponibilidad de este hotel.
        </>
      }
      callout={
        count > 0
          ? {
              isWarning: true,
              content: (
                <>
                  Hay{" "}
                  <strong className="font-semibold">
                    {count} {count === 1 ? "pasajero asignado" : "pasajeros asignados"}
                  </strong>{" "}
                  en este cuarto. Regresarán automáticamente a{" "}
                  <span className="font-medium">&quot;Pasajeros sin habitación&quot;</span>.
                </>
              ),
            }
          : {
              isWarning: false,
              content: "Esta habitación no tiene pasajeros asignados actualmente.",
            }
      }
      confirmLabel="Sí, eliminar habitación"
    />
  );
}
