"use client";

import type { TravelerGroupActions } from "@/features/tour-dashboard/hooks/useTravelerGroupActions";
import type { Currency } from "@/shared/constants/domain.constants";
import { AddPassengerDialog } from "./AddPassengerDialog";
import { ReleaseSlotDialog } from "./ReleaseSlotDialog";
import { RemovePassengerDialog } from "./RemovePassengerDialog";
import { TransferPassengerModal } from "./TransferPassengerModal";

/**
 * Diálogos de las acciones del grupo (`useTravelerGroupActions`): agregar lugar, dar de baja,
 * liberar lugar pendiente y transferir. Los usan la tabla de escritorio y las tarjetas del celular.
 */
export function TravelerGroupDialogs({
  actions,
  tourCurrency,
  freeSeatsCount,
}: {
  actions: TravelerGroupActions;
  tourCurrency?: Currency;
  freeSeatsCount?: number;
}) {
  const { titularToGrow, passengerToRemove, slotToRelease, transferTarget } = actions;

  return (
    <>
      <AddPassengerDialog
        isOpen={!!titularToGrow}
        onClose={actions.closeAddPassenger}
        onConfirm={actions.confirmAddPassenger}
        titular={titularToGrow ?? undefined}
        tourCurrency={tourCurrency}
        isSubmitting={actions.isAdding}
        freeSeatsCount={freeSeatsCount}
      />

      <ReleaseSlotDialog
        isOpen={!!slotToRelease}
        onClose={actions.closeReleaseSlot}
        titularName={slotToRelease?.titularName || ""}
        onConfirm={actions.confirmReleaseSlot}
      />

      <RemovePassengerDialog
        isOpen={!!passengerToRemove}
        onClose={actions.closeRemovePassenger}
        onConfirm={actions.confirmRemovePassenger}
        passengerName={passengerToRemove?.name}
        isSubmitting={actions.isRemoving}
      />

      {transferTarget && (
        <TransferPassengerModal
          key={`${transferTarget.bookingId}-${transferTarget.passengerId}`}
          open
          onOpenChange={(open) => {
            if (!open) actions.closeTransfer();
          }}
          bookingId={transferTarget.bookingId}
          passengerId={transferTarget.passengerId}
          role={transferTarget.role}
          currentName={transferTarget.currentName}
          currentWhatsapp={transferTarget.currentWhatsapp}
        />
      )}
    </>
  );
}
