"use client";

import { useState } from "react";
import { TitularRowOutput } from "@/features/tour-dashboard/schemas/tour-dashboard.schema";
import {
  useAddPassengerToBooking,
  useQuickRemovePassenger,
  useRemovePendingSlot,
} from "@/features/tour-dashboard/hooks/useTourDashboard";
import { AddPassengerDialog } from "@/features/tour-dashboard/components/passengers/AddPassengerDialog";
import { RemovePassengerDialog } from "@/features/tour-dashboard/components/passengers/RemovePassengerDialog";
import { TravelerGroup } from "@/features/tour-dashboard/components/passengers/TravelerGroup";
import { Button } from "@/components/ui/button";
import { ReleaseSlotDialog } from "@/features/tour-dashboard/components/passengers/ReleaseSlotDialog";
import { TransferPassengerModal } from "@/features/tour-dashboard/components/passengers/TransferPassengerModal";
import type { StatementPDFData } from "@/features/statements/pdf/payment-receipt.pdf";
import { downloadOperatorStatement } from "@/features/tour-dashboard/utils/statement-agency.util";
import { type Currency, type PassengerRole } from "@/shared/constants/domain.constants";

import {
  filterDashboardTravelers,
  toTransferWhatsapp,
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
  statementAgency: StatementPDFData["agency"];
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
  const { mutate: addPassenger, isPending: isAdding } = useAddPassengerToBooking();
  const { mutate: removePassenger, isPending: isRemoving } = useQuickRemovePassenger();
  const { mutateAsync: removePendingSlot, isPending: isRemovingGhost } = useRemovePendingSlot();
  const [transferTarget, setTransferTarget] = useState<{
    bookingId: string;
    passengerId: string;
    role: PassengerRole;
    currentName: string;
    currentWhatsapp: string | null;
  } | null>(null);
  const [confirmAdd, setConfirmAdd] = useState<{ isOpen: boolean; titular?: TitularRowOutput }>({
    isOpen: false,
  });

  const [confirmRemove, setConfirmRemove] = useState<{
    isOpen: boolean;
    bookingId: string;
    passengerId: string;
    name: string;
  } | null>(null);

  const [slotToRelease, setSlotToRelease] = useState<{
    bookingId: string;
    titularName: string;
  } | null>(null);

  // Misma regla que la vista móvil (`filterDashboardTravelers`, utils/dashboard-travelers.util).
  const filteredTravelers = filterDashboardTravelers(travelers, {
    searchQuery,
    paymentFilter,
    formFilter,
    seatFilter,
  });

  const handleConfirmAddPassenger = (): void => {
    if (confirmAdd.titular) {
      addPassenger(
        { bookingId: confirmAdd.titular.bookingId, tourId },
        { onSuccess: () => setConfirmAdd({ isOpen: false }) },
      );
    }
  };

  const handleConfirmRemovePassenger = (): void => {
    if (confirmRemove) {
      removePassenger(
        { bookingId: confirmRemove.bookingId, passengerId: confirmRemove.passengerId },
        { onSuccess: () => setConfirmRemove(null) },
      );
    }
  };

  const handleConfirmReleaseSlot = async (): Promise<void> => {
    if (!slotToRelease) return;
    try {
      await removePendingSlot({ bookingId: slotToRelease.bookingId });
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // Transferencia de lugar (titular o acompañante). La API devuelve "Sin teléfono" si no hay número.
  const handleOpenTransferModal = (
    bookingId: string,
    passengerId: string,
    role: PassengerRole,
    currentName: string,
    whatsapp: string,
  ): void => {
    setTransferTarget({
      bookingId,
      passengerId,
      role,
      currentName,
      currentWhatsapp: toTransferWhatsapp(whatsapp),
    });
  };

  // Misma generación que la tarjeta del celular (`downloadOperatorStatement`).
  const handleDownloadReceipt = (titularData: TitularRowOutput): Promise<void> =>
    downloadOperatorStatement(titularData, {
      agency: statementAgency,
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
                {requiresSeats && <th className="px-6 py-4">Seat</th>}
                <th className="px-6 py-4">Abordaje</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4">Registro</th>
                <th className="px-6 py-4">Estado Financiero</th>
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
                  isAdding={isAdding}
                  requiresSeats={requiresSeats}
                  onRowClick={onRowClick}
                  onAssignSeatClick={onAssignSeatClick}
                  isRemovingGhost={isRemovingGhost}
                  onAddPassengerClick={(t) => setConfirmAdd({ isOpen: true, titular: t })}
                  onRemovePassengerClick={(bId, pId, name) =>
                    setConfirmRemove({ isOpen: true, bookingId: bId, passengerId: pId, name })
                  }
                  onRemoveGhostSlotClick={(bookingId) =>
                    setSlotToRelease({ bookingId, titularName: titular.fullName })
                  }
                  freeSeatsCount={freeSeatsCount}
                  onTransferPassengerClick={handleOpenTransferModal}
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
      <AddPassengerDialog
        isOpen={confirmAdd.isOpen}
        onClose={() => setConfirmAdd({ isOpen: false })}
        onConfirm={handleConfirmAddPassenger}
        titular={confirmAdd.titular}
        tourCurrency={tourCurrency}
        isSubmitting={isAdding}
        freeSeatsCount={freeSeatsCount}
      />

      <ReleaseSlotDialog
        isOpen={!!slotToRelease}
        onClose={() => setSlotToRelease(null)}
        titularName={slotToRelease?.titularName || ""}
        slotId={slotToRelease?.bookingId}
        onConfirm={handleConfirmReleaseSlot}
      />

      <RemovePassengerDialog
        isOpen={confirmRemove?.isOpen ?? false}
        onClose={() => setConfirmRemove(null)}
        onConfirm={handleConfirmRemovePassenger}
        passengerName={confirmRemove?.name}
        isSubmitting={isRemoving}
      />

      {transferTarget && (
        <TransferPassengerModal
          key={`${transferTarget.bookingId}-${transferTarget.passengerId}`}
          open
          onOpenChange={(open) => {
            if (!open) setTransferTarget(null);
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
