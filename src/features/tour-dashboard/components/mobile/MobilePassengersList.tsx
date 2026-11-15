import type { TitularRowOutput } from "@/features/tour-dashboard/schemas/tour-dashboard.schema";
import type { Currency } from "@/shared/constants/domain.constants";
import { BookingCard } from "./BookingCard";

interface MobilePassengersListProps {
  /** Grupos ya filtrados (`filterDashboardTravelers`). */
  travelers: TitularRowOutput[];
  tourCurrency: Currency;
  isAuditMode: boolean;
  onAssignSeatClick: (passengerId: string) => void;
  onRowClick: (id: string) => void;
}

/** Tarjetas de reservas del Centro de Control en celular, con estado vacío y contador. */
export function MobilePassengersList({
  travelers,
  tourCurrency,
  isAuditMode,
  onAssignSeatClick,
  onRowClick,
}: MobilePassengersListProps) {
  return (
    <>
      <div className="space-y-3">
        {travelers.map((titular) => (
          <BookingCard
            key={titular.id}
            titular={titular}
            tourCurrency={tourCurrency}
            onAssignSeatClick={onAssignSeatClick}
            onRowClick={onRowClick}
            isAuditMode={isAuditMode}
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
    </>
  );
}
