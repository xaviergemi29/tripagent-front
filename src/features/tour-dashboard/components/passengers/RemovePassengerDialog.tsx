"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/shared/NumericInput";
import { summarizeCompanionDrop } from "@/features/tour-dashboard/utils/dashboard-travelers.util";
import { type Currency, DEFAULT_CURRENCY } from "@/shared/constants/domain.constants";
import { formatCurrency } from "@/shared/utils/currency.util";

interface RemovePassengerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Recibe la retención para la agencia capturada (0 … precio del lugar). */
  onConfirm: (penaltyAmount: number) => void;
  passengerName?: string;
  /** Asiento del acompañante, que quedará libre (null si no tiene). */
  seatLabel?: string | null;
  /** Precio pactado del lugar (`unitPrice` del titular). */
  unitPrice?: number;
  /** Total vigente de la reserva (`getGroupTotal`). */
  currentTotal?: number;
  /** Lo que el grupo ya abonó (no cambia con la baja). */
  paidAmount?: number;
  isSubmitting?: boolean;
  tourCurrency?: Currency;
}

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
  isSubmitting,
  tourCurrency,
}: RemovePassengerDialogProps) {
  const [penaltyAmount, setPenaltyAmount] = useState(0);
  const currency = tourCurrency ?? DEFAULT_CURRENCY;
  const money = (value: number) => formatCurrency(value, { currency });

  const penaltyError =
    penaltyAmount < 0
      ? "La retención no puede ser negativa."
      : penaltyAmount > unitPrice + 0.005
        ? `No puede superar el costo del lugar (${money(unitPrice)}).`
        : null;
  const preview = summarizeCompanionDrop({
    currentTotal,
    unitPrice,
    penaltyAmount: penaltyError ? 0 : penaltyAmount,
    amountPaid: paidAmount,
  });

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            ¿Dar de baja a este acompañante?
          </AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{passengerName}</strong> deja el grupo y su lugar ({money(unitPrice)}) se
            descuenta del total.{" "}
            {seatLabel ? (
              <>
                El asiento <strong>{seatLabel}</strong> quedará libre.
              </>
            ) : (
              "No tiene asiento asignado."
            )}{" "}
            Lo ya abonado no cambia.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="companion-drop-penalty">Retención para la agencia ({currency})</Label>
          <NumericInput
            id="companion-drop-penalty"
            min={0}
            max={unitPrice}
            step="0.01"
            value={penaltyAmount}
            onValueChange={setPenaltyAmount}
            placeholder="0"
            aria-invalid={!!penaltyError}
            aria-describedby="companion-drop-penalty-help"
          />
          <p
            id="companion-drop-penalty-help"
            className={`text-xs ${penaltyError ? "font-medium text-red-600" : "text-slate-500"}`}
          >
            {penaltyError ?? `De $0 hasta el costo del lugar (${money(unitPrice)}).`}
          </p>
        </div>

        <dl
          aria-label="Desglose de la baja"
          className="space-y-1.5 rounded-lg border bg-slate-50 p-3 text-sm"
        >
          <div className="flex justify-between gap-3">
            <dt className="text-slate-600">Costo del lugar dado de baja</dt>
            <dd className="font-semibold text-slate-900">-{money(unitPrice)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-600">Retención para la agencia</dt>
            <dd className="font-semibold text-slate-900">
              +{money(penaltyError ? 0 : penaltyAmount)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-600">
              Monto no retenido
              <span className="block text-xs text-slate-500">
                {preview.refundableSurplus > 0
                  ? `Genera ${money(preview.refundableSurplus)} a devolver al titular`
                  : preview.nonRetainedAmount > 0
                    ? "Se descuenta del saldo pendiente del grupo"
                    : "La agencia retiene el lugar completo"}
              </span>
            </dt>
            <dd className="font-semibold text-slate-900">{money(preview.nonRetainedAmount)}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t pt-1.5">
            <dt className="font-medium text-slate-700">Nuevo total de la reserva</dt>
            <dd className="font-bold text-slate-900">{money(preview.newTotal)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-medium text-slate-700">Nuevo saldo por cobrar</dt>
            <dd className="font-bold text-orange-600">{money(preview.pendingBalance)}</dd>
          </div>
        </dl>

        {preview.refundableSurplus > 0 && (
          <p
            role="note"
            className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
          >
            El grupo ya abonó <strong>{money(paidAmount)}</strong>. Quedarán{" "}
            <strong>{money(preview.refundableSurplus)}</strong> a devolver al titular; regístralo en
            su estado de cuenta con «Registrar devolución».
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Volver</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              if (penaltyError) return;
              onConfirm(penaltyAmount);
            }}
            disabled={isSubmitting || !!penaltyError}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? "Cancelando..." : "Confirmar Baja"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
