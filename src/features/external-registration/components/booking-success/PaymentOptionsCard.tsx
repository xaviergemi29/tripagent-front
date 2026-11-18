"use client";

import {
  AlertCircle,
  Banknote,
  Building2,
  CreditCard,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { buildWhatsAppUrl } from "@/shared/utils/share-links.util";
import { formatCurrency } from "@/shared/utils/currency.util";
import type { Currency } from "@/shared/constants/domain.constants";
import type { BookingSuccessViewProps } from "./types";
import { BankTransferDetails } from "../BankTransferDetails";

interface PaymentOptionsCardProps {
  booking: BookingSuccessViewProps["booking"];
  currency: Currency;
  hasAdvancePayment: boolean;
  amountDueToday: number;
  remainingBalance: number;
  /** WhatsApp de la agencia: pedir los datos de transferencia si aún no tiene CLABE. */
  agencyPhone: string;
  tourTitle: string;
}

/**
 * Paso 2: "Métodos y opciones de pago" (transferencia con CLABE y tarjeta, link de pago y
 * efectivo, según lo que acepte el tour). Sin ningún método, invita a contactar a la agencia.
 */
export function PaymentOptionsCard({
  booking,
  currency,
  hasAdvancePayment,
  amountDueToday,
  remainingBalance,
  agencyPhone,
  tourTitle,
}: PaymentOptionsCardProps) {
  const clabeNumber = booking.clabeNumber?.trim() || null;
  const cardNumber = booking.cardNumber?.trim() || null;
  const showBankTransfer = booking.acceptsBankTransfer && Boolean(clabeNumber || cardNumber);
  // El tour acepta transferencia, pero la agencia aún no captura su CLABE (OBS-038, 2026-11-17): en
  // lugar de un bloque en blanco, el cliente pide los datos por WhatsApp.
  const needsTransferData = booking.acceptsBankTransfer && !clabeNumber;

  // Solo se muestra la tarjeta de pagos si el tour acepta al menos un método con sus datos.
  const hasAnyPaymentMethod =
    showBankTransfer ||
    needsTransferData ||
    (booking.acceptsCreditCard && booking.paymentLink) ||
    (booking.acceptsCash && booking.cashInstructions);

  return hasAnyPaymentMethod ? (
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
            {formatCurrency(booking.totalAmount, { currency })}
          </p>
        </div>
        <div className="border-l border-slate-200">
          <span className="block text-[9px] font-bold tracking-wider text-indigo-600 uppercase">
            {hasAdvancePayment ? "Anticipo a pagar" : "Total a pagar"}
          </span>
          <p className="mt-0.5 text-lg font-black text-indigo-600">
            {formatCurrency(amountDueToday, { currency })}
          </p>
        </div>
      </div>

      {hasAdvancePayment && (
        <p className="px-4 text-center text-[11px] text-slate-500">
          Saldo restante:{" "}
          <span className="font-bold text-slate-900">
            {formatCurrency(remainingBalance, { currency })}
          </span>{" "}
          a liquidar antes o el día de la salida.
        </p>
      )}

      {/* Contenedores Modulares de Pagos */}
      <div className="space-y-3">
        {/* OPCIÓN 1: TRANSFERENCIA BANCARIA */}
        {showBankTransfer && (
          <BankTransferDetails
            bankName={booking.bankName}
            accountHolder={booking.accountHolder}
            clabeNumber={clabeNumber}
            cardNumber={cardNumber}
          />
        )}

        {needsTransferData && (
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4 transition-all">
            <div className="mb-1.5 flex items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0 text-indigo-600" />
              <h3 className="text-xs font-bold tracking-wide text-slate-800 uppercase">
                Transferencia bancaria
              </h3>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-slate-500">
              La agencia te compartirá sus datos de transferencia por WhatsApp.
            </p>
            <a
              href={buildWhatsAppUrl(agencyPhone, {
                message: `Hola, quiero pagar por transferencia mi reservación para "${tourTitle}". ¿Me compartes los datos bancarios?`,
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              <span>Contactar a la agencia por WhatsApp para pedir datos de transferencia</span>
            </a>
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
      <p>Contacta a tu agencia por WhatsApp para recibir las instrucciones y opciones de pago.</p>
    </div>
  );
}
