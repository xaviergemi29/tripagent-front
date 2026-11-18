import { PublicTourOutput } from "@/features/public-tours/public-tour.schema";
import { PublicBookingLayout } from "@/components/layout/public/PublicBookingLayout";
import { FileText, FileDown, Bus, Footprints } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatLocalDate,
  formatPickupTime,
  formatSpanishLongDate,
  getEarliestBoardingTime,
} from "@/shared/utils/tour-date.util";
import { formatCurrency } from "@/shared/utils/currency.util";
import { TourSchedule } from "@/features/public-tours/components/TourSchedule";
import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrochureAvailability } from "@/features/public-tours/components/BrochureAvailability";
import { BrochureCallToAction } from "@/features/public-tours/components/BrochureCallToAction";
import { DEFAULT_CURRENCY } from "@/shared/constants/domain.constants";
import {
  buildApiPublicFileUrl,
  buildWhatsAppUrl,
  toPhoneDigits,
} from "@/shared/utils/share-links.util";
import { getStoredPhoneCountry } from "@/shared/utils/phone.util";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { API_BASE_URL } from "@/lib/api-config";

/** Chat con un asesor para resolver dudas antes de reservar (CTA secundario). */
function buildWhatsAppAdvisorUrl({
  agencyPhone,
  tourName,
  departureDate,
}: {
  agencyPhone: string | null;
  tourName: string;
  departureDate: string;
}) {
  if (!toPhoneDigits(agencyPhone)) return null;

  const message = `¡Hola! Vi el folleto digital de *${tourName}* (${departureDate}) y tengo algunas dudas antes de reservar.`;
  return buildWhatsAppUrl(agencyPhone, { message });
}

// `cache`: `generateMetadata` y la página piden el mismo tour en una sola llamada a la API.
const getPublicTour = cache(async (tourId: string): Promise<PublicTourOutput | null> => {
  try {
    const apiUrl = `${API_BASE_URL}/tour-brochure/public/tours/${tourId}`;
    const res = await fetch(apiUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("[Next.js Server] Error crítico de red en fetch:", error);
    return notFound();
  }
});

/**
 * Título y vista previa del folleto (pestaña y tarjeta al compartir el enlace por WhatsApp): el
 * nombre del tour y de la agencia, no "Panel de Administración" (2026-11-16).
 */
export async function generateMetadata({ params }: PublicTourLanding): Promise<Metadata> {
  const { id } = await params;
  const tour = await getPublicTour(id);
  if (!tour) return { title: "Folleto no disponible", robots: { index: false } };

  const title = `${tour.title} | ${tour.agency.name}`;
  const description = `Salida: ${formatSpanishLongDate(tour.departureDateTime)}. Consulta horarios, puntos de abordaje y aparta tu lugar.`;
  return {
    title: { absolute: title },
    description,
    openGraph: { title, description, type: "website", locale: "es_MX", siteName: tour.agency.name },
  };
}

interface PublicTourLanding {
  params: Promise<{ id: string }>;
}

export default async function PublicTourLanding({ params }: PublicTourLanding) {
  const { id: tourId } = await params;
  const tour = await getPublicTour(tourId);

  if (!tour) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8 text-center text-slate-500">
        La excursión no fue encontrada o ya no está disponible.
      </div>
    );
  }

  const currency = tour.currency || DEFAULT_CURRENCY;
  const isHiking = tour.transportModality === "INDEPENDENT_ACCESS";
  const formattedDepartureDate = formatLocalDate(tour.departureDateTime);

  // El folleto se sirve en <origen de la API>/public/… (sin /api), igual que en TourForm.
  const pdfUrl = tour.brochureUrl ? buildApiPublicFileUrl(tour.brochureUrl) : null;

  const whatsappUrl = buildWhatsAppAdvisorUrl({
    agencyPhone: tour.agency.phone,
    tourName: tour.title,
    departureDate: formattedDepartureDate,
  });
  const { isBookable, hasDeparted, acceptsOnlineBookings } = tour.availability;
  // Decisión del PM: un tour que ya salió se ve "Finalizado" (no "Agotado") y no acepta reservas.
  // Agencia en Modo Solo Lectura (2026-11-18): "Reservas en pausa"; el WhatsApp sigue disponible.
  const unavailableLabel = hasDeparted
    ? "Finalizado"
    : acceptsOnlineBookings === false
      ? "Reservas en pausa"
      : "Agotado";

  // Hora más temprana sin reordenar la lista "Puntos de Abordaje", que conserva el orden capturado
  // por el operador (misma regla que el listado de /tours).
  const firstBoardingTime = getEarliestBoardingTime(tour.boardingPoints);

  return (
    // pb-40: espacio para el CTA fijo inferior (BrochureCallToAction).
    <PublicBookingLayout
      className="pb-40"
      headerProps={{
        agencyName: tour.agency.name,
        agencyLogoPath: tour.agency.logoPath,
        statusBadgeText: isBookable ? "Folleto oficial de viaje" : unavailableLabel,
        statusVariant: isBookable ? "brand" : "neutral",
        tourTitle: tour.title,
        departureDate: tour.departureDateTime,
      }}
      footerProps={{
        agencyName: tour.agency.name,
        // El CTA fijo ya ofrece "Contactar asesor por WhatsApp": no se repite en el pie.
        agencyWhatsApp: null,
      }}
    >
      {/* 2. HERO CARD (Info General) */}
      {/* El nombre del tour y la salida van en el encabezado común; aquí queda el itinerario. */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <TourSchedule
          startDate={tour.departureDateTime}
          endDate={tour.returnDate}
          departureTime={firstBoardingTime}
        />
      </section>

      {/* 3. PRECIO Y ANTICIPO */}
      <section className="space-y-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Precio por Persona
          </span>
          <div className="mt-0.5">
            {/* formatCurrency ya incluye el código de divisa ("$1,000.00 MXN"). */}
            <span className="text-3xl font-black text-indigo-950">
              {formatCurrency(tour.price, { currency })}
            </span>
          </div>
        </div>

        {tour.depositPerPerson > 0 && (
          <div className="flex items-center justify-between rounded-2xl border border-indigo-100/60 bg-indigo-50/50 p-3">
            <span className="text-xs leading-tight font-semibold text-slate-600">
              Anticipo para
              <br />
              reservar
            </span>
            <Badge className="rounded-full bg-emerald-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-sm hover:bg-emerald-400">
              Aparta con {formatCurrency(tour.depositPerPerson, { currency })}
            </Badge>
          </div>
        )}
      </section>

      {/* 3.1 OCUPACIÓN EN VIVO (FOMO) */}
      <BrochureAvailability availability={tour.availability} />

      {/* 4. PUNTOS DE ABORDAJE */}
      {tour.boardingPoints && tour.boardingPoints.length > 0 && (
        <section className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              {isHiking ? <Footprints className="h-4 w-4" /> : <Bus className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="text-base leading-tight font-bold text-slate-900">
                {isHiking ? "Punto de Encuentro" : "Puntos de Abordaje"}
              </h3>
              <p className="text-xs text-slate-500">Puntualidad en salida y retorno</p>
            </div>
          </div>

          <div className="space-y-2">
            {tour.boardingPoints.map((stop) => (
              <div
                key={stop.id}
                className="flex items-center justify-between rounded-2xl border border-indigo-100/50 bg-indigo-50/40 p-3.5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                  <span className="text-sm font-bold text-slate-800">{stop.location}</span>
                </div>
                <Badge
                  variant="secondary"
                  className="rounded-lg bg-indigo-100/70 px-2.5 py-0.5 text-xs font-bold text-indigo-950"
                >
                  {formatPickupTime(stop.time)}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. PDF ITINERARIO (Condicional) */}
      {pdfUrl && (
        <section className="space-y-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base leading-tight font-bold text-slate-900">
                Itinerario Completo
              </h3>
              <p className="text-xs text-slate-500">
                Consulta todos los detalles y recomendaciones del viaje
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="secondary"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/80 py-5 font-bold text-indigo-700 hover:bg-indigo-100"
          >
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <FileDown className="h-4 w-4" />
              Descargar Folleto (PDF)
            </a>
          </Button>
        </section>
      )}

      {/* 6. GUÍA CÓMO APARTAR */}
      <section className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <WhatsAppIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base leading-tight font-bold text-slate-900">
              ¿Cómo apartar tu lugar?
            </h3>
            <p className="text-xs text-slate-500">Paso a paso fácil y seguro</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-2xl bg-indigo-50/40 p-3.5">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-700 text-xs font-bold text-white">
              1
            </span>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Toca “Iniciar Reserva”</h4>
              <p className="mt-0.5 text-[11px] leading-tight text-slate-600">
                ¿Dudas antes? Escribe a tu asesor de {tour.agency.name} por WhatsApp.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl bg-indigo-50/40 p-3.5">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-700 text-xs font-bold text-white">
              2
            </span>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Indica cuántos viajan</h4>
              <p className="mt-0.5 text-[11px] leading-tight text-slate-600">
                Solo tu nombre, tu WhatsApp y la cantidad de lugares.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl bg-indigo-50/40 p-3.5">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
              3
            </span>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Confirma por WhatsApp</h4>
              <p className="mt-0.5 text-[11px] leading-tight text-slate-600">
                Te enviamos tu enlace y aseguras tu lugar con el anticipo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CTA FIJO INFERIOR: Iniciar Reserva (primario) + WhatsApp (secundario) */}
      <BrochureCallToAction
        tourId={tour.id}
        tourTitle={tour.title}
        whatsappUrl={whatsappUrl}
        availableSeats={tour.availability.availableSeats}
        isBookable={isBookable}
        unavailableLabel={unavailableLabel}
        defaultPhoneCountry={getStoredPhoneCountry(tour.agency.phone)}
      />
    </PublicBookingLayout>
  );
}
