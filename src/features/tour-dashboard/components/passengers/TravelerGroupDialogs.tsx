"use client";

import type { TravelerGroupActions } from "@/features/tour-dashboard/hooks/useTravelerGroupActions";
import type { TitularRowOutput } from "@/features/tour-dashboard/schemas/tour-dashboard.schema";
import { getGroupTotal } from "@/features/tour-dashboard/utils/dashboard-travelers.util";
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
  travelers = [],
}: {
  actions: TravelerGroupActions;
  tourCurrency?: Currency;
  freeSeatsCount?: number;
  /** Grupos de la lista: la baja de un acompañante muestra el desglose con los montos del grupo. */
  travelers?: TitularRowOutput[];
}) {
  const { titularToGrow, passengerToRemove, slotToRelease, transferTarget } = actions;
  const groupOfRemoved = passengerToRemove
    ? travelers.find((titular) => titular.bookingId === passengerToRemove.bookingId)
    : undefined;
  const removedCompanion = groupOfRemoved?.companions.find(
    (companion) => companion.id === passengerToRemove?.passengerId,
  );

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

      {/* `key`: cada baja empieza con la retención en $0. */}
      <RemovePassengerDialog
        key={
          passengerToRemove
            ? `${passengerToRemove.bookingId}-${passengerToRemove.passengerId}`
            : "none"
        }
        isOpen={!!passengerToRemove}
        onClose={actions.closeRemovePassenger}
        onConfirm={actions.confirmRemovePassenger}
        passengerName={passengerToRemove?.name}
        seatLabel={removedCompanion?.seatLabel ?? null}
        unitPrice={groupOfRemoved?.unitPrice}
        currentTotal={groupOfRemoved ? getGroupTotal(groupOfRemoved) : undefined}
        paidAmount={groupOfRemoved?.paidAmount}
        isSubmitting={actions.isRemoving}
        tourCurrency={tourCurrency}
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
