"use client";

import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TOUR_TARGET } from "@/features/onboarding/constants/guided-tours";
import type { TitularRowOutput } from "@/features/tour-dashboard/schemas/tour-dashboard.schema";
import { BOOKING_STATUS, type Currency } from "@/shared/constants/domain.constants";
import {
  buildBookingWhatsAppUrl,
  type BookingWhatsAppBankDetails,
} from "@/shared/utils/booking-whatsapp.util";
import { buildMagicLinkUrl } from "@/shared/utils/share-links.util";
import { ROW_ACTION_TONE } from "./traveler-row-cells";

/** Reservas a las que aún se les despacha el acceso y el cobro (regla 4 de `../CLAUDE.md`). */
export const canSendBookingWhatsApp = (titular: TitularRowOutput): boolean =>
  Boolean(titular.magicToken) &&
  (titular.bookingStatus === BOOKING_STATUS.AWAITING_REGISTRATION ||
    titular.bookingStatus === BOOKING_STATUS.PENDING);

interface SendBookingWhatsAppActionProps {
  titular: TitularRowOutput;
  tourTitle: string;
  tourCurrency: Currency;
  bankDetails?: BookingWhatsAppBankDetails;
  /** Clases de tamaño según escritorio o celular. */
  className?: string;
}

/**
 * "Enviar por WhatsApp" del titular: abre `wa.me` con el Magic Link, el anticipo por cubrir y los
 * datos de transferencia. Sin WhatsApp válido se muestra deshabilitado. Requiere un
 * `TooltipProvider` arriba. El padre decide si se ofrece (`canSendBookingWhatsApp`, Modo Auditoría).
 */
export function SendBookingWhatsAppAction({
  titular,
  tourTitle,
  tourCurrency,
  bankDetails,
  className = "h-9 w-9",
}: SendBookingWhatsAppActionProps) {
  const label = "Enviar por WhatsApp";
  const base = `flex items-center justify-center rounded-lg border transition-colors ${className} ${ROW_ACTION_TONE.whatsapp}`;
  // Lo ya abonado se descuenta del anticipo: se cobra solo lo que falta para asegurar los lugares.
  const url = titular.magicToken
    ? buildBookingWhatsAppUrl({
        phone: titular.whatsapp,
        travelerName: titular.fullName,
        tourName: tourTitle,
        magicLinkUrl: buildMagicLinkUrl(titular.magicToken),
        requiredDeposit: Math.max(0, titular.requiredDeposit - titular.paidAmount),
        currency: tourCurrency,
        bankDetails,
        // PENDING: el grupo ya se registró y solo falta el anticipo.
        isRegistered: titular.bookingStatus === BOOKING_STATUS.PENDING,
      })
    : null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            data-tour={TOUR_TARGET.DASHBOARD_ACTION_WHATSAPP}
            onClick={(event) => event.stopPropagation()}
            className={base}
          >
            <WhatsAppIcon className="h-4 w-4" />
          </a>
        ) : (
          <span
            role="link"
            aria-disabled="true"
            aria-label={`${label} (no disponible)`}
            data-tour={TOUR_TARGET.DASHBOARD_ACTION_WHATSAPP}
            tabIndex={0}
            className={`${base} cursor-not-allowed opacity-50`}
          >
            <WhatsAppIcon className="h-4 w-4" />
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white"
      >
        {url
          ? titular.bookingStatus === BOOKING_STATUS.PENDING
            ? "Enviar recordatorio de pago por WhatsApp"
            : "Enviar Magic Link y datos de pago por WhatsApp"
          : "El titular no tiene un WhatsApp válido"}
      </TooltipContent>
    </Tooltip>
  );
}
