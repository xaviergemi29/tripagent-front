"use client";

import { useState } from "react";
import type { TitularRowOutput } from "@/features/tour-dashboard/schemas/tour-dashboard.schema";
import type { Currency } from "@/shared/constants/domain.constants";
import { PASSENGER_ROLE } from "@/shared/constants/domain.constants";
import { TransferPassengerModal } from "@/features/tour-dashboard/components/passengers/TransferPassengerModal";
import {
  downloadOperatorStatement,
  type OperatorStatementContext,
} from "@/features/tour-dashboard/utils/statement-agency.util";
import { toTransferWhatsapp } from "@/features/tour-dashboard/utils/dashboard-travelers.util";
import { BookingCard } from "./BookingCard";

interface MobilePassengersListProps {
  /** Grupos ya filtrados (`filterDashboardTravelers`). */
  travelers: TitularRowOutput[];
  tourCurrency: Currency;
  isAuditMode: boolean;
  /** Datos del tour y la agencia para el estado de cuenta PDF (los mismos que en escritorio). */
  statementContext: OperatorStatementContext;
  onAssignSeatClick: (passengerId: string) => void;
  onRowClick: (id: string) => void;
}

/** Tarjetas de reservas del Centro de Control en celular, con estado vacío y contador. */
export function MobilePassengersList({
  travelers,
  tourCurrency,
  isAuditMode,
  statementContext,
  onAssignSeatClick,
  onRowClick,
}: MobilePassengersListProps) {
  // Transferencia de titularidad desde el ⋮ de la tarjeta (mismo modal que en escritorio).
  const [transferTitular, setTransferTitular] = useState<TitularRowOutput | null>(null);

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
            onDownloadReceiptClick={(t) => void downloadOperatorStatement(t, statementContext)}
            onTransferClick={isAuditMode ? undefined : setTransferTitular}
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

      {transferTitular && (
        <TransferPassengerModal
          key={`${transferTitular.bookingId}-${transferTitular.id}`}
          open
          onOpenChange={(open) => {
            if (!open) setTransferTitular(null);
          }}
          bookingId={transferTitular.bookingId}
          passengerId={transferTitular.id}
          role={PASSENGER_ROLE.TITULAR}
          currentName={transferTitular.fullName}
          currentWhatsapp={toTransferWhatsapp(transferTitular.whatsapp)}
        />
      )}
    </>
  );
}
