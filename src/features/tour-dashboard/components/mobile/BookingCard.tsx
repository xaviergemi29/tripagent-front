import { TitularRowOutput } from "@/features/tour-dashboard/schemas/tour-dashboard.schema";
import {
  MapPin,
  Phone,
  FileText,
  Link2,
  WalletCards,
  Trash2,
  Lock,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { getInitials } from "@/shared/utils/travelers-helpers";
import { formatCurrency } from "@/shared/utils/currency.util";
import {
  type Currency,
  BOOKING_STATUS,
  DEFAULT_CURRENCY,
  PASSENGER_ROLE,
  type PassengerRole,
  FORM_STATUS,
  PAYMENT_STATUS,
} from "@/shared/constants/domain.constants";
import { buildWhatsAppUrl } from "@/shared/utils/share-links.util";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { SeatWithoutDepositBadge } from "@/features/tour-dashboard/components/passengers/SeatWithoutDepositBadge";
import { UnpaidHoldAge } from "@/features/tour-dashboard/components/passengers/UnpaidHoldAge";
import { RefundableSurplusBadge } from "@/features/tour-dashboard/components/passengers/RefundableSurplusBadge";
import { TOUR_TARGET } from "@/features/onboarding/constants/guided-tours";
import {
  copyMagicLink,
  ROW_ACTION_TONE,
  TransferMenu,
} from "@/features/tour-dashboard/components/passengers/traveler-row-cells";
import { hasRegisteredPayments } from "@/features/tour-dashboard/utils/dashboard-travelers.util";
import { buildTelUrl, formatPhoneForDisplay } from "@/shared/utils/phone.util";

interface BookingCardProps {
  titular: TitularRowOutput;
  tourCurrency?: Currency;
  requiresSeats?: boolean;
  onAssignSeatClick: (passengerId: string) => void;
  /** Modo Auditoría (tour finalizado, pausado o cancelado): sin acciones sobre asientos. */
  isAuditMode?: boolean;
  onRowClick?: (id: string) => void;
  /** Estado de cuenta PDF (solo con abonos registrados, igual que en escritorio). */
  onDownloadReceiptClick?: (titular: TitularRowOutput) => void;
  /*
   * Acciones del grupo (las mismas de `TravelerGroup` en escritorio, `useTravelerGroupActions`).
   * Ninguna se ofrece en Modo Auditoría.
   */
  /** «Transferir titularidad» (titular) y «Transferir lugar» (acompañante). */
  onTransferPassengerClick?: (
    bookingId: string,
    passengerId: string,
    role: PassengerRole,
    currentName: string,
    whatsapp: string,
  ) => void;
  /** «Dar de baja pasajero» de un acompañante. */
  onRemovePassengerClick?: (bookingId: string, passengerId: string, name: string) => void;
  /** «Liberar lugar apartado» de un lugar pendiente de registro. */
  onRemoveGhostSlotClick?: (bookingId: string) => void;
  /** «+ Agregar lugar al grupo» (solo con el formulario pendiente, igual que en escritorio). */
  onAddPassengerClick?: (titular: TitularRowOutput) => void;
  isAdding?: boolean;
  isRemovingGhost?: boolean;
  /** Lugares libres del tour: sin lugares, "Agregar lugar" se deshabilita. */
  freeSeatsCount?: number;
}

export function BookingCard({
  titular,
  tourCurrency = DEFAULT_CURRENCY,
  requiresSeats,
  onAssignSeatClick,
  isAuditMode = false,
  onRowClick,
  onDownloadReceiptClick,
  onTransferPassengerClick,
  onRemovePassengerClick,
  onRemoveGhostSlotClick,
  onAddPassengerClick,
  isAdding = false,
  isRemovingGhost = false,
  freeSeatsCount,
}: BookingCardProps) {
  const canEditGroup = !isAuditMode;
  const canAddSlot =
    canEditGroup && Boolean(onAddPassengerClick) && titular.formStatus === FORM_STATUS.PENDING;
  const hasNoFreeSeats = typeof freeSeatsCount === "number" && freeSeatsCount <= 0;
  const canDownloadReceipt = Boolean(onDownloadReceiptClick) && hasRegisteredPayments(titular);
  const isPaid =
    titular.paymentStatus === PAYMENT_STATUS.PAID ||
    (titular.paidAmount > 0 && titular.balance <= 0);
  const registeredCount = 1 + (titular.companions?.length || 0);
  const missingCount = Math.max(0, titular.groupSize - registeredCount);

  return (
    <div className="space-y-3.5 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
      {/* 1. Cabecera */}
      {/* `min-w-0 flex-1`: el nombre ocupa el espacio libre y hace salto de línea en lugar de
          empujar el estado de pago fuera de la tarjeta. */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
            {getInitials(titular.fullName)}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="line-clamp-2 text-base leading-tight font-bold break-words text-slate-900">
              {titular.fullName}
            </span>
            <span className="text-xs text-slate-500">
              {titular.groupSize > 1 ? "Titular" : "Viajero Individual"}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end text-right">
          {/* Cancelada por el cliente (filtro "Canceladas"): la agencia retiene lo abonado. */}
          {titular.bookingStatus === BOOKING_STATUS.CANCELLED ? (
            <>
              <span className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                CANCELADA
              </span>
              <span className="mt-0.5 text-xs font-bold whitespace-nowrap text-slate-500">
                Retenido: {formatCurrency(titular.paidAmount, { currency: tourCurrency })}
              </span>
            </>
          ) : isPaid ? (
            <>
              <span className="rounded border border-emerald-200 bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                LIQUIDADO
              </span>
              <span className="mt-0.5 text-xs text-slate-400">Sin adeudos</span>
            </>
          ) : (
            <>
              <span className="rounded border border-amber-200 bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap text-amber-800">
                {titular.paidAmount > 0 ? "ABONO PARCIAL" : "SIN PAGO"}
              </span>
              <span className="mt-0.5 text-xs font-bold whitespace-nowrap text-slate-500">
                Debe: {formatCurrency(titular.balance, { currency: tourCurrency })}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Revisión manual de las 48 h (regla 13): solo apartados sin ningún pago. */}
      {titular.paidAmount <= 0 && titular.balance > 0 && (
        <UnpaidHoldAge bookedAt={titular.bookedAt} />
      )}
      {/* Saldo a devolver al titular (baja de un acompañante con retención menor al lugar). */}
      {(titular.refundableSurplus ?? 0) > 0 && (
        <RefundableSurplusBadge
          amount={titular.refundableSurplus ?? 0}
          tourCurrency={tourCurrency}
          className="self-start"
        />
      )}

      {/* 2. Grid 2 columnas (Asiento y Registro) */}
      {requiresSeats && (
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5">
          <div>
            <span className="mb-1 block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Asiento
            </span>
            {titular.seatLabel ? (
              titular.hasSeatRight ? (
                <span className="inline-flex h-6 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 px-2 text-xs font-bold text-indigo-700">
                  {titular.seatLabel}
                </span>
              ) : (
                // Perdió el derecho a asiento: conserva el asiento, pero se señala (decisión del PM).
                <SeatWithoutDepositBadge seatLabel={titular.seatLabel} />
              )
            ) : isAuditMode ? (
              <span className="text-xs font-medium text-slate-400">Sin asiento</span>
            ) : titular.hasSeatRight ? (
              <button
                onClick={() => onAssignSeatClick(titular.id)}
                className="rounded-md border border-indigo-200 bg-white px-2 py-0.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
              >
                [ Asignar Asiento ]
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span>Requiere anticipo</span>
              </span>
            )}
          </div>
          <div>
            <span className="mb-1 block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Registro
            </span>
            <span
              className={`flex items-center gap-1.5 text-xs font-medium ${
                titular.formStatus === FORM_STATUS.COMPLETED ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  titular.formStatus === FORM_STATUS.COMPLETED
                    ? "bg-emerald-500"
                    : "animate-pulse bg-red-500"
                }`}
              />
              {titular.formStatus === FORM_STATUS.COMPLETED ? "Completo" : "Pendiente"}
            </span>
          </div>
        </div>
      )}

      {/* 3. Punto de Abordaje y Contacto */}
      <div className="flex flex-col gap-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-slate-600">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{titular.boardingPoint || "Por definir"}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="font-mono">{formatPhoneForDisplay(titular.whatsapp)}</span>
          </div>
          <div className="flex gap-2">
            <a
              href={buildTelUrl(titular.whatsapp)}
              className="rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200"
            >
              📞
            </a>
            <a
              href={buildWhatsAppUrl(titular.whatsapp)}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-100"
            >
              <WhatsAppIcon
                className="h-4 w-4"
                role="img"
                aria-hidden={false}
                aria-label="WhatsApp"
              />
            </a>
          </div>
        </div>
      </div>

      {/* 4. Acompañantes / Cupos */}
      {titular.groupSize > 1 && (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          {titular.companions?.map((comp) => (
            <div
              key={comp.id}
              className="relative flex flex-col gap-1.5 border-l-2 border-indigo-100 pl-3"
            >
              <span className="absolute top-0 -left-[9px] text-xs text-indigo-300">↳</span>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="block text-sm font-medium break-words text-slate-800">
                    {comp.fullName}
                  </span>
                  <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                    Acompañante de {titular.fullName.split(" ")[0]}
                  </span>
                </div>
                {comp.seatLabel ? (
                  titular.hasSeatRight ? (
                    <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                      {comp.seatLabel}
                    </span>
                  ) : (
                    <SeatWithoutDepositBadge seatLabel={comp.seatLabel} compact />
                  )
                ) : titular.hasSeatRight && !isAuditMode ? (
                  <button
                    onClick={() => onAssignSeatClick(comp.id)}
                    className="rounded-md border border-indigo-200 bg-white px-2 py-0.5 text-[10px] font-medium text-indigo-600 hover:bg-indigo-50"
                  >
                    [ Asignar ]
                  </button>
                ) : null}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400 italic">Cubierto por titular</span>
                {canEditGroup && (onRemovePassengerClick || onTransferPassengerClick) && (
                  <div className="flex items-center gap-1">
                    {onRemovePassengerClick && (
                      <button
                        type="button"
                        onClick={() =>
                          onRemovePassengerClick(comp.bookingId, comp.id, comp.fullName)
                        }
                        aria-label={`Dar de baja a ${comp.fullName}`}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${ROW_ACTION_TONE.remove}`}
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    )}
                    {onTransferPassengerClick && (
                      <TransferMenu
                        label="Transferir lugar"
                        triggerAriaLabel={`Más acciones de ${comp.fullName}`}
                        onSelect={() =>
                          onTransferPassengerClick(
                            comp.bookingId,
                            comp.id,
                            PASSENGER_ROLE.COMPANION,
                            comp.fullName,
                            comp.whatsapp,
                          )
                        }
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Slots fantasma alineados con TravelerGroup */}
          {Array.from({ length: missingCount }).map((_, i) => (
            <div
              key={i}
              className="relative flex items-center justify-between border-l-2 border-indigo-50 py-1 pl-3"
            >
              <span className="absolute top-1 -left-[9px] text-xs text-indigo-200">↳</span>
              <div className="flex flex-col">
                <span className="text-xs font-normal text-slate-500 italic">
                  Acompañante pendiente de registro
                </span>
                <span className="mt-0.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  Lugar reservado #{registeredCount + i + 1}
                </span>
              </div>
              {canEditGroup && onRemoveGhostSlotClick && (
                <button
                  type="button"
                  onClick={() => onRemoveGhostSlotClick(titular.bookingId)}
                  disabled={isRemovingGhost}
                  aria-label="Liberar lugar apartado"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 5. "+ Agregar lugar al grupo": misma condición que `AddSlotRow` en escritorio. */}
      {canAddSlot && (
        <button
          type="button"
          onClick={() => onAddPassengerClick?.(titular)}
          disabled={isAdding || hasNoFreeSeats}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-200 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" />
          <span>+ Agregar lugar al grupo</span>
          {typeof freeSeatsCount === "number" && (
            <span className="rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              {freeSeatsCount} libres
            </span>
          )}
        </button>
      )}

      {/* 6. Botonera Inferior */}
      <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-3">
        {/* Mismas acciones que la fila de escritorio (`TitularRow`). */}
        <div className="flex gap-2">
          {canDownloadReceipt && (
            <button
              type="button"
              onClick={() => onDownloadReceiptClick?.(titular)}
              aria-label="Descargar Comprobante PDF"
              data-tour={TOUR_TARGET.DASHBOARD_ACTION_RECEIPT}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${ROW_ACTION_TONE.receipt}`}
            >
              <FileText className="h-4 w-4" />
            </button>
          )}
          {titular.magicToken && (
            <button
              type="button"
              onClick={(event) => void copyMagicLink(event, titular.magicToken)}
              aria-label="Copiar Magic Link"
              data-tour={TOUR_TARGET.DASHBOARD_ACTION_MAGIC_LINK}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${ROW_ACTION_TONE.magicLink}`}
            >
              <Link2 className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onRowClick?.(titular.id)}
            aria-label="Registrar abonos y pagos"
            data-tour={TOUR_TARGET.DASHBOARD_ACTION_PAYMENTS}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${ROW_ACTION_TONE.payments}`}
          >
            <WalletCards className="h-4 w-4" />
          </button>
        </div>
        {canEditGroup && onTransferPassengerClick && (
          <TransferMenu
            label="Transferir titularidad"
            triggerAriaLabel="Más acciones del titular"
            guideTarget={TOUR_TARGET.DASHBOARD_ACTION_TRANSFER}
            onSelect={() =>
              onTransferPassengerClick(
                titular.bookingId,
                titular.id,
                PASSENGER_ROLE.TITULAR,
                titular.fullName,
                titular.whatsapp,
              )
            }
          />
        )}
      </div>
    </div>
  );
}
