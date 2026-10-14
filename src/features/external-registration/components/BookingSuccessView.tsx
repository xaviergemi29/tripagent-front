"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Copy,
  Clock,
  HelpCircle,
  MessageCircle,
  AlertCircle,
  Users,
  MapPin,
  Calendar,
  Building2,
  CreditCard,
  Banknote,
  ExternalLink,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { copyToClipboard } from "@/shared/utils/clipboard";
import { formatPickupTime, formatSpanishLongDate } from "@/shared/utils/tour-date.util";

interface PassengerDTO {
  name: string;
  isTitular: boolean;
  boardingPoint: string | null;
}

interface BookingSuccessViewProps {
  booking: {
    bookingId: string;
    agencyName: string;
    agencyPhone: string;
    titularName?: string;
    companionNames?: string[];
    passengers?: PassengerDTO[];
    totalAmount: number;
    depositAmount: number | null;
    acceptsBankTransfer: boolean;
    bankName: string | null;
    accountHolder: string | null;
    clabeNumber: string | null;
    acceptsCreditCard: boolean;
    paymentLink: string | null;
    acceptsCash: boolean;
    cashInstructions: string | null;
  };
  tourInfo: { title: string; departureDateTime: string };
  titularName: string;
}

function parseBoardingPoint(rawString: string | null | undefined) {
  if (!rawString) return { location: "Punto de abordaje por confirmar", time: null };
  const match = rawString.match(/(.*?)\s*\((.*?)\)/);
  if (match) {
    return { location: match[1].trim(), time: match[2].trim() };
  }
  return { location: rawString, time: null };
}

export function BookingSuccessView({ booking, tourInfo, titularName }: BookingSuccessViewProps) {
  const [isCopied, setIsCopied] = useState(false);

  const hasAdvancePayment = Boolean(booking.depositAmount && booking.depositAmount > 0);
  const amountDueToday = hasAdvancePayment ? booking.depositAmount! : booking.totalAmount;
  const remainingBalance = hasAdvancePayment ? booking.totalAmount - booking.depositAmount! : 0;

  const agencyPhone = booking.agencyPhone;
  const mainTitular = booking.titularName || titularName;

  const normalizedPassengers: PassengerDTO[] = booking.passengers || [
    { name: mainTitular, isTitular: true, boardingPoint: null },
    ...(booking.companionNames || []).map((name) => ({
      name,
      isTitular: false,
      boardingPoint: null,
    })),
  ];

  const formattedDate = formatSpanishLongDate(tourInfo.departureDateTime);
  const totalRegistered = normalizedPassengers.length;

  const whatsappText = encodeURIComponent(
    `Hola, acabo de registrar mis lugares para el ${tourInfo.title}. Adjunto mi comprobante de pago a nombre de ${mainTitular}.`,
  );

  const handleCopyClabe = async (clabe: string): Promise<void> => {
    const success = await copyToClipboard(clabe);
    if (success) {
      // 🚀 NUEVO: Toggle visual temporal para el botón
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);

      toast.success("CLABE copiada al portapapeles", {
        description: "Abre la app de tu banco y pégala para transferir.",
      });
    } else {
      toast.error("Error al copiar", {
        description: "Por favor, copia la CLABE manualmente.",
      });
    }
  };

  // 🛠️ Función de validación para determinar si debemos mostrar la tarjeta de pagos
  const hasAnyPaymentMethod =
    (booking.acceptsBankTransfer && booking.clabeNumber) ||
    (booking.acceptsCreditCard && booking.paymentLink) ||
    (booking.acceptsCash && booking.cashInstructions);

  return (
    <div className="animate-in zoom-in-95 mx-auto max-w-md space-y-5 pb-12 duration-300">
      <header className="mb-6 space-y-2 text-center">
        {/* 1. Badge superior de proceso */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/80 px-2.5 py-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
          <span className="text-[9px] font-bold tracking-wider text-indigo-700 uppercase">
            REGISTRO DE VIAJEROS
          </span>
        </div>

        {/* 2. Nombre del Tour */}
        <h2 className="px-3 text-lg leading-snug font-bold break-words text-slate-800">
          {tourInfo.title}
        </h2>

        {/* 3. Fecha de Salida contextual */}
        {formattedDate && (
          <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500">
            <Calendar className="h-3.5 w-3.5 text-indigo-500" />
            Salida: {formattedDate}
          </p>
        )}
      </header>

      {/* TARJETA 1: CONFIRMACIÓN Y MANIFIESTO (INTACTA) */}
      <div className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        {/* Bloque de Confirmación */}
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black tracking-widest text-emerald-600 uppercase">
              Paso 1 de 2 Completado
            </span>
            <span
              className={`rounded-full border px-3 py-0.5 text-[10px] font-bold ${hasAdvancePayment ? "border-amber-200 bg-amber-50 text-amber-700" : "border-indigo-200 bg-indigo-50 text-indigo-700"}`}
            >
              {hasAdvancePayment ? "• Anticipo Pendiente" : "• Pago Pendiente"}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">¡Lugares Apartados!</h1>
        </div>

        {/* DESGLOSE DE VIAJEROS REGISTRADOS */}
        <div className="text-left">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-indigo-900/80 uppercase">
              <Users className="h-4 w-4 text-indigo-600" />
              <span>Viajeros Registrados ({totalRegistered})</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {normalizedPassengers.map((passenger, idx) => {
              const bp = parseBoardingPoint(passenger.boardingPoint);
              const formattedTime = formatPickupTime(bp.time);

              return (
                <div
                  key={idx}
                  className={`flex flex-col gap-1.5 rounded-xl border p-3.5 ${passenger.isTitular ? "border-indigo-100 bg-indigo-50/30" : "border-slate-100 bg-slate-50/80"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{passenger.name}</span>
                    <Badge
                      variant="secondary"
                      className={`px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase shadow-none ${passenger.isTitular ? "border-indigo-200 bg-indigo-100 text-indigo-700" : "border-slate-300 bg-slate-200 text-slate-600"}`}
                    >
                      {passenger.isTitular ? "Titular" : "Acompañante"}
                    </Badge>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-white/60 bg-white/70 p-2.5 shadow-xs">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span className="text-xs font-medium text-slate-600">{bp.location}</span>
                    </div>
                    {bp.time && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-900">{formattedTime}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-3 text-center text-[11px] font-medium text-slate-500">
            * Te sugerimos llegar 15 minutos antes de tu hora de cita.
          </p>
        </div>

        <div className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 text-xs font-bold text-amber-800">
          <Clock className="h-4 w-4 text-amber-600" />
          <span>Lugares apartados por las próximas 24 horas</span>
        </div>
      </div>

      {/* 🚀 TARJETA 2: MÉTODOS Y OPCIONES DE PAGO REFACTORIZADA */}
      {hasAnyPaymentMethod ? (
        <section className="space-y-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          {/* Encabezado Principal */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-600"></div>
              <h2 className="text-xs font-extrabold tracking-wider text-slate-900 uppercase">
                Métodos y opciones de pago
              </h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
              Paso 2
            </span>
          </div>

          {/* Desglose Monetario (Conservado intacto de tu versión anterior) */}
          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-center">
            <div>
              <span className="block text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                Total del tour
              </span>
              <p className="mt-0.5 text-lg font-bold text-slate-900">
                ${booking.totalAmount.toLocaleString()}{" "}
                <span className="text-[10px] font-normal text-slate-500">MXN</span>
              </p>
            </div>
            <div className="border-l border-slate-200">
              <span className="block text-[9px] font-bold tracking-wider text-indigo-600 uppercase">
                {hasAdvancePayment ? "Anticipo a pagar" : "Total a pagar"}
              </span>
              <p className="mt-0.5 text-lg font-black text-indigo-600">
                ${amountDueToday.toLocaleString()}{" "}
                <span className="text-[10px] font-normal">MXN</span>
              </p>
            </div>
          </div>

          {hasAdvancePayment && (
            <p className="px-4 text-center text-[11px] text-slate-500">
              Saldo restante:{" "}
              <span className="font-bold text-slate-900">
                ${remainingBalance.toLocaleString()} MXN
              </span>{" "}
              a liquidar antes o el día de la salida.
            </p>
          )}

          {/* Contenedores Modulares de Pagos */}
          <div className="space-y-3">
            {/* OPCIÓN 1: TRANSFERENCIA BANCARIA */}
            {booking.acceptsBankTransfer && booking.clabeNumber && (
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4 transition-all">
                <div className="mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4 shrink-0 text-indigo-600" />
                  <h3 className="text-xs font-bold tracking-wide text-slate-800 uppercase">
                    Transferencia Bancaria
                  </h3>
                </div>

                <div className="space-y-3 rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="block text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                        Banco Receptor
                      </span>
                      <span className="block truncate text-xs font-bold text-slate-800">
                        {booking.bankName || "No especificado"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                        Beneficiario
                      </span>
                      <span
                        className="block truncate text-xs font-bold text-slate-800"
                        title={booking.accountHolder || ""}
                      >
                        {booking.accountHolder}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                    <div>
                      <span className="mb-0.5 block text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                        CLABE Interbancaria
                      </span>
                      <span className="block font-mono text-xs font-bold tracking-wider text-slate-900">
                        {booking.clabeNumber}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyClabe(booking.clabeNumber!)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-95"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <p className="mt-2.5 text-center text-[11px] text-slate-400 italic">
                  *En concepto de pago ingresa tu nombre o teléfono registrado
                </p>
              </div>
            )}

            {/* OPCIÓN 2: PAGO CON TARJETA / LINK */}
            {booking.acceptsCreditCard && booking.paymentLink?.trim() && (
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4 transition-all">
                <div className="mb-1.5 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 shrink-0 text-indigo-600" />
                  <h3 className="text-xs font-bold tracking-wide text-slate-800 uppercase">
                    Pago con Tarjeta / En línea
                  </h3>
                </div>

                <p className="mb-3 text-xs leading-relaxed text-slate-500">
                  Acepta tarjetas de crédito, débito y plataformas digitales de forma segura.
                </p>

                <a
                  href={booking.paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-xs font-bold text-indigo-700 shadow-sm transition hover:border-indigo-400 hover:bg-indigo-50/50 active:scale-[0.98]"
                >
                  <span>Consultar opciones de pago</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                </a>
              </div>
            )}

            {/* OPCIÓN 3: PAGO EN EFECTIVO */}
            {booking.acceptsCash && booking.cashInstructions?.trim() && (
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4 transition-all">
                <div className="mb-1.5 flex items-center gap-2">
                  <Banknote className="h-4 w-4 shrink-0 text-emerald-600" />
                  <h3 className="text-xs font-bold tracking-wide text-slate-800 uppercase">
                    Pago en Efectivo
                  </h3>
                </div>

                <p className="rounded-xl border border-slate-100 bg-white/70 p-3 text-xs leading-relaxed font-medium whitespace-pre-line text-slate-600">
                  {booking.cashInstructions}
                </p>
              </div>
            )}
          </div>
        </section>
      ) : (
        /* FALLBACK: Sin métodos de pago configurados */
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800 shadow-sm">
          <AlertCircle className="h-6 w-6 text-amber-600" />
          <p>
            Contacta a tu agencia por WhatsApp para recibir las instrucciones y opciones de pago.
          </p>
        </div>
      )}

      {/* TARJETA 3: ACCIÓN WHATSAPP (INTACTA) */}
      <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm">
        <h3 className="text-foreground mb-1 text-center text-sm font-bold">
          ¿Ya realizaste tu transferencia?
        </h3>
        <p className="text-muted-foreground mx-auto mb-4 max-w-xs text-center text-xs leading-relaxed">
          Envíanos la captura de tu comprobante para validar tu pago y confirmar tus lugares.
        </p>
        <a
          href={`https://wa.me/${agencyPhone.replace(/\D/g, "")}?text=${whatsappText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full"
        >
          <Button
            type="button"
            className="h-12 w-full rounded-xl bg-[#25D366] text-sm font-bold text-white shadow-none transition-transform hover:bg-[#1DA851] active:scale-[0.98]"
          >
            <MessageCircle className="mr-2 h-5 w-5 fill-current" /> Enviar comprobante
          </Button>
        </a>
      </div>

      <div className="space-y-2 pt-2 text-center">
        <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <HelpCircle className="h-3.5 w-3.5" /> ¿Dudas con tu reservación? Estamos para ayudarte.
        </p>
        <p className="text-[10px] text-slate-300">{booking.agencyName} © 2026</p>
      </div>
    </div>
  );
}
