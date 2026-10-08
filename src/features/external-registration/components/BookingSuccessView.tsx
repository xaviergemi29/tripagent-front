"use client";

import {
  CheckCircle2,
  Copy,
  Clock,
  HelpCircle,
  MessageCircle,
  AlertCircle,
  Users,
  MapPin, // 🚀 Añadido
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // 🚀 Añadido
import { copyToClipboard } from "@/shared/utils/clipboard";

interface BookingSuccessViewProps {
  booking: {
    bookingId: string;
    agencyName: string;
    agencyPhone: string;
    titularName?: string;
    companionNames?: string[];
    totalAmount: number;
    depositAmount: number | null;
    acceptsBankTransfer: boolean;
    bankName: string | null;
    accountHolder: string | null;
    clabeNumber: string | null;
    acceptsCreditCard: boolean;
    paymentLink: string | null;
  };
  tourInfo: { title: string; departureDateTime: string };
  titularName: string;
}

export function BookingSuccessView({ booking, tourInfo, titularName }: BookingSuccessViewProps) {
  const hasAdvancePayment = Boolean(booking.depositAmount && booking.depositAmount > 0);
  const amountDueToday = hasAdvancePayment ? booking.depositAmount! : booking.totalAmount;
  const remainingBalance = hasAdvancePayment ? booking.totalAmount - booking.depositAmount! : 0;

  const agencyPhone = booking.agencyPhone;
  const mainTitular = booking.titularName || titularName;
  const companions = booking.companionNames || [];
  const totalRegistered = 1 + companions.length;

  const whatsappText = encodeURIComponent(
    `Hola, acabo de registrar mis lugares para el ${tourInfo.title}. Adjunto mi comprobante de pago a nombre de ${mainTitular}.`,
  );

  const handleCopyClabe = async (clabe: string): Promise<void> => {
    const success = await copyToClipboard(clabe);

    if (success) {
      toast.success("CLABE copiada al portapapeles", {
        description: "Abre la app de tu banco y pégala para transferir.",
      });
    } else {
      toast.error("Error al copiar", {
        description: "Por favor, copia la CLABE manualmente.",
      });
    }
  };

  return (
    <div className="animate-in zoom-in-95 mx-auto max-w-md space-y-5 pb-12 duration-300">
      {/* TARJETA 1: CONFIRMACIÓN Y MANIFIESTO RÁPIDO */}
      <div className="space-y-5 rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div className="space-y-3">
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
          <p className="mx-auto px-2 text-xs leading-relaxed text-slate-500">
            Hemos reservado tu cupo temporalmente. Completa tu{" "}
            {hasAdvancePayment ? "anticipo" : "pago"} dentro del plazo estipulado.
          </p>
        </div>

        {/* 🚀 NUEVA SECCIÓN: DESGLOSE DE VIAJEROS REGISTRADOS */}
        <div className="mt-6 text-left">
          <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-indigo-900/80 uppercase">
            <Users className="h-3.5 w-3.5 text-indigo-600" />
            <span>Viajeros Registrados ({totalRegistered})</span>
          </div>

          <div className="space-y-2">
            {/* Tarjeta del Titular */}
            <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex items-center justify-between">
                <span className="text-foreground text-sm font-semibold">{mainTitular}</span>
                <Badge
                  variant="secondary"
                  className="bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 uppercase dark:bg-indigo-950 dark:text-indigo-300"
                >
                  Titular
                </Badge>
              </div>
              <div className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-xs">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>{tourInfo.departureDateTime}</span>
              </div>
            </div>

            {/* Tarjetas de Acompañantes */}
            {companions.map((name, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-foreground text-sm font-semibold">{name}</span>
                  <Badge
                    variant="secondary"
                    className="bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 uppercase dark:bg-slate-800 dark:text-slate-400"
                  >
                    Acompañante
                  </Badge>
                </div>
                <div className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-xs">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span>{tourInfo.departureDateTime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* FIN SECCIÓN VIAJEROS */}

        <div className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 text-xs font-bold text-amber-800">
          <Clock className="h-4 w-4 text-amber-600" />
          <span>Lugares apartados por las próximas 24 horas</span>
        </div>
      </div>

      {/* TARJETA 2: DATOS BANCARIOS (Intacta) */}
      {booking.acceptsBankTransfer && booking.clabeNumber ? (
        <div className="space-y-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          {/* ... (Código intacto para la transferencia) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-600"></div>
              <h3 className="text-xs font-bold tracking-wider text-slate-900 uppercase">
                Información para transferencia
              </h3>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
              Paso 2
            </span>
          </div>

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
                {hasAdvancePayment ? "Anticipo a pagar hoy" : "Total a pagar hoy"}
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

          <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <div className="flex justify-between text-xs">
              <div className="space-y-1">
                <span className="block text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                  Banco Receptor
                </span>
                <span className="block font-bold text-slate-900">
                  {booking.bankName || "No especificado"}
                </span>
              </div>
              <div className="space-y-1 text-right">
                <span className="block text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                  Beneficiario
                </span>
                <span className="block font-medium text-slate-900">{booking.accountHolder}</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
              <div className="space-y-0.5">
                <span className="block text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                  CLABE Interbancaria
                </span>
                <span className="block font-mono text-sm font-bold tracking-widest text-slate-900">
                  {booking.clabeNumber}
                </span>
              </div>
              <Button
                type="button"
                onClick={() => handleCopyClabe(booking.clabeNumber!)}
                className="h-8 rounded-lg bg-indigo-600 px-3 text-xs font-bold text-white shadow-none hover:bg-indigo-700"
              >
                <Copy className="mr-1.5 h-3 w-3" /> Copiar
              </Button>
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-400 italic">
            *En concepto de pago ingresa tu nombre o teléfono registrado
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800 shadow-sm">
          <AlertCircle className="h-6 w-6 text-amber-600" />
          <p>
            Contacta a tu agencia por WhatsApp para recibir las instrucciones y opciones de pago.
          </p>
        </div>
      )}

      {/* 🚀 TARJETA 3: ACCIÓN WHATSAPP CON TEXTOS INFORMATIVOS */}
      <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm">
        {/* Nuevos Textos Agregados */}
        <h3 className="text-foreground mb-1 text-center text-sm font-bold">
          ¿Ya realizaste tu transferencia?
        </h3>
        <p className="text-muted-foreground mx-auto mb-4 max-w-xs text-center text-xs leading-relaxed">
          Envíanos la foto o captura de tu comprobante para validar tu pago y confirmar tus lugares.
        </p>

        {/* Botón intacto */}
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
            <MessageCircle className="mr-2 h-5 w-5 fill-current" /> Enviar comprobante por WhatsApp
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
