"use client";

import { useState } from "react";
import {
  X,
  User,
  AlertTriangle,
  DollarSign,
  CheckSquare,
  Square,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCancelPassenger } from "@/features/external-registration/hooks/useBookings";
import { RegisterPaymentModal } from "./RegisterPaymentModal";
import { useVoidPayment } from "../hooks/usePayments";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export type PaymentRecordDTO = {
  id: string;
  amount: number;
  method: string;
  type: string;
  createdAt: string;
  referenceInfo?: string;
};

interface TravelerInfo {
  id: string;
  fullName: string;
  whatsapp: string;
  role: "TITULAR" | "COMPANION";
  bookingId: string;
  paymentStatus: string;
  paidAmount: number;
  unitPrice: number;
  balance: number;
  payments?: PaymentRecordDTO[];
}

interface Props {
  tourId: string;
  traveler: TravelerInfo | null;
  isOpen: boolean;
  onClose: () => void;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "EFECTIVO",
  TRANSFER: "SPEI",
  CARD: "TARJETA",
  OTHER: "OTRO",
};

export function TravelerDetailDrawer({ tourId, traveler, isOpen, onClose }: Props) {
  const [manualPenalty, setManualPenalty] = useState<string>("0");
  const [showCancellationConfirm, setShowCancellationConfirm] = useState(false);
  const [isFullRetention, setIsFullRetention] = useState(true);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const { mutate: cancelPassenger, isPending } = useCancelPassenger();
  const { mutate: voidPayment, isPending: isVoiding } = useVoidPayment(tourId);

  const [paymentToVoid, setPaymentToVoid] = useState<PaymentRecordDTO | null>(null);
  const [correctionData, setCorrectionData] = useState<{ amount: number; method: string } | null>(
    null,
  );

  if (!isOpen || !traveler) return null;

  const isTitular = traveler.role === "TITULAR";

  // Identificar qué IDs de pagos originales fueron anulados mediante su referencia en los registros de compensación
  const voidedOriginalIds = new Set(
    traveler.payments
      ?.filter((p) => p.type === "REFUND" && p.referenceInfo?.includes("Ref:"))
      .map((p) => {
        const match = p.referenceInfo?.match(/Ref:\s*([a-f0-9-]+)/i);
        return match ? match[1] : null;
      })
      .filter(Boolean),
  );

  const handleVoidOnly = () => {
    if (!paymentToVoid) return;
    voidPayment(
      {
        bookingId: traveler.bookingId,
        paymentId: paymentToVoid.id,
        data: { reason: "Anulación directa" },
      },
      { onSuccess: () => setPaymentToVoid(null) },
    );
  };

  const handleVoidAndCorrect = () => {
    if (!paymentToVoid) return;
    voidPayment(
      {
        bookingId: traveler.bookingId,
        paymentId: paymentToVoid.id,
        data: { reason: "Anulación para corrección" },
      },
      {
        onSuccess: () => {
          setCorrectionData({ amount: paymentToVoid.amount, method: paymentToVoid.method });
          setPaymentToVoid(null);
          setOpenPaymentModal(true);
        },
      },
    );
  };

  const handleConfirmCancellation = (): void => {
    const penaltyAmount = isFullRetention ? traveler.unitPrice : parseFloat(manualPenalty) || 0;

    cancelPassenger(
      {
        bookingId: traveler.bookingId,
        travelerId: traveler.id,
        penaltyAmount,
      },
      {
        onSuccess: () => {
          onClose();
          setShowCancellationConfirm(false);
          setIsFullRetention(true);
        },
      },
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex justify-end bg-slate-900/20 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="animate-in slide-in-from-right flex h-full w-full max-w-md flex-col bg-white shadow-2xl duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. CABECERA */}
          <div className="flex shrink-0 items-center justify-between border-b p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                <User className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{traveler.fullName}</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-full text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                    title="Editar Datos"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs font-semibold text-slate-500 uppercase">
                  {isTitular ? "Titular de Reserva" : "Acompañante"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* ÁREA DE SCROLL PRINCIPAL */}
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {/* LOGÍSTICA Y CONTACTO */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase">
                Logística y Contacto
              </h3>
              <div className="space-y-1 rounded-xl border bg-slate-50 p-4 text-sm">
                <p className="text-slate-600">
                  WhatsApp:{" "}
                  <span className="font-semibold text-slate-900">{traveler.whatsapp}</span>
                </p>
              </div>
            </section>

            {/* ESTADO DE CUENTA E HISTORIAL (Solo Titular) */}
            {isTitular && (
              <section className="space-y-4 border-t border-slate-200 pt-4">
                <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase">
                  Estado de Cuenta
                </h3>

                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Costo Total</p>
                      <p className="text-lg font-bold text-slate-900">
                        ${traveler.paidAmount + traveler.balance}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-500">Falta por pagar</p>
                      <p className="text-lg font-bold text-orange-600">${traveler.balance}</p>
                    </div>
                  </div>
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-2.5 bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${(traveler.paidAmount / (traveler.paidAmount + traveler.balance)) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <div className="text-xs font-medium text-slate-600">
                    Abonado:{" "}
                    <span className="font-bold text-emerald-700">${traveler.paidAmount}</span>
                  </div>
                </div>

                {traveler?.balance > 0 && (
                  <Button
                    className="h-12 w-full bg-emerald-600 text-base font-bold text-white shadow-sm hover:bg-emerald-700"
                    onClick={() => setOpenPaymentModal(true)}
                  >
                    💲 Registrar Abono
                  </Button>
                )}

                {/* HISTORIAL DE MOVIMIENTOS REFACTORIZADO */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase">
                    Historial de Movimientos
                  </h4>
                  {traveler?.payments?.map((payment) => {
                    const isNegative = payment.amount < 0;
                    const isVoided = voidedOriginalIds.has(payment.id);

                    return (
                      <div
                        key={payment.id}
                        className={`flex items-center justify-between rounded-lg border p-3 text-sm transition-colors ${
                          isVoided ? "bg-slate-50 opacity-60" : "bg-white"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p
                              className={`font-semibold ${isVoided ? "text-slate-500 line-through" : isNegative ? "text-red-600" : "text-slate-800"}`}
                            >
                              ${payment.amount}
                            </p>
                            {isVoided && (
                              <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                                Anulado
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            {PAYMENT_METHOD_LABELS[payment.method] || payment.method} •{" "}
                            {new Date(payment.createdAt).toLocaleString("es-MX", {
                              weekday: "short",
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        {/* REG LA UX: Ocultar botón de anular si el monto es negativo o si ya fue anulado */}
                        {!isNegative && !isVoided && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="group h-8 w-8 rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            onClick={() => setPaymentToVoid(payment)}
                            title="Anular abono"
                          >
                            <Trash2 className="h-4 w-4 transition-transform group-hover:scale-110" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                  {(!traveler.payments || traveler.payments.length === 0) && (
                    <p className="py-2 text-center text-xs text-slate-400 italic">
                      Sin abonos registrados
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* SEPARADOR VISUAL Y ZONA CRÍTICA */}
            <div className="pt-8">
              <hr className="mb-8 border-slate-200" />

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold tracking-wider text-red-600 uppercase">
                  <AlertTriangle className="h-4 w-4" /> Peligro
                </div>

                {!showCancellationConfirm ? (
                  <div className="space-y-1.5">
                    <Button
                      variant="outline"
                      className="w-full border-red-200 font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setShowCancellationConfirm(true)}
                    >
                      {isTitular ? "Cancelar Reserva Completa" : "Dar de baja a pasajero"}
                    </Button>

                    {!isTitular && (
                      <p className="text-center text-[11px] leading-tight text-slate-400">
                        El costo total de la reserva de {traveler.fullName} se recalculará
                        automáticamente.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="animate-in fade-in space-y-4 rounded-lg border border-red-200 bg-white p-4 shadow-sm duration-200">
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-slate-800">Confirmar Cancelación</p>
                      <label className="group mt-3 flex cursor-pointer items-start gap-2 rounded p-2 transition-colors hover:bg-slate-50">
                        <div className="mt-0.5 text-red-600">
                          {isFullRetention ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </div>
                        <div
                          className="flex-1"
                          onClick={() => setIsFullRetention(!isFullRetention)}
                        >
                          <p className="text-xs font-bold text-slate-800">
                            Aplicar política "Sin Devolución"
                          </p>
                          <p className="text-[11px] leading-tight text-slate-500">
                            Se retendrá el 100% del costo del asiento.
                          </p>
                        </div>
                      </label>
                      {!isFullRetention && (
                        <div className="animate-in slide-in-from-top-2 pt-2">
                          <label className="text-xs font-bold text-slate-700">
                            Retención manual (MXN)
                          </label>
                          <div className="relative mt-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                            </div>
                            <input
                              type="number"
                              min="0"
                              value={manualPenalty}
                              onChange={(e) => setManualPenalty(e.target.value)}
                              className="w-full rounded border border-slate-300 py-1.5 pr-3 pl-8 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 border-t border-slate-100 pt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full text-slate-600"
                        onClick={() => setShowCancellationConfirm(false)}
                      >
                        Volver
                      </Button>
                      <Button
                        size="sm"
                        className="w-full bg-red-600 text-white hover:bg-red-700"
                        disabled={isPending}
                        onClick={handleConfirmCancellation}
                      >
                        Confirmar Baja
                      </Button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>

      {isTitular && traveler && (
        <RegisterPaymentModal
          isOpen={openPaymentModal}
          onClose={() => {
            setOpenPaymentModal(false);
            setCorrectionData(null);
          }}
          bookingId={traveler.bookingId}
          tourId={tourId}
          balance={traveler.balance}
          correctionData={correctionData}
        />
      )}

      {/* 2. MODAL DE ANULACIÓN (Ajustes de Microcopy & UX) */}
      <Dialog open={!!paymentToVoid} onOpenChange={(open) => !open && setPaymentToVoid(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Anular Abono
            </DialogTitle>
            <DialogDescription asChild className="space-y-2 pt-2 text-base text-slate-600">
              <div>
                <p>
                  ¿Deseas anular este abono de{" "}
                  <span className="font-bold text-slate-900">${paymentToVoid?.amount}</span>?
                </p>
                <p className="rounded border bg-slate-100 p-2.5 text-xs text-slate-500">
                  ℹ️ Esta acción restará <strong>${paymentToVoid?.amount}</strong> del saldo abonado
                  de <strong>{traveler.fullName}</strong>.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 pt-4 sm:flex-row sm:gap-0">
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={handleVoidOnly}
              disabled={isVoiding}
            >
              Anular definitivamente
            </Button>
            <Button
              className="bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={handleVoidAndCorrect}
              disabled={isVoiding}
            >
              {isVoiding ? "Procesando..." : "Anular y volver a capturar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
