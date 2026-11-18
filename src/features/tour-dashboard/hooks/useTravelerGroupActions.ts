"use client";

import { useState } from "react";
import type { TitularRowOutput } from "@/features/tour-dashboard/schemas/tour-dashboard.schema";
import {
  useAddPassengerToBooking,
  useQuickRemovePassenger,
  useRemovePendingSlot,
} from "@/features/tour-dashboard/hooks/useTourDashboard";
import { toTransferWhatsapp } from "@/features/tour-dashboard/utils/dashboard-travelers.util";
import type { PassengerRole } from "@/shared/constants/domain.constants";

export interface TransferTarget {
  bookingId: string;
  passengerId: string;
  role: PassengerRole;
  currentName: string;
  currentWhatsapp: string | null;
}

/**
 * Acciones sobre el grupo de una reserva en el Centro de Control: agregar lugar, dar de baja a un
 * acompañante, liberar un lugar pendiente y transferir un lugar. Única implementación para la
 * tabla de escritorio (`DashboardTravelerTable`) y las tarjetas del celular
 * (`MobilePassengersList`); los diálogos los dibuja `TravelerGroupDialogs`.
 */
export function useTravelerGroupActions(tourId: string) {
  const { mutate: addPassenger, isPending: isAdding } = useAddPassengerToBooking();
  const { mutate: removePassenger, isPending: isRemoving } = useQuickRemovePassenger();
  const { mutateAsync: removePendingSlot, isPending: isRemovingGhost } = useRemovePendingSlot();

  const [titularToGrow, setTitularToGrow] = useState<TitularRowOutput | null>(null);
  const [passengerToRemove, setPassengerToRemove] = useState<{
    bookingId: string;
    passengerId: string;
    name: string;
  } | null>(null);
  const [slotToRelease, setSlotToRelease] = useState<{
    bookingId: string;
    titularName: string;
  } | null>(null);
  const [transferTarget, setTransferTarget] = useState<TransferTarget | null>(null);

  const confirmAddPassenger = (): void => {
    if (!titularToGrow) return;
    addPassenger(
      { bookingId: titularToGrow.bookingId, tourId },
      { onSuccess: () => setTitularToGrow(null) },
    );
  };

  const confirmRemovePassenger = (penaltyAmount = 0): void => {
    if (!passengerToRemove) return;
    removePassenger(
      {
        bookingId: passengerToRemove.bookingId,
        passengerId: passengerToRemove.passengerId,
        penaltyAmount,
      },
      { onSuccess: () => setPassengerToRemove(null) },
    );
  };

  // `ReleaseSlotDialog` espera la promesa: cierra al resolver y conserva el diálogo si falla.
  const confirmReleaseSlot = async (): Promise<void> => {
    if (!slotToRelease) return;
    await removePendingSlot({ bookingId: slotToRelease.bookingId });
  };

  return {
    isAdding,
    isRemoving,
    isRemovingGhost,
    titularToGrow,
    passengerToRemove,
    slotToRelease,
    transferTarget,
    openAddPassenger: (titular: TitularRowOutput) => setTitularToGrow(titular),
    closeAddPassenger: () => setTitularToGrow(null),
    confirmAddPassenger,
    openRemovePassenger: (bookingId: string, passengerId: string, name: string) =>
      setPassengerToRemove({ bookingId, passengerId, name }),
    closeRemovePassenger: () => setPassengerToRemove(null),
    confirmRemovePassenger,
    openReleaseSlot: (bookingId: string, titularName: string) =>
      setSlotToRelease({ bookingId, titularName }),
    closeReleaseSlot: () => setSlotToRelease(null),
    confirmReleaseSlot,
    // La API manda "Sin teléfono" si no hay WhatsApp; el modal solo precarga 10 dígitos.
    openTransfer: (
      bookingId: string,
      passengerId: string,
      role: PassengerRole,
      currentName: string,
      whatsapp: string,
    ) =>
      setTransferTarget({
        bookingId,
        passengerId,
        role,
        currentName,
        currentWhatsapp: toTransferWhatsapp(whatsapp),
      }),
    closeTransfer: () => setTransferTarget(null),
  };
}

export type TravelerGroupActions = ReturnType<typeof useTravelerGroupActions>;
