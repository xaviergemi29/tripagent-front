"use client";

import { MinorTravelAlert } from "@/components/shared/MinorTravelAlert";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_CURRENCY, BOOKING_STATUS } from "@/shared/constants/domain.constants";
import { PublicBookingLayout } from "@/components/layout/public/PublicBookingLayout";
import { TourInstructionsCard } from "@/features/external-registration/components/TourInstructionsCard";
import { PaymentSummaryCard } from "./partial-payment/PaymentSummaryCard";
import { TravelGroupCard } from "./partial-payment/TravelGroupCard";
import { NextPaymentsCard } from "./partial-payment/NextPaymentsCard";
import { ReportPaymentCta } from "./partial-payment/ReportPaymentCta";
import type { PartialPaymentViewProps } from "./partial-payment/types";

/**
 * Vista del Magic Link para `flowState = "PARTIAL_PAYMENT"`: estado de cuenta del cliente. Cada
 * bloque vive en `partial-payment/`; aquí solo se calculan los totales a mostrar y se compone.
 */
export function PartialPaymentView({
  bookingStatus,
  agencyLogoPath,
  tourInfo,
  groupSize,
  financials,
  paymentHistory = [],
  passengers = [],
  agency,
  hasMinors = false,
}: PartialPaymentViewProps) {
  const tourCurrency = tourInfo.currency || DEFAULT_CURRENCY;
  const totalCost = financials.totalAmount || 0;
  const totalPaid = financials.amountPaid || 0;
  const remaining = Math.max(0, financials.remainingBalance || 0);
  const percentagePaid =
    totalCost > 0 ? Math.min(100, Math.round((totalPaid / totalCost) * 100)) : 0;
  const isFullyPaid = remaining === 0;

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
        {bookingStatus === BOOKING_STATUS.CONFIRMED ? (
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
          >
            • Anticipo pagado
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

      {hasMinors && <MinorTravelAlert />}

      <PaymentSummaryCard
        tourInfo={tourInfo}
        groupSize={groupSize}
        financials={financials}
        paymentHistory={paymentHistory}
        passengers={passengers}
        agency={agency}
        tourCurrency={tourCurrency}
        totalCost={totalCost}
        totalPaid={totalPaid}
        remaining={remaining}
        percentagePaid={percentagePaid}
        isFullyPaid={isFullyPaid}
      />

      <TravelGroupCard passengers={passengers} />

      {/* Indicaciones de logística del tour (Instrucciones Post-Pago) */}
      <TourInstructionsCard instructions={tourInfo.postPaymentInstructions} />

      {/* Dónde hacer tus próximos pagos */}
      {!isFullyPaid && <NextPaymentsCard agency={agency} />}

      {/* CTA a WhatsApp para enviar el comprobante */}
      {!isFullyPaid && (
        <ReportPaymentCta
          agencyName={agency.name}
          agencyPhone={agency.phone}
          tourTitle={tourInfo.title}
        />
      )}
    </PublicBookingLayout>
  );
}
