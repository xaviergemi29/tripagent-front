"use client";

import { MinorTravelAlert } from "@/components/shared/MinorTravelAlert";
import { PublicBookingLayout } from "@/components/layout/public/PublicBookingLayout";
import { DEFAULT_CURRENCY } from "@/shared/constants/domain.constants";
import { ReservationConfirmedCard } from "./booking-success/ReservationConfirmedCard";
import { PaymentOptionsCard } from "./booking-success/PaymentOptionsCard";
import { SendReceiptCard } from "./booking-success/SendReceiptCard";
import type { BookingSuccessViewProps, PassengerDTO } from "./booking-success/types";
import { getActivePassengersTitularFirst } from "@/shared/utils/passenger-status.util";

/**
 * Vista del Magic Link para `flowState = "PENDING_PAYMENT"`: lugares apartados y cómo pagar.
 * Cada tarjeta vive en `booking-success/`; aquí solo se calculan los montos y se compone.
 */
export function BookingSuccessView({
  booking,
  tourInfo,
  titularName,
  agencyLogoPath,
}: BookingSuccessViewProps) {
  const hasAdvancePayment = Boolean(booking.depositAmount && booking.depositAmount > 0);
  const amountDueToday = hasAdvancePayment ? booking.depositAmount! : booking.totalAmount;
  const remainingBalance = hasAdvancePayment ? booking.totalAmount - booking.depositAmount! : 0;

  const agencyPhone = booking.agencyPhone;
  const mainTitular = booking.titularName || titularName;

  // Solo pasajeros vigentes con el titular primero (un acompañante dado de baja no se lista).
  const normalizedPassengers: PassengerDTO[] = booking.passengers
    ? getActivePassengersTitularFirst(booking.passengers)
    : [
        { name: mainTitular, isTitular: true, boardingPoint: null },
        ...(booking.companionNames || []).map((name) => ({
          name,
          isTitular: false,
          boardingPoint: null,
        })),
      ];

  const currency = tourInfo.currency || DEFAULT_CURRENCY;
  const whatsappText = `Hola, acabo de registrar mis lugares para el ${tourInfo.title}. Adjunto mi comprobante de pago a nombre de ${mainTitular}.`;

  return (
    <PublicBookingLayout
      headerProps={{
        agencyName: booking.agencyName,
        agencyLogoPath,
        statusBadgeText: hasAdvancePayment ? "Anticipo pendiente" : "Pago pendiente",
        statusVariant: "warning",
        tourTitle: tourInfo.title,
        departureDate: tourInfo.departureDateTime,
      }}
      footerProps={{
        agencyName: booking.agencyName,
        agencyWhatsApp: agencyPhone,
        whatsappMessage: `Hola, tengo dudas con mi reservación para "${tourInfo.title}".`,
      }}
    >
      <div className="animate-in zoom-in-95 space-y-5 duration-300">
        <ReservationConfirmedCard
          passengers={normalizedPassengers}
          hasAdvancePayment={hasAdvancePayment}
        />
        {booking.hasMinors && <MinorTravelAlert />}

        <PaymentOptionsCard
          booking={booking}
          currency={currency}
          hasAdvancePayment={hasAdvancePayment}
          amountDueToday={amountDueToday}
          remainingBalance={remainingBalance}
          agencyPhone={agencyPhone}
          tourTitle={tourInfo.title}
        />

        <SendReceiptCard agencyPhone={agencyPhone} whatsappText={whatsappText} />
      </div>
    </PublicBookingLayout>
  );
}
