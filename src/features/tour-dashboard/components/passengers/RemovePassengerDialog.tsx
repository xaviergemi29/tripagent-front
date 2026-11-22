"use client";

import { useState } from "react";
import { AlertCircle, Info, UserMinus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/shared/NumericInput";
import { summarizeCompanionDrop } from "@/features/tour-dashboard/utils/dashboard-travelers.util";
import { type Currency, DEFAULT_CURRENCY } from "@/shared/constants/domain.constants";
import { formatCurrency } from "@/shared/utils/currency.util";
import { cn } from "@/lib/utils";

interface RemovePassengerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Recibe la retención para la agencia capturada (0 … precio del lugar) y la divisa del tour. */
  onConfirm: (penaltyAmount: number, currency: Currency) => void;
  passengerName?: string;
  /** Asiento del acompañante, que quedará libre (null si no tiene). */
  seatLabel?: string | null;
  /** Precio pactado del lugar (`unitPrice` del titular). */
  unitPrice?: number;
  /** Total vigente de la reserva (`getGroupTotal`). */
  currentTotal?: number;
  /** Lo que el grupo ya abonó (no cambia con la baja). */
  paidAmount?: number;
  /** Lugares activos del grupo (`groupSize`); opcional, para "Nuevo total (N viajeros)". */
  passengersCount?: number;
  isSubmitting?: boolean;
  tourCurrency?: Currency;
}

/** Redondeo a centavos: los botones rápidos no pueden perder decimales (1,333.33 × 25 %). */
const roundMoney = (value: number): number => Math.round(value * 100) / 100;

const CHIPS = [
  { label: "0%", ratio: 0 },
  { label: "25%", ratio: 0.25 },
  { label: "50%", ratio: 0.5 },
  { label: "Total", ratio: 1 },
] as const;

/**
 * Baja de un acompañante con retención para la agencia (FLUJO-RES-004 / PQ-C5, 2026-11-17). El
 * desglose es una vista previa (`summarizeCompanionDrop`, espejo de la API); la API aplica la regla
 * y valida el tope. Montar con `key` por pasajero para que la retención empiece en $0.
 */
export function RemovePassengerDialog({
  isOpen,
  onClose,
  onConfirm,
  passengerName,
  seatLabel,
  unitPrice = 0,
  currentTotal = 0,
  paidAmount = 0,
  passengersCount,
  isSubmitting = false,
  tourCurrency,
}: RemovePassengerDialogProps) {
  const [penaltyAmount, setPenaltyAmount] = useState(0);
  const currency = tourCurrency ?? DEFAULT_CURRENCY;
  const money = (value: number) => formatCurrency(value, { currency });

  const isValid = penaltyAmount >= 0 && penaltyAmount <= unitPrice + 0.005;
  const errorMessage = isValid
    ? null
    : penaltyAmount < 0
      ? "La retención no puede ser negativa."
      : `La retención no puede superar el costo del lugar (${money(unitPrice)}).`;
  const preview = summarizeCompanionDrop({
    currentTotal,
    unitPrice,
    penaltyAmount: isValid ? penaltyAmount : 0,
    amountPaid: paidAmount,
  });
  const remaining = passengersCount === undefined ? null : Math.max(1, passengersCount - 1);
  const isPaidExact = preview.pendingBalance === 0 && preview.refundableSurplus === 0;

  // Con la petición en curso no se cierra: la baja ya salió y el resultado debe verse.
  const guardClose = (event: Event) => {
    if (isSubmitting) event.preventDefault();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        onInteractOutside={guardClose}
        onEscapeKeyDown={guardClose}
        className="max-h-[92vh] gap-0 overflow-y-auto rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl sm:max-w-xl md:p-8"
      >
        <button
          type="button"
          aria-label="Cerrar"
          disabled={isSubmitting}
          onClick={onClose}
          className="absolute top-6 right-6 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <DialogHeader className="flex-row items-start gap-3 pr-10">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <UserMinus className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">
              ¿Dar de baja a {passengerName}?
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs leading-relaxed text-slate-500 md:text-sm">
              Al confirmar, su lugar se descontará del total de la reserva. Lo ya abonado por el
              grupo no se modifica.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="my-5 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 md:grid-cols-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Acompañante
            </p>
            <p className="truncate text-sm font-bold text-slate-800">{passengerName}</p>
            {seatLabel ? (
              <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-indigo-200/60 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                • Asiento #{seatLabel}
              </span>
            ) : (
              <span className="mt-1 inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                Sin asiento asignado
              </span>
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Costo de su lugar
            </p>
            <p className="text-sm font-bold text-slate-800">{money(unitPrice)}</p>
            <p className="text-[11px] text-slate-400">1 boleto individual</p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Abonado del grupo
            </p>
            <p className="text-sm font-bold text-emerald-600">{money(paidAmount)}</p>
            <p className="text-[11px] text-slate-400">
              Total inicial: {money(currentTotal)}
              {currentTotal > 0 && paidAmount >= currentTotal ? " (100% cubierto)" : ""}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <Label
              htmlFor="companion-drop-penalty"
              className="text-xs font-bold tracking-wide text-slate-700 uppercase"
            >
              Retención para la agencia
            </Label>
            <span className="text-xs font-medium text-slate-400">Tope máx: {money(unitPrice)}</span>
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-base font-bold text-slate-500">
              $
            </span>
            <NumericInput
              id="companion-drop-penalty"
              min={0}
              max={unitPrice}
              step="0.01"
              value={penaltyAmount}
              onValueChange={setPenaltyAmount}
              placeholder="0"
              disabled={isSubmitting}
              aria-label="Retención para la agencia"
              aria-invalid={!isValid}
              aria-describedby={errorMessage ? "companion-drop-penalty-error" : undefined}
              className={cn(
                "h-11 pr-16 pl-7 text-base sm:text-sm",
                !isValid &&
                  "border-red-500 bg-red-50/40 text-red-900 focus-visible:border-red-600 focus-visible:ring-red-200",
              )}
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-bold text-slate-400">
              {currency}
            </span>
          </div>
          {errorMessage && (
            <p
              id="companion-drop-penalty-error"
              role="alert"
              className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errorMessage}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
              Rápidos:
            </span>
            {CHIPS.map(({ label, ratio }) => {
              const value = roundMoney(unitPrice * ratio);
              const isActive = isValid && Math.abs(penaltyAmount - value) < 0.005;
              return (
                <button
                  key={label}
                  type="button"
                  disabled={isSubmitting}
                  aria-pressed={isActive}
                  onClick={() => setPenaltyAmount(value)}
                  className={cn(
                    "rounded-xl border px-3 py-1.5 text-xs transition-colors disabled:opacity-50",
                    isActive
                      ? "border-2 border-indigo-600 bg-indigo-50 font-bold text-indigo-700"
                      : "border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50",
                  )}
                >
                  {ratio === 0 ? "$0 (0%)" : `${money(value)} (${label})`}
                </button>
              );
            })}
          </div>
        </div>

        <div className="my-4 space-y-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
          <dl aria-label="Desglose de la baja" className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-600">Costo del lugar dado de baja</dt>
              <dd className="font-semibold text-slate-700">-{money(unitPrice)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-600">
                <span className="text-amber-600">• </span>Retención para la agencia
              </dt>
              <dd className={isValid ? "font-bold text-amber-700" : "font-bold text-red-600"}>
                {isValid ? `+${money(penaltyAmount)}` : `${money(penaltyAmount)} (Inválido)`}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-600">
                Monto descontado (no retenido)
                <span className="block text-xs text-slate-500">
                  Se resta del total de la reserva
                </span>
              </dt>
              <dd className="font-bold text-slate-800">
                {isValid ? `-${money(preview.nonRetainedAmount)}` : "--"}
              </dd>
            </div>
          </dl>

          <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Nuevo total de la reserva
                {remaining !== null &&
                  ` (${remaining} ${remaining === 1 ? "viajero" : "viajeros"})`}
                :
              </p>
              <p className="mt-1 text-base font-extrabold text-slate-900">
                {isValid ? money(preview.newTotal) : "--"}
              </p>
            </div>
            {!isValid ? (
              <div className="rounded-xl border border-red-200 bg-red-50/60 p-3">
                <p className="text-xs font-bold text-red-600">Corrige el monto ingresado</p>
                <p className="text-[10px] text-red-500">Cálculo en pausa por validación</p>
              </div>
            ) : preview.refundableSurplus > 0 ? (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50/90 p-3">
                <p className="text-xs font-bold text-emerald-800">Saldo a favor del cliente:</p>
                <p className="mt-1 text-base font-extrabold text-emerald-700">
                  {money(preview.refundableSurplus)}
                </p>
                <p className="mt-0.5 text-[10px] font-medium text-emerald-700/90">
                  Lo abonado supera el nuevo total; podrás registrar la devolución después.
                </p>
              </div>
            ) : isPaidExact ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                <p className="text-xs font-semibold text-emerald-800">Estado de cuenta:</p>
                <p className="mt-1 text-base font-extrabold text-emerald-700">
                  {money(0)} · Liquidado
                </p>
                <p className="mt-0.5 text-[10px] text-emerald-600">
                  Sin adeudo pendiente ni saldos por devolver.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold text-indigo-700">Nuevo saldo por cobrar:</p>
                <p className="mt-1 text-base font-extrabold text-indigo-700">
                  {money(preview.pendingBalance)}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="my-4 flex items-start gap-2.5 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed text-amber-800">
            {seatLabel ? (
              <>
                El <strong className="font-bold">asiento #{seatLabel}</strong> quedará libre y se
                habilitará 1 lugar disponible en el tour y su folleto digital.
              </>
            ) : (
              "Se habilitará 1 lugar disponible en el tour y su folleto digital."
            )}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Volver sin cambios
          </button>
          <button
            type="button"
            disabled={!isValid || isSubmitting}
            onClick={() => isValid && onConfirm(penaltyAmount, currency)}
            className="flex items-center rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-rose-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:opacity-70 disabled:shadow-none disabled:hover:bg-slate-200"
          >
            <UserMinus className="mr-1.5 h-4 w-4" />
            {isSubmitting ? "Dando de baja..." : "Confirmar baja"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
