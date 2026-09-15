"use client";

import { useState } from "react";
import { X, User, AlertTriangle, DollarSign, CheckSquare, Square, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCancelPassenger } from "@/features/external-registration/hooks/useBookings";
import { RegisterPaymentModal } from "./RegisterPaymentModal";

export type PaymentRecordDTO = {
  id: string;
  amount: number;
  method: string;
  type: string;
  createdAt: string;
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

  if (!isOpen || !traveler) return null;

  const isTitular = traveler.role === "TITULAR";

  console.log("openPaymentModal", openPaymentModal)
  const handleConfirmCancellation = (): void => {

    // Aquí simulamos que el costo del boleto lo tienes disponible. Si no, lo debes enviar como cálculo.
    const penaltyAmount = isFullRetention
      ? traveler.unitPrice // 💡 TRUCO: Puedes enviar un número muy alto y en el BE (Math.min) toparlo al unitPrice, o mejor, calcularlo exacto.
      : parseFloat(manualPenalty) || 0;

    cancelPassenger(
      {
        bookingId: traveler.bookingId,
        travelerId: traveler.id,
        penaltyAmount
      },
      {
        onSuccess: () => {
          onClose();
          setShowCancellationConfirm(false);
          setIsFullRetention(true);
        }
      }
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/20 backdrop-blur-sm" onClick={onClose}>
        <div
          className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
          onClick={e => e.stopPropagation()}
        >
          {/* 1. CABECERA CON ICONO DE EDICIÓN */}
          <div className="flex justify-between items-center p-6 border-b shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-lg text-slate-900">{traveler.fullName}</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full shrink-0"
                    title="Editar Datos"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500 uppercase font-semibold">
                  {isTitular ? "Titular de Reserva" : "Acompañante"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
          </div>

          {/* ÁREA DE SCROLL PRINCIPAL */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* 2. LOGÍSTICA Y CONTACTO (Sin montos financieros) */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Logística y Contacto</h3>
              <div className="bg-slate-50 p-4 rounded-xl text-sm border space-y-1">
                <p className="text-slate-600">WhatsApp: <span className="font-semibold text-slate-900">{traveler.whatsapp}</span></p>
                {/* Aquí insertarás Correo o Punto de Abordaje a futuro */}
              </div>
            </section>

            {/* 3, 4 y 5. ESTADO DE CUENTA, CTA E HISTORIAL (Solo Titular) */}
            {isTitular && (
              <section className="space-y-4 pt-4 border-t border-slate-200">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Estado de Cuenta</h3>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Costo Total</p>
                      <p className="text-lg font-bold text-slate-900">${traveler.paidAmount + traveler.balance}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-500">Falta por pagar</p>
                      <p className="text-lg font-bold text-orange-600">${traveler.balance}</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-2.5 transition-all duration-500"
                      style={{ width: `${(traveler.paidAmount / (traveler.paidAmount + traveler.balance)) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs font-medium text-slate-600">
                    Abonado: <span className="text-emerald-700 font-bold">${traveler.paidAmount}</span>
                  </div>
                </div>

                {traveler?.balance > 0 && (
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base h-12 shadow-sm"
                    onClick={() => setOpenPaymentModal(true)}
                  >
                    💲 Registrar Abono
                  </Button>
                )}

                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase">Historial de Movimientos</h4>
                  {traveler?.payments?.map(payment => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-white border rounded-lg text-sm">
                      <div>
                        <p className="font-semibold text-slate-800">${payment.amount}</p>
                        <p className="text-xs text-slate-500">{PAYMENT_METHOD_LABELS[payment.method] || payment.method} • {
                          new Date(payment.createdAt).toLocaleString("es-MX", {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        }</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          if (confirm(`¿Estás seguro de anular este abono de $${payment.amount}? Esta acción recalculará la deuda del cliente.`)) {
                            // Invocar mutación de anulación de pago aquí
                          }
                        }}
                      >
                        Anular
                      </Button>
                    </div>
                  ))}
                  {(!traveler.payments || traveler.payments.length === 0) && (
                    <p className="text-xs text-slate-400 italic text-center py-2">Sin abonos registrados</p>
                  )}
                </div>
              </section>
            )}

            {/* SEPARADOR VISUAL Y ZONA CRÍTICA */}
            <div className="pt-8">
              <hr className="border-slate-200 mb-8" />

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-red-600 font-bold text-sm uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" /> Peligro
                </div>

                {!showCancellationConfirm ? (
                  <div className="space-y-1.5">
                    <Button
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-medium"
                      onClick={() => setShowCancellationConfirm(true)}
                    >
                      {isTitular ? "Cancelar Reserva Completa" : "Dar de baja a pasajero"}
                    </Button>

                    {/* 💡 HELPER TEXT OPERATIVO PARA ACOMPAÑANTES */}
                    {!isTitular && (
                      <p className="text-[11px] text-slate-400 text-center leading-tight">
                        El costo total de la reserva de {traveler.fullName} se recalculará automáticamente.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 bg-white p-4 rounded-lg border border-red-200 shadow-sm animate-in fade-in duration-200">
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-slate-800">Confirmar Cancelación</p>
                      <label className="flex items-start gap-2 cursor-pointer group mt-3 p-2 rounded hover:bg-slate-50 transition-colors">
                        <div className="mt-0.5 text-red-600">
                          {isFullRetention ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </div>
                        <div className="flex-1" onClick={() => setIsFullRetention(!isFullRetention)}>
                          <p className="text-xs font-bold text-slate-800">Aplicar política "Sin Devolución"</p>
                          <p className="text-[11px] text-slate-500 leading-tight">Se retendrá el 100% del costo del asiento.</p>
                        </div>
                      </label>
                      {!isFullRetention && (
                        <div className="pt-2 animate-in slide-in-from-top-2">
                          <label className="text-xs font-bold text-slate-700">Retención manual (MXN)</label>
                          <div className="relative mt-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                            </div>
                            <input
                              type="number"
                              min="0"
                              value={manualPenalty}
                              onChange={(e) => setManualPenalty(e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                      <Button size="sm" variant="ghost" className="w-full text-slate-600" onClick={() => setShowCancellationConfirm(false)}>Volver</Button>
                      <Button size="sm" className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={isPending} onClick={handleConfirmCancellation}>
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
          onClose={() => setOpenPaymentModal(false)}
          bookingId={traveler.bookingId}
          tourId={tourId}
          balance={traveler.balance}
        />
      )}
    </>
  );
}