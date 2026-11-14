"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  CreditCard,
  Hourglass,
  MapPin,
  ReceiptText,
  ShieldCheck,
  Building2,
  Users,
  User,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { formatCurrency } from "@/shared/utils/currency.util";
import { formatSpanishLongDate, formatForDateInput } from "@/shared/utils/tour-date.util";
import { DownloadStatementButton } from "./DownloadStatementButton";
import { getPaymentMethodText } from "@/shared/utils/config/status-dictionaries.config";
import { type Currency, DEFAULT_CURRENCY } from "@/shared/constants/domain.constants";
import { buildWhatsAppUrl } from "@/shared/utils/share-links.util";
import { copyToClipboard } from "@/shared/utils/clipboard";
import {
  formatCardNumberForDisplay,
  formatClabeForDisplay,
} from "@/shared/utils/bank-account.util";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { PublicBookingLayout } from "@/components/layout/public/PublicBookingLayout";
import { TourInstructionsCard } from "@/features/external-registration/components/TourInstructionsCard";

interface PartialPaymentViewProps {
  bookingId: string;
  tourInfo: {
    title: string;
    departureDateTime: string;
    returnDate?: string | null;
    currency?: Currency;
    /** Instrucciones Post-Pago (logística) del tour: pantalla y estado de cuenta PDF. */
    postPaymentInstructions?: string | null;
  };
  /** Lugares apartados (tamaño esperado del grupo); el PDF muestra cuántos faltan por registrar. */
  groupSize?: number;
  financials: {
    totalAmount: number;
    amountPaid: number;
    remainingBalance: number;
    status: string;
  };
  paymentHistory: {
    id: string;
    date: string;
    amount: number;
    method: string;
    reference?: string | null;
  }[];
  passengers: {
    name: string;
    type: string;
    boardingPoint?: string | null;
    departureTime?: string;
    pickupReference?: string;
    isTitular?: boolean;
    status?: string;
    boardingPointDetails?: { location: string; time: string | null } | null;
    seatLabel?: string | null;
    phone?: string | null;
  }[];
  agency: {
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
    bankName: string | null;
    accountHolder: string | null;
    clabeNumber: string | null;
    cardNumber?: string | null;
    /** Identidad visual para el comprobante PDF (logo físico + colores de marca). */
    logoPath?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    accentColor?: string | null;
    /** Políticas generales de la agencia (estado de cuenta PDF). */
    policies?: string | null;
  };
  token?: string;
  bookingStatus?: string;
  /** Logotipo de la agencia (`meta.agency.logoPath` del Magic Link). */
  agencyLogoPath?: string | null;
}

/** Dato bancario (CLABE o tarjeta) con su botón de copiar. */
function CopyableAccountField({
  label,
  value,
  isCopied,
  onCopy,
}: {
  label: string;
  value: string;
  isCopied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-500">{label}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCopy}
          aria-label={`Copiar ${label}`}
          className="h-7 gap-1 border-indigo-200 bg-indigo-50/50 px-2.5 text-[11px] text-indigo-700 hover:bg-indigo-100"
        >
          {isCopied ? (
            <>
              <Check className="h-3 w-3 text-emerald-600" />
              <span>¡Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copiar</span>
            </>
          )}
        </Button>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-center font-mono text-sm font-semibold tracking-wider text-slate-800">
        {value}
      </div>
    </div>
  );
}

export function PartialPaymentView({
  bookingStatus,
  agencyLogoPath,
  tourInfo,
  groupSize,
  financials,
  paymentHistory = [],
  passengers = [],
  agency,
}: PartialPaymentViewProps) {
  /** Dato bancario recién copiado (para el estado visual de su botón). */
  const [copiedField, setCopiedField] = useState<"clabe" | "card" | null>(null);
  const tourCurrency = tourInfo.currency || DEFAULT_CURRENCY;
  const totalCost = financials.totalAmount || 0;
  const totalPaid = financials.amountPaid || 0;
  const remaining = Math.max(0, financials.remainingBalance || 0);
  const percentagePaid =
    totalCost > 0 ? Math.min(100, Math.round((totalPaid / totalCost) * 100)) : 0;
  const isFullyPaid = remaining === 0;

  const clabeNumber = agency.clabeNumber?.trim() || null;
  const cardNumber = agency.cardNumber?.trim() || null;
  const hasPaymentAccounts = Boolean(clabeNumber || cardNumber);
  const bankFieldLabel = { clabe: "CLABE", card: "Número de tarjeta" } as const;

  const handleCopyBankField = async (field: "clabe" | "card", value: string): Promise<void> => {
    const success = await copyToClipboard(value.replace(/\s+/g, ""));
    if (success) {
      setCopiedField(field);
      toast.success(`${bankFieldLabel[field]} copiado al portapapeles`);
      setTimeout(() => setCopiedField(null), 2000);
    } else {
      toast.error(`Error al copiar el ${bankFieldLabel[field].toLowerCase()}`);
    }
  };

  const handleSendWhatsApp = (): void => {
    const message = `¡Hola ${agency.name}! Quiero reportar un nuevo abono para mi reservación en el "${tourInfo.title}". Adjunto mi comprobante:`;
    window.open(buildWhatsAppUrl(agency.phone, { message }), "_blank");
  };

  return (
    <PublicBookingLayout
      headerProps={{
        agencyName: agency.name,
        agencyLogoPath,
        statusBadgeText: "Abono parcial registrado",
        statusVariant: "brand",
        tourTitle: tourInfo.title,
        departureDate: tourInfo.departureDateTime,
      }}
      footerProps={{
        agencyName: agency.name,
        agencyWhatsApp: agency.phone,
        whatsappMessage: `Hola, tengo dudas con mi reservación para "${tourInfo.title}".`,
      }}
    >
      {/* Estado de confirmación (CONFIRMED = anticipo cubierto + formulario lleno) */}
      <div className="flex flex-col items-center gap-2 text-center">
        {bookingStatus === "CONFIRMED" ? (
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
          >
            • Viaje confirmado
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
          >
            • Pendiente de anticipo
          </Badge>
        )}
        <p className="flex items-center gap-1.5 text-xs text-slate-600">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
          Aquí puedes ver tus pagos y la información de tu salida.
        </p>
      </div>

      {/* 1. SECCIÓN: TUS PAGOS */}
      <Card className="overflow-hidden rounded-2xl border-indigo-100/70 bg-white shadow-sm">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-indigo-900 uppercase">
            <CreditCard className="h-4 w-4 text-indigo-600" /> Tus Pagos
          </div>

          <div className="space-y-2.5">
            {/* Costo Total */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
              <div>
                <span className="block text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                  Costo total del viaje
                </span>
                <span className="text-xl font-extrabold text-slate-900">
                  {formatCurrency(totalCost, { currency: tourCurrency })}
                </span>
              </div>
              <div className="rounded-xl bg-slate-200/60 p-2 text-slate-600">
                <ReceiptText className="h-5 w-5" />
              </div>
            </div>

            {/* Lo que llevas pagado */}
            <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold tracking-wider text-emerald-800 uppercase">
                    Lo que llevas pagado
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Abonado
                  </span>
                </div>
                <span className="text-xl font-extrabold text-emerald-700">
                  +{formatCurrency(totalPaid, { currency: tourCurrency })}
                </span>
              </div>
              <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>

            {/* Te falta por pagar / Liquidado */}
            <div
              className={`flex items-center justify-between rounded-xl border p-3.5 ${
                isFullyPaid
                  ? "border-slate-200 bg-slate-50/60"
                  : "border-indigo-100 bg-indigo-50/40"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold tracking-wider text-slate-600 uppercase">
                    Te falta por pagar
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isFullyPaid
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-indigo-100 text-indigo-700"
                    }`}
                  >
                    {isFullyPaid ? "Completado" : "Pendiente"}
                  </span>
                </div>
                <span
                  className={`text-xl font-extrabold ${
                    isFullyPaid ? "text-slate-700" : "text-indigo-900"
                  }`}
                >
                  {formatCurrency(remaining, { currency: tourCurrency })}
                </span>
              </div>
              <div
                className={`rounded-xl p-2 ${
                  isFullyPaid ? "bg-slate-200/60 text-slate-500" : "bg-indigo-100 text-indigo-700"
                }`}
              >
                {isFullyPaid ? <Check className="h-5 w-5" /> : <Hourglass className="h-5 w-5" />}
              </div>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700">
                {isFullyPaid ? "Viaje 100% pagado" : `Llevas cubierto el ${percentagePaid}%`}
              </span>
              <span className="font-bold text-indigo-600">{percentagePaid}% liquidado</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500 ease-out"
                style={{ width: `${percentagePaid}%` }}
              />
            </div>
          </div>

          {/* 2. SECCIÓN: TUS ABONOS REGISTRADOS */}
          <div className="space-y-3 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-700 uppercase">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Tus Abonos Registrados
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                {paymentHistory.length} {paymentHistory.length === 1 ? "pago" : "pagos"}
              </span>
            </div>

            {paymentHistory.length === 0 ? (
              <p className="py-3 text-center text-xs text-slate-400">
                Aún no se han registrado abonos en esta reservación.
              </p>
            ) : (
              <div className="space-y-2 pt-1">
                {paymentHistory.map((p, index) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 rounded-lg bg-indigo-50 p-2 text-indigo-600">
                        <ReceiptText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          Abono {index + 1} • {getPaymentMethodText(p.method)}
                        </p>
                        <p className="text-[11px] text-slate-500 capitalize">
                          {formatSpanishLongDate(formatForDateInput(p.date))}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold whitespace-nowrap text-emerald-600">
                      +{formatCurrency(p.amount, { currency: tourCurrency })}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* BOTÓN DESCARGAR COMPROBANTE EN PDF */}
            <div className="pt-2">
              <DownloadStatementButton
                source={{
                  tourInfo,
                  groupSize,
                  financials,
                  paymentHistory,
                  passengers,
                  agency,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. SECCIÓN: PERSONAS EN ESTE VIAJE */}
      <Card className="rounded-2xl border-indigo-100/70 bg-white shadow-sm">
        <CardContent className="space-y-4 p-4 sm:p-5">
          {/* Header de la sección */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-800 uppercase">
              <Users className="h-4 w-4 text-indigo-700" />
              <span>Personas en este viaje ({passengers.length})</span>
            </div>
            <span className="flex items-center gap-1 rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
              Confirmados
            </span>
          </div>

          {/* Lista de Pasajeros */}
          <div className="space-y-3">
            {passengers.map((pass, idx) => {
              const isLead = pass.type?.toLowerCase() === "titular";

              const meetingInfo =
                pass.pickupReference ||
                (pass.boardingPoint
                  ? `${pass.boardingPoint}${
                      pass.departureTime ? ` • Salida: ${pass.departureTime}` : ""
                    }`
                  : "Punto de abordaje: Por coordinar");

              return (
                <div
                  key={idx}
                  className={`rounded-xl border p-3.5 transition-all sm:p-4 ${
                    isLead
                      ? "border-indigo-100 bg-gradient-to-r from-indigo-50/40 via-white to-white shadow-[0_2px_8px_-3px_rgba(99,102,241,0.08)]"
                      : "border-slate-100 bg-slate-50/70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform ${
                          isLead
                            ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white ring-2 ring-indigo-200/80"
                            : "bg-slate-200/80 text-slate-700"
                        }`}
                      >
                        <User className="h-4 w-4" />
                      </div>

                      <div className="truncate">
                        <span className="block truncate text-sm font-bold text-slate-900">
                          {pass.name}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${
                        isLead
                          ? "border border-indigo-200/60 bg-indigo-100 text-indigo-800"
                          : "bg-slate-200/80 text-slate-700"
                      }`}
                    >
                      {pass.type}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-start gap-2 border-t border-slate-100/80 pt-2 text-xs text-slate-600">
                    <div className="mt-0.5 shrink-0 rounded-lg bg-emerald-50 p-1 text-emerald-700">
                      <MapPin className="h-3.5 w-3.5" />
                    </div>
                    <div className="leading-tight">
                      <span className="mb-0.5 block text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                        Punto de abordaje
                      </span>
                      <span className="font-medium text-slate-800">{meetingInfo}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Indicaciones de logística del tour (Instrucciones Post-Pago) */}
      <TourInstructionsCard instructions={tourInfo.postPaymentInstructions} />

      {/* Dónde hacer tus próximos pagos */}
      {!isFullyPaid && hasPaymentAccounts && (
        <Card className="rounded-2xl border-indigo-100/70 bg-white shadow-sm">
          <CardContent className="space-y-3 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-950 uppercase">
              <Building2 className="h-4 w-4 text-indigo-600" /> Dónde hacer tus próximos pagos
            </div>
            <p className="text-xs text-slate-600">
              Puedes ir liquidando poco a poco antes del día de salida con los siguientes datos:
            </p>
            <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 text-xs">
              {agency.bankName && (
                <div className="flex items-center justify-between border-b border-slate-200/60 py-1">
                  <span className="text-slate-500">Banco</span>
                  <span className="font-bold text-slate-800">{agency.bankName}</span>
                </div>
              )}
              {agency.accountHolder && (
                <div className="flex items-center justify-between border-b border-slate-200/60 py-1">
                  <span className="text-slate-500">A nombre de</span>
                  <span className="text-right font-semibold text-slate-800">
                    {agency.accountHolder}
                  </span>
                </div>
              )}
              {clabeNumber && (
                <CopyableAccountField
                  label="CLABE interbancaria"
                  value={formatClabeForDisplay(clabeNumber)}
                  isCopied={copiedField === "clabe"}
                  onCopy={() => handleCopyBankField("clabe", clabeNumber)}
                />
              )}
              {cardNumber && (
                <CopyableAccountField
                  label="Número de tarjeta"
                  value={formatCardNumberForDisplay(cardNumber)}
                  isCopied={copiedField === "card"}
                  onCopy={() => handleCopyBankField("card", cardNumber)}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA a WhatsApp para Enviar Comprobante */}
      {!isFullyPaid && (
        <div className="space-y-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <WhatsAppIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-950">¿Hiciste otro abono o pago?</h3>
              <p className="text-xs leading-tight text-emerald-800/90">
                Mándanos una foto de tu comprobante por WhatsApp para anotarlo a tu cuenta.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={handleSendWhatsApp}
            className="h-11 w-full gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:bg-emerald-700 active:scale-[0.98]"
          >
            <WhatsAppIcon className="h-4 w-4 fill-current" /> Enviar comprobante por WhatsApp
          </Button>
        </div>
      )}
    </PublicBookingLayout>
  );
}
