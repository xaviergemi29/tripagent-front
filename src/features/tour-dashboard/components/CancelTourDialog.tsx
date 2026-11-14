"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  type Currency,
  TOUR_CANCELLATION_NOTE_MAX_LENGTH,
  TOUR_CANCELLATION_REASONS,
  type TourCancellationReason,
} from "@/shared/constants/domain.constants";
import { TOUR_CANCELLATION_REASON_DICT } from "@/shared/utils/config/status-dictionaries.config";
import { formatCurrency } from "@/shared/utils/currency.util";
import { useCancelTour } from "../hooks/useTourDashboard";

interface CancelTourDialogProps {
  tourId: string;
  tourTitle: string;
  /** Reservas activas que se cancelarán. */
  activeBookings: number;
  /** Dinero cobrado en el tour (KPI del Centro de Control): lo que habrá que reembolsar. */
  collectedAmount: number;
  currency: Currency;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Cancelación del tour por la agencia (decisión del PM, 2026-11-14): motivo de una lista fija y nota
 * interna opcional. Es definitiva: cancela todas las reservas sin penalización, libera los asientos
 * y deja lo abonado como saldo a reembolsar.
 */
export function CancelTourDialog({
  tourId,
  tourTitle,
  activeBookings,
  collectedAmount,
  currency,
  open,
  onOpenChange,
}: CancelTourDialogProps) {
  const [reason, setReason] = useState<TourCancellationReason | null>(null);
  const [note, setNote] = useState("");
  const { mutate: cancelTour, isPending } = useCancelTour();

  const close = (nextOpen: boolean) => {
    if (!nextOpen) {
      setReason(null);
      setNote("");
    }
    onOpenChange(nextOpen);
  };

  const handleConfirm = () => {
    if (!reason) return;
    cancelTour({ tourId, reason, note: note.trim() || null }, { onSuccess: () => close(false) });
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Cancelar tour
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            «{tourTitle}» quedará cancelado de forma definitiva.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-1.5 rounded-xl border border-red-100 bg-red-50/60 p-3.5 text-xs text-red-900">
          <li>
            • Se cancelarán <strong>{activeBookings}</strong> reserva(s) sin penalización y se
            liberarán sus asientos.
          </li>
          <li>
            • El folleto deja de publicarse y el tour pasa a solo lectura, salvo para registrar
            reembolsos.
          </li>
          <li>
            • Dinero cobrado por reembolsar:{" "}
            <strong>{formatCurrency(collectedAmount, { currency })}</strong>. Regístralo en
            &quot;Reembolsos&quot; conforme lo transfieras.
          </li>
        </ul>

        <fieldset className="space-y-2">
          <legend className="text-xs font-bold tracking-wider text-slate-700 uppercase">
            Motivo de la cancelación *
          </legend>
          <div role="radiogroup" className="grid gap-2">
            {TOUR_CANCELLATION_REASONS.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={reason === option}
                onClick={() => setReason(option)}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                  reason === option
                    ? "border-red-400 bg-red-50 font-semibold text-red-800 ring-1 ring-red-300"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50",
                )}
              >
                {TOUR_CANCELLATION_REASON_DICT[option]}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">
            El viajero verá este motivo en su enlace de reserva.
          </p>
        </fieldset>

        <div className="space-y-1.5">
          <Label htmlFor="cancel-note" className="text-xs font-semibold text-slate-700">
            Nota interna <span className="font-normal text-slate-400">(opcional)</span>
          </Label>
          <Textarea
            id="cancel-note"
            value={note}
            maxLength={TOUR_CANCELLATION_NOTE_MAX_LENGTH}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej. Protección Civil cerró el acceso a la sierra"
            className="min-h-[72px] text-sm"
          />
          <p className="flex justify-between text-[11px] text-slate-500">
            <span>Solo la ve tu equipo.</span>
            <span>
              {note.length} / {TOUR_CANCELLATION_NOTE_MAX_LENGTH}
            </span>
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => close(false)} disabled={isPending}>
            Volver
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!reason || isPending}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancelar tour definitivamente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
