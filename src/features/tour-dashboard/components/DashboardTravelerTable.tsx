"use client";

import { useMemo, useState } from "react";
import { TitularRowDTO } from "../schemas/tour-dashboard.schema";
import {
  useAddPassengerToBooking,
  useQuickRemovePassenger,
  useRemovePendingSlot,
} from "../hooks/useTourDashboard";
import { AddPassengerDialog } from "./AddPassengerDialog";
import { RemovePassengerDialog } from "./RemovePassengerDialog";
import { TravelerGroup } from "./TravelerGroup";
import { Button } from "@/components/ui/button";

export type PaymentFilter = "ALL" | "UNPAID" | "PARTIAL" | "PAID";
export type RegistrationFilter = "ALL" | "PENDING" | "COMPLETED";
export type SeatFilter = "ALL" | "UNASSIGNED" | "ASSIGNED";

interface DashboardTravelerTableProps {
  tourId: string;
  travelers: TitularRowDTO[];
  searchQuery: string;
  paymentFilter: PaymentFilter | string;
  formFilter: RegistrationFilter | string;
  seatFilter: SeatFilter | string;
  isAuditMode?: boolean;
  tourCurrency?: "MXN" | "USD";
  freeSeatsCount?: number;
  onRowClick: (id: string) => void;
  onAssignSeatClick: (passengerId: string) => void;
  onClearFilters?: () => void;
}

export function DashboardTravelerTable({
  tourId,
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
  const { mutate: removePendingSlot, isPending: isRemovingGhost } = useRemovePendingSlot();
  const [confirmAdd, setConfirmAdd] = useState<{ isOpen: boolean; titular?: TitularRowDTO }>({
    isOpen: false,
  });

  const [confirmRemove, setConfirmRemove] = useState<{
    isOpen: boolean;
    bookingId: string;
    passengerId: string;
    name: string;
  } | null>(null);

  const filteredTravelers = useMemo(() => {
    if (!travelers) return [];

    return travelers.filter((titular) => {
      // Regla 1: Búsqueda. Verifica titular O acompañantes de manera aislada.
      const matchSearch = () => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase().trim();

        const titularMatch =
          titular.fullName.toLowerCase().includes(query) || titular.whatsapp.includes(query);

        if (titularMatch) return true;

        return (
          titular.companions?.some(
            (comp) => comp.fullName.toLowerCase().includes(query) || comp.whatsapp.includes(query),
          ) ?? false
        );
      };

      // Regla 2: Finanzas (Defensive Programming contra inconsistencias de DB)
      const matchPayment = () => {
        if (paymentFilter === "ALL") return true;

        let resolvedStatus = "UNPAID";
        if (titular.paymentStatus === "PAID" || (titular.paidAmount > 0 && titular.balance <= 0)) {
          resolvedStatus = "PAID";
        } else if (
          titular.paidAmount > 0 ||
          ["ADVANCE", "PARTIAL", "PENDING_VALIDATION"].includes(titular.paymentStatus)
        ) {
          resolvedStatus = "PARTIAL";
        }

        return resolvedStatus === paymentFilter;
      };

      // 🚀 Escenario 2 PM: Evaluación de Grupo para el Formulario
      const matchRegistration = () => {
        if (formFilter === "ALL") return true;

        const isTitularCompleted = titular.formStatus === "COMPLETED";
        const areCompanionsCompleted =
          titular.companions?.every((c) => c.formStatus === "COMPLETED") ?? true;

        // La cadena es tan fuerte como su eslabón más débil
        const groupStatus = isTitularCompleted && areCompanionsCompleted ? "COMPLETED" : "PENDING";

        return groupStatus === formFilter;
      };

      // Regla 4: Filtro de Asientos (Evaluación de Grupo)
      const matchSeat = () => {
        if (seatFilter === "ALL") return true;

        const groupMembers = [titular, ...(titular.companions || [])];

        if (seatFilter === "UNASSIGNED") {
          // Si AL MENOS UNO no tiene asiento, el grupo requiere atención
          return groupMembers.some((member) => !member.seatLabel);
        }

        if (seatFilter === "ASSIGNED") {
          // Solo si TODOS tienen asiento, el grupo está completo
          return groupMembers.every((member) => !!member.seatLabel);
        }

        return true;
      };

      // 🚀 Escenario 1 PM: Short-circuit evaluation estricta (AND)
      return matchSearch() && matchPayment() && matchRegistration() && matchSeat();
    });
  }, [travelers, searchQuery, paymentFilter, formFilter, seatFilter]);

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

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 font-semibold text-slate-600">
              <tr>
                <th className="w-10 px-4 py-4"></th>
                <th className="px-6 py-4">Viajero / Grupo</th>
                <th className="px-6 py-4">Asiento</th>
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
                  onRowClick={onRowClick}
                  onAssignSeatClick={onAssignSeatClick}
                  isRemovingGhost={isRemovingGhost}
                  onAddPassengerClick={(t) => setConfirmAdd({ isOpen: true, titular: t })}
                  onRemovePassengerClick={(bId, pId, name) =>
                    setConfirmRemove({ isOpen: true, bookingId: bId, passengerId: pId, name })
                  }
                  onRemoveGhostSlotClick={(bookingId) => removePendingSlot({ bookingId })}
                  freeSeatsCount={freeSeatsCount}
                />
              ))}

              {filteredTravelers.length === 0 && travelers?.length > 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
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
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
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
        // freeSeatsCount={tourMetrics.occupancy.max - tourMetrics.occupancy.current}
      />

      <RemovePassengerDialog
        isOpen={confirmRemove?.isOpen ?? false}
        onClose={() => setConfirmRemove(null)}
        onConfirm={handleConfirmRemovePassenger}
        passengerName={confirmRemove?.name}
        isSubmitting={isRemoving}
      />
    </>
  );
}
