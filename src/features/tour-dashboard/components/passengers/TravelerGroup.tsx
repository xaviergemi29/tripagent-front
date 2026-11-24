import { useState } from "react";
import type { TitularRowOutput } from "@/features/tour-dashboard/schemas/tour-dashboard.schema";
import {
  type Currency,
  PASSENGER_ROLE,
  type PassengerRole,
  FORM_STATUS,
} from "@/shared/constants/domain.constants";
import type { BookingWhatsAppBankDetails } from "@/shared/utils/booking-whatsapp.util";
import { TitularRow } from "./TitularRow";
import { CompanionRow } from "./CompanionRow";
import { SyncingGroupRow } from "./PassengersSkeleton";
import { AddSlotRow, PendingSlotRow } from "./PendingSlotRows";

interface TravelerGroupProps {
  titular: TitularRowOutput;
  isAuditMode?: boolean;
  tourCurrency?: Currency;
  tourTitle?: string;
  bankDetails?: BookingWhatsAppBankDetails;
  isAdding?: boolean;
  isRemovingGhost?: boolean;
  freeSeatsCount?: number;
  requiresSeats?: boolean;
  onRowClick: (id: string) => void;
  onAssignSeatClick: (passengerId: string) => void;
  onAddPassengerClick: (titular: TitularRowOutput) => void;
  onRemovePassengerClick: (bookingId: string, passengerId: string, name: string) => void;
  onRemoveGhostSlotClick: (bookingId: string) => void;
  onTransferPassengerClick?: (
    bookingId: string,
    passengerId: string,
    role: PassengerRole,
    currentName: string,
    whatsapp: string,
  ) => void;
  onDownloadReceiptClick?: (titular: TitularRowOutput) => void;
  /** Grupo al que llevó una notificación (`?bookingId=`): se resalta unos segundos. */
  isHighlighted?: boolean;
  /** Baja o cancelación en curso (o dashboard recargando): el grupo se dibuja como skeleton. */
  isSyncing?: boolean;
}

/**
 * Grupo de una reserva en la tabla del Centro de Control (escritorio): la fila del titular y, al
 * expandir, sus acompañantes, los lugares pendientes de registro y "Agregar lugar al grupo".
 * Cada tipo de fila vive en su propio componente; aquí solo se compone y se calcula el grupo.
 */
export function TravelerGroup({
  titular,
  isAuditMode,
  tourCurrency,
  tourTitle,
  bankDetails,
  isAdding,
  isRemovingGhost,
  freeSeatsCount,
  requiresSeats,
  onRemoveGhostSlotClick,
  onRowClick,
  onAssignSeatClick,
  onAddPassengerClick,
  onRemovePassengerClick,
  onTransferPassengerClick,
  onDownloadReceiptClick,
  isHighlighted = false,
  isSyncing = false,
}: TravelerGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const registeredCount = 1 + (titular.companions?.length || 0);
  const missingCount = Math.max(0, titular.groupSize - registeredCount);

  if (isSyncing) {
    return <SyncingGroupRow bookingId={titular.bookingId} colSpan={requiresSeats ? 8 : 7} />;
  }

  return (
    <>
      <TitularRow
        titular={titular}
        registeredCount={registeredCount}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
        isAuditMode={isAuditMode}
        tourCurrency={tourCurrency}
        tourTitle={tourTitle}
        bankDetails={bankDetails}
        requiresSeats={requiresSeats}
        onRowClick={onRowClick}
        onAssignSeatClick={onAssignSeatClick}
        onDownloadReceiptClick={onDownloadReceiptClick}
        isHighlighted={isHighlighted}
        onTransferClick={() =>
          onTransferPassengerClick?.(
            titular.bookingId,
            titular.id,
            PASSENGER_ROLE.TITULAR,
            titular.fullName,
            titular.whatsapp,
          )
        }
      />

      {isExpanded &&
        titular.companions?.map((companion) => (
          <CompanionRow
            key={companion.id}
            companion={companion}
            titularName={titular.fullName}
            hasSeatRight={titular.hasSeatRight}
            isAuditMode={isAuditMode}
            requiresSeats={requiresSeats}
            onRowClick={onRowClick}
            onAssignSeatClick={onAssignSeatClick}
            onRemoveClick={() =>
              onRemovePassengerClick(companion.bookingId, companion.id, companion.fullName)
            }
            onTransferClick={() =>
              onTransferPassengerClick?.(
                companion.bookingId,
                companion.id,
                PASSENGER_ROLE.COMPANION,
                companion.fullName,
                companion.whatsapp,
              )
            }
          />
        ))}

      {isExpanded &&
        Array.from({ length: missingCount }).map((_, index) => (
          <PendingSlotRow
            key={`ghost-${titular.id}-${index}`}
            slotNumber={registeredCount + index + 1}
            hasSeatRight={titular.hasSeatRight}
            isAuditMode={isAuditMode}
            requiresSeats={requiresSeats}
            isRemoving={isRemovingGhost}
            onAssignSeat={() => onAssignSeatClick(titular.id)}
            onRemove={() => onRemoveGhostSlotClick(titular.bookingId)}
          />
        ))}

      {!isAuditMode && isExpanded && titular.formStatus === FORM_STATUS.PENDING && (
        <AddSlotRow
          colSpan={requiresSeats ? 8 : 7}
          isAdding={isAdding}
          freeSeatsCount={freeSeatsCount}
          onAdd={() => onAddPassengerClick(titular)}
        />
      )}
    </>
  );
}
