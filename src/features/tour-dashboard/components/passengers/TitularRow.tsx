import { ChevronDown, FileDown, Link2, User, Users, Wallet } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UnpaidHoldAge } from "@/features/tour-dashboard/components/passengers/UnpaidHoldAge";
import { RefundableSurplusBadge } from "@/features/tour-dashboard/components/passengers/RefundableSurplusBadge";
import type { TitularRowOutput } from "@/features/tour-dashboard/schemas/tour-dashboard.schema";
import {
  BOOKING_STATUS,
  type Currency,
  DEFAULT_CURRENCY,
} from "@/shared/constants/domain.constants";
import type { BookingWhatsAppBankAccounts } from "@/shared/utils/booking-whatsapp.util";
import { formatCurrency } from "@/shared/utils/currency.util";
import {
  copyMagicLink,
  FinancialStatusBadge,
  RegistrationStatusBadge,
  ROW_ACTION_TONE,
  RowActionButton,
  SeatCell,
  TransferMenu,
} from "./traveler-row-cells";
import { canSendBookingWhatsApp, SendBookingWhatsAppAction } from "./SendBookingWhatsAppAction";
import { TOUR_TARGET } from "@/features/onboarding/constants/guided-tours";
import { hasRegisteredPayments } from "@/features/tour-dashboard/utils/dashboard-travelers.util";
import { formatPhoneForDisplay } from "@/shared/utils/phone.util";

interface TitularRowProps {
  titular: TitularRowOutput;
  registeredCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  isAuditMode?: boolean;
  tourCurrency?: Currency;
  tourTitle?: string;
  /** Datos de transferencia de la agencia para el mensaje de WhatsApp. */
  bankAccounts?: BookingWhatsAppBankAccounts;
  requiresSeats?: boolean;
  onRowClick: (id: string) => void;
  onAssignSeatClick: (passengerId: string) => void;
  onTransferClick: () => void;
  onDownloadReceiptClick?: (titular: TitularRowOutput) => void;
  /** Grupo al que llevó una notificación (`?bookingId=`): se resalta unos segundos. */
  isHighlighted?: boolean;
}

/** Fila principal del grupo: titular, asiento, abordaje, registro, pagos y acciones. */
export function TitularRow({
  titular,
  registeredCount,
  isExpanded,
  onToggle,
  isAuditMode,
  tourCurrency,
  tourTitle = "",
  bankAccounts,
  requiresSeats,
  onRowClick,
  onAssignSeatClick,
  onTransferClick,
  onDownloadReceiptClick,
  isHighlighted = false,
}: TitularRowProps) {
  const isGroup = titular.groupSize > 1;
  const hasPaid = hasRegisteredPayments(titular);

  return (
    <tr
      data-booking-id={titular.bookingId}
      className={`cursor-pointer transition-colors duration-700 ${
        isHighlighted ? "bg-indigo-50/80" : "hover:bg-slate-50/50"
      }`}
      onClick={onToggle}
    >
      <td
        className="px-4 py-3.5"
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
      >
        {isGroup && (
          <button className="rounded p-0.5 text-slate-400 transition hover:text-slate-700">
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                isExpanded ? "rotate-0" : "-rotate-90"
              }`}
            />
          </button>
        )}
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          {isGroup ? (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-indigo-100/70 bg-indigo-50 text-indigo-600">
              <Users className="h-4 w-4" />
            </div>
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-100/70 bg-slate-50 text-slate-400">
              <User className="h-4 w-4" />
            </div>
          )}

          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-1.5 font-medium text-slate-900">
              <span>{titular.fullName}</span>
              {isGroup && <span className="text-xs font-normal text-slate-400">Titular</span>}
            </div>
            {isGroup && (
              <span className="mt-0.5 text-[11px] text-slate-500">
                Grupo: {titular.groupSize} viajeros ({registeredCount} registrados)
              </span>
            )}
          </div>
        </div>
      </td>
      {requiresSeats && (
        <td className="px-6 py-3.5">
          <SeatCell
            hasSeatRight={titular.hasSeatRight}
            seatLabel={titular.seatLabel}
            isAuditMode={isAuditMode}
            onAssign={() => onAssignSeatClick(titular.id)}
            elevated
          />
        </td>
      )}
      <td className="px-6 py-3.5">
        {titular.boardingPoint ? (
          <span className="text-xs font-medium text-slate-700">{titular.boardingPoint}</span>
        ) : (
          <span className="text-xs font-medium text-slate-400">Por definir</span>
        )}
      </td>
      <td className="px-6 py-3.5 font-mono text-xs whitespace-nowrap text-slate-600">
        {formatPhoneForDisplay(titular.whatsapp)}
      </td>
      <td className="px-6 py-3.5">
        <RegistrationStatusBadge status={titular.formStatus} />
      </td>
      <td className="px-6 py-3.5">
        {/* Cancelada por el cliente (filtro "Canceladas"): la agencia retiene lo abonado. */}
        {titular.bookingStatus === BOOKING_STATUS.CANCELLED ? (
          <div className="flex flex-col items-start gap-1">
            <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold tracking-wide whitespace-nowrap text-slate-600 uppercase">
              Cancelada
            </span>
            <span className="text-[11px] font-bold whitespace-nowrap text-slate-500">
              Retenido:{" "}
              {formatCurrency(titular.paidAmount, { currency: tourCurrency || DEFAULT_CURRENCY })}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-1">
            <FinancialStatusBadge
              status={titular.paymentStatus}
              paidAmount={titular.paidAmount}
              balance={titular.balance}
            />
            {titular.balance > 0 ? (
              <span className="text-[11px] font-bold whitespace-nowrap text-slate-500">
                Debe:{" "}
                {formatCurrency(titular.balance, { currency: tourCurrency || DEFAULT_CURRENCY })}
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-400">Sin adeudos</span>
            )}
            {/* Revisión manual de las 48 h (regla 13): solo apartados sin ningún pago. */}
            {titular.paidAmount <= 0 && titular.balance > 0 && (
              <UnpaidHoldAge bookedAt={titular.bookedAt} />
            )}
            {(titular.refundableSurplus ?? 0) > 0 && (
              <RefundableSurplusBadge
                amount={titular.refundableSurplus ?? 0}
                tourCurrency={tourCurrency || DEFAULT_CURRENCY}
              />
            )}
          </div>
        )}
      </td>
      <td className="px-6 py-3.5 text-right whitespace-nowrap">
        <TooltipProvider delayDuration={150}>
          <div className="flex items-center justify-end gap-1.5">
            {hasPaid && onDownloadReceiptClick && (
              <RowActionButton
                tooltip="Descargar Comprobante PDF"
                ariaLabel="Descargar Comprobante PDF"
                guideTarget={TOUR_TARGET.DASHBOARD_ACTION_RECEIPT}
                className={`h-9 w-9 rounded-lg border transition-colors ${ROW_ACTION_TONE.receipt}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onDownloadReceiptClick(titular);
                }}
              >
                <FileDown className="h-4 w-4" />
              </RowActionButton>
            )}
            {!isAuditMode && canSendBookingWhatsApp(titular) && (
              <SendBookingWhatsAppAction
                titular={titular}
                tourTitle={tourTitle}
                tourCurrency={tourCurrency || DEFAULT_CURRENCY}
                bankAccounts={bankAccounts}
              />
            )}
            {/* Magic Link permanente (registro y estado de cuenta) */}
            {titular.magicToken && (
              <RowActionButton
                tooltip="Copiar Magic Link del viajero"
                ariaLabel="Copiar Magic Link"
                guideTarget={TOUR_TARGET.DASHBOARD_ACTION_MAGIC_LINK}
                className={`h-9 w-9 rounded-lg border transition-colors ${ROW_ACTION_TONE.magicLink}`}
                onClick={(event) => copyMagicLink(event, titular.magicToken)}
              >
                <Link2 className="h-4 w-4" />
              </RowActionButton>
            )}

            <RowActionButton
              tooltip="Registrar abonos y pagos"
              ariaLabel="Registrar abonos y pagos"
              guideTarget={TOUR_TARGET.DASHBOARD_ACTION_PAYMENTS}
              className={`h-9 w-9 rounded-lg border transition-colors ${ROW_ACTION_TONE.payments}`}
              onClick={(event) => {
                event.stopPropagation();
                onRowClick(titular.id);
              }}
            >
              <Wallet className="h-4 w-4" />
            </RowActionButton>

            {!isAuditMode && (
              <TransferMenu
                label="Transferir titularidad"
                triggerAriaLabel="Más acciones del titular"
                guideTarget={TOUR_TARGET.DASHBOARD_ACTION_TRANSFER}
                onSelect={onTransferClick}
              />
            )}
          </div>
        </TooltipProvider>
      </td>
    </tr>
  );
}
