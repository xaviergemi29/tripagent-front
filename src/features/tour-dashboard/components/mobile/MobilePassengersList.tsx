"use client";

import type { TitularRowOutput } from "@/features/tour-dashboard/schemas/tour-dashboard.schema";
import type { Currency } from "@/shared/constants/domain.constants";
import { useTravelerGroupActions } from "@/features/tour-dashboard/hooks/useTravelerGroupActions";
import { TravelerGroupDialogs } from "@/features/tour-dashboard/components/passengers/TravelerGroupDialogs";
import {
  downloadOperatorStatement,
  type OperatorStatementDownloadContext,
} from "@/features/tour-dashboard/utils/statement-agency.util";
import { BookingCard } from "./BookingCard";

interface MobilePassengersListProps {
  tourId: string;
  /** Grupos ya filtrados (`filterDashboardTravelers`). */
  travelers: TitularRowOutput[];
  tourCurrency: Currency;
  isAuditMode: boolean;
  requiresSeats?: boolean;
  /** Lugares libres del tour (para "Agregar lugar al grupo"). */
  freeSeatsCount?: number;
  /** Datos del tour y la agencia para el estado de cuenta PDF (los mismos que en escritorio). */
  statementContext: OperatorStatementDownloadContext;
  onAssignSeatClick: (passengerId: string) => void;
  onRowClick: (id: string) => void;
}

/**
 * Tarjetas de reservas del Centro de Control en celular, con estado vacío y contador. Las acciones
 * del grupo (agregar lugar, dar de baja, liberar, transferir) son las de escritorio
 * (`useTravelerGroupActions` + `TravelerGroupDialogs`); en Modo Auditoría no se ofrecen.
 */
export function MobilePassengersList({
  tourId,
  travelers,
  tourCurrency,
  isAuditMode,
  requiresSeats,
  freeSeatsCount,
  statementContext,
  onAssignSeatClick,
  onRowClick,
}: MobilePassengersListProps) {
  const groupActions = useTravelerGroupActions(tourId);

  return (
    <>
      <div className="space-y-3">
        {travelers.map((titular) => (
          <BookingCard
            key={titular.id}
            titular={titular}
            tourCurrency={tourCurrency}
            requiresSeats={requiresSeats}
            onAssignSeatClick={onAssignSeatClick}
            onRowClick={onRowClick}
            isAuditMode={isAuditMode}
            onDownloadReceiptClick={(t) => void downloadOperatorStatement(t, statementContext)}
            onTransferPassengerClick={groupActions.openTransfer}
            onRemovePassengerClick={groupActions.openRemovePassenger}
            onRemoveGhostSlotClick={(bookingId) =>
              groupActions.openReleaseSlot(bookingId, titular.fullName)
            }
            onAddPassengerClick={groupActions.openAddPassenger}
            isAdding={groupActions.isAdding}
            isRemovingGhost={groupActions.isRemovingGhost}
            freeSeatsCount={freeSeatsCount}
          />
        ))}

        {travelers.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            <p>No se encontraron reservas con los filtros actuales.</p>
          </div>
        )}
      </div>

      <div className="py-6 text-center text-xs font-medium text-slate-500">
        Mostrando {travelers.length} reservas principales
      </div>

      <TravelerGroupDialogs
        actions={groupActions}
        tourCurrency={tourCurrency}
        freeSeatsCount={freeSeatsCount}
      />
    </>
  );
}
