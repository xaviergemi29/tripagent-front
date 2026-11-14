import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { PublicBookingLayout } from "@/components/layout/public/PublicBookingLayout";
import { DEFAULT_CURRENCY } from "@/shared/constants/domain.constants";
import { formatCurrency } from "@/shared/utils/currency.util";
import { resolveBoardingPointDisplay } from "@/shared/utils/boarding-point.util";
import { buildWhatsAppUrl, toPhoneDigits } from "@/shared/utils/share-links.util";
import type { PaidBookingOutput } from "@/features/external-registration/schemas/paid-booking.schema";
import { TravelerTicketCard } from "@/features/external-registration/components/TravelerTicketCard";
import { TourInstructionsCard } from "@/features/external-registration/components/TourInstructionsCard";
import { DownloadStatementButton } from "@/features/external-registration/components/DownloadStatementButton";

type PaidBookingViewProps = PaidBookingOutput & {
  token?: string;
  /** Logotipo de la agencia (`meta.agency.logoPath` del Magic Link). */
  agencyLogoPath?: string | null;
};

/** Barras del código ilustrativo (anchos relativos). Es decorativo: no codifica ningún dato. */
const BARCODE_PATTERN = [3, 1, 2, 1, 4, 1, 1, 3, 2, 1, 1, 2, 4, 1, 2, 3, 1, 1, 2, 1, 3, 2, 1, 4];

/**
 * Vista del Magic Link para `flowState = "PAID"`: pase de abordaje digital con un boleto por
 * viajero activo, estado de pago liquidado y contacto con la agencia por WhatsApp.
 */
export function PaidBookingView({
  tourInfo,
  financials,
  passengers = [],
  agency,
  groupSize,
  paymentHistory = [],
  agencyLogoPath,
}: PaidBookingViewProps) {
  const currency = tourInfo.currency || DEFAULT_CURRENCY;

  // Solo pasajeros activos; el titular siempre es el viajero 1.
  const travelers = passengers
    .filter((p) => p.status !== "CANCELLED")
    .sort((a, b) => Number(b.isTitular) - Number(a.isTitular));

  const titularName = travelers.find((p) => p.isTitular)?.name;
  const phoneDigits = toPhoneDigits(agency.phone);
  const whatsappUrl = phoneDigits
    ? buildWhatsAppUrl(phoneDigits, {
        // Los teléfonos de agencia se capturan a 10 dígitos; wa.me requiere la lada de país.
        countryCode: phoneDigits.length === 10 ? "52" : "",
        message: `¡Hola, ${agency.name}! ${
          titularName ? `Soy ${titularName}, tengo` : "Tengo"
        } mi pase de abordaje para el viaje "${tourInfo.title}" y me gustaría hacerles una consulta.`,
      })
    : null;

  return (
    <PublicBookingLayout
      headerProps={{
        agencyName: agency.name,
        agencyLogoPath,
        statusBadgeText: "100% liquidado • Viaje confirmado",
        statusVariant: "success",
        tourTitle: tourInfo.title,
        departureDate: tourInfo.departureDateTime,
      }}
      footerProps={{
        agencyName: agency.name,
        // Esta vista ya tiene su botón "Contactar a la agencia o guía": no se repite en el pie.
        agencyWhatsApp: null,
        closingNote: `${agency.address ? `${agency.address} • ` : ""}¡Buen viaje! Nos vemos en el punto de encuentro.`,
      }}
    >
      <p className="text-center text-sm text-slate-600">
        Revisa los detalles de cada viajero para abordar el día del viaje.
      </p>

      {/* Confirmación */}
      <section className="flex items-center gap-3.5 rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">¡Todo listo para viajar!</h2>
          <p className="text-sm leading-snug text-slate-600">
            Tu viaje está totalmente liquidado. Muestra este pase desde tu celular al subir.
          </p>
        </div>
      </section>

      {/* Boletos individuales */}
      <section className="space-y-3" aria-label="Boletos de los viajeros">
        {travelers.map((traveler, idx) => (
          <TravelerTicketCard
            key={`${traveler.name}-${idx}`}
            index={idx + 1}
            isTitular={traveler.isTitular}
            name={traveler.name}
            seatLabel={traveler.seatLabel}
            boardingPoint={resolveBoardingPointDisplay(traveler)}
          />
        ))}
      </section>

      {/* Indicaciones de logística del tour (Instrucciones Post-Pago) */}
      <TourInstructionsCard instructions={tourInfo.postPaymentInstructions} />

      {/* Código de barras ilustrativo */}
      <section className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-sm">
        <svg
          viewBox={`0 0 ${BARCODE_PATTERN.reduce((sum, w) => sum + w + 1, 0)} 40`}
          preserveAspectRatio="none"
          className="mx-auto h-12 w-56 text-slate-900"
          aria-hidden
        >
          {
            BARCODE_PATTERN.reduce<{ x: number; bars: ReactNode[] }>(
              (acc, width, i) => {
                acc.bars.push(
                  <rect key={i} x={acc.x} y={0} width={width} height={40} fill="currentColor" />,
                );
                acc.x += width + 1;
                return acc;
              },
              { x: 0, bars: [] },
            ).bars
          }
        </svg>
        <p className="text-xs text-slate-600">
          Presenta este boleto digital en tu teléfono al momento de subir al autobús.
        </p>
      </section>

      {/* Estado de pago */}
      <PaymentSettledBadge amountLabel={formatCurrency(financials.totalAmount, { currency })} />

      {/* Estado de cuenta PDF (100% liquidado) */}
      <DownloadStatementButton
        className="h-11 text-sm"
        source={{
          tourInfo,
          groupSize,
          financials,
          paymentHistory,
          passengers,
          agency,
        }}
      />

      {/* Contacto */}
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 font-semibold text-white shadow-sm shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-[0.98]"
        >
          <WhatsAppIcon className="h-5 w-5" />
          Contactar a la agencia o guía
        </a>
      )}
    </PublicBookingLayout>
  );
}

function PaymentSettledBadge({ amountLabel }: { amountLabel: string }) {
  return (
    <section className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-wider text-slate-900 uppercase">
            Pago completado
          </p>
          <p className="text-xs text-slate-600">{amountLabel} cubierto • Sin saldo pendiente</p>
        </div>
      </div>
      <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        100% Pagado
      </span>
    </section>
  );
}
