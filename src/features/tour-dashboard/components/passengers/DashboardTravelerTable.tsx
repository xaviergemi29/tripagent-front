"use client";

import { TitularRowOutput } from "@/features/tour-dashboard/schemas/tour-dashboard.schema";
import { useTravelerGroupActions } from "@/features/tour-dashboard/hooks/useTravelerGroupActions";
import { TravelerGroup } from "@/features/tour-dashboard/components/passengers/TravelerGroup";
import { TravelerGroupDialogs } from "@/features/tour-dashboard/components/passengers/TravelerGroupDialogs";
import { Button } from "@/components/ui/button";
import type { StatementPDFData } from "@/features/statements/pdf/payment-receipt.pdf";
import { downloadOperatorStatement } from "@/features/tour-dashboard/utils/statement-agency.util";
import { type Currency } from "@/shared/constants/domain.constants";

import {
  filterDashboardTravelers,
  type PaymentFilter,
  type RegistrationFilter,
  type SeatFilter,
} from "@/features/tour-dashboard/utils/dashboard-travelers.util";

export type { PaymentFilter, RegistrationFilter, SeatFilter };

interface DashboardTravelerTableProps {
  tourId: string;
  tourTitle: string;
  /** Fechas del tour para el estado de cuenta PDF. */
  tourDepartureDate: string;
  tourReturnDate?: string | null;
  /** Marca, contacto, datos bancarios y políticas generales de la agencia para el PDF. */
  /** `null` mientras no hay datos de la agencia: el PDF no se genera (ver `downloadOperatorStatement`). */
  statementAgency: StatementPDFData["agency"] | null;
  onStatementAgencyMissing?: () => void;
  /** Instrucciones Post-Pago (logística) del tour que se imprimen al final del PDF. */
  tourPostPaymentInstructions?: string | null;
  requiresSeats: boolean;
  travelers: TitularRowOutput[];
  searchQuery: string;
  paymentFilter: PaymentFilter | string;
  formFilter: RegistrationFilter | string;
  seatFilter: SeatFilter | string;
  isAuditMode?: boolean;
  tourCurrency?: Currency;
  freeSeatsCount?: number;
  onRowClick: (id: string) => void;
  onAssignSeatClick: (passengerId: string) => void;
  onClearFilters?: () => void;
}

export function DashboardTravelerTable({
  tourId,
  tourTitle,
  tourDepartureDate,
  tourReturnDate,
  statementAgency,
  onStatementAgencyMissing,
  tourPostPaymentInstructions,
  requiresSeats,
  travelers,
  searchQuery,
  paymentFilter,
  formFilter,
  seatFilter,
  isAuditMode,
  tourCurrency,
  freeSeatsCount,
  onRowClick,
  onAssignSeatClick,
  onClearFilters,
}: DashboardTravelerTableProps) {
  // Agregar lugar, dar de baja, liberar y transferir: compartido con el celular.
  const groupActions = useTravelerGroupActions(tourId);

  // Misma regla que la vista móvil (`filterDashboardTravelers`, utils/dashboard-travelers.util).
  const filteredTravelers = filterDashboardTravelers(travelers, {
    searchQuery,
    paymentFilter,
    formFilter,
    seatFilter,
  });

  // Misma generación que la tarjeta del celular (`downloadOperatorStatement`).
  const handleDownloadReceipt = (titularData: TitularRowOutput): Promise<void> =>
    downloadOperatorStatement(titularData, {
      agency: statementAgency,
      onAgencyMissing: onStatementAgencyMissing,
      tourTitle,
      tourDepartureDate,
      tourReturnDate,
      tourPostPaymentInstructions,
      tourCurrency,
    });

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 font-semibold text-slate-600">
              <tr>
                <th className="w-10 px-4 py-4"></th>
                <th className="px-6 py-4">Viajero / Grupo</th>
                {requiresSeats && <th className="px-6 py-4">Asiento</th>}
                <th className="px-6 py-4">Abordaje</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4">Registro</th>
                <th className="px-6 py-4 whitespace-nowrap">Estado Financiero</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTravelers.map((titular) => (
                <TravelerGroup
                  key={titular.id}
                  titular={titular}
                  isAuditMode={isAuditMode}
                  tourCurrency={tourCurrency}
                  isAdding={groupActions.isAdding}
                  requiresSeats={requiresSeats}
                  onRowClick={onRowClick}
                  onAssignSeatClick={onAssignSeatClick}
                  isRemovingGhost={groupActions.isRemovingGhost}
                  onAddPassengerClick={groupActions.openAddPassenger}
                  onRemovePassengerClick={groupActions.openRemovePassenger}
                  onRemoveGhostSlotClick={(bookingId) =>
                    groupActions.openReleaseSlot(bookingId, titular.fullName)
                  }
                  freeSeatsCount={freeSeatsCount}
                  onTransferPassengerClick={groupActions.openTransfer}
                  onDownloadReceiptClick={handleDownloadReceipt}
                />
              ))}

              {filteredTravelers.length === 0 && travelers?.length > 0 && (
                <tr>
                  <td colSpan={requiresSeats ? 8 : 7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                      <p className="text-sm font-medium">
                        No se encontraron viajeros con los filtros actuales.
                      </p>
                      {onClearFilters && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onClearFilters}
                          className="text-slate-600 hover:text-slate-900"
                        >
                          Limpiar filtros
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {travelers?.length === 0 && (
                <tr>
                  <td
                    colSpan={requiresSeats ? 8 : 7}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Aún no hay viajeros registrados en este tour.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <TravelerGroupDialogs
        actions={groupActions}
        tourCurrency={tourCurrency}
        freeSeatsCount={freeSeatsCount}
      />
    </>
  );
}
