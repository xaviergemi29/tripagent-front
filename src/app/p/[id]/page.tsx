import { PublicTourOutput } from "@/features/public-tours/public-tour.schema";
import { FileText, FileDown, Bus, Footprints } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatLocalDate } from "@/shared/utils/tour-date.util";
import { formatCurrency } from "@/shared/utils/currency.util";
import { TourSchedule } from "@/features/public-tours/components/TourSchedule";
import { notFound } from "next/navigation";
import { BrochureAvailability } from "@/features/public-tours/components/BrochureAvailability";
import { BrochureCallToAction } from "@/features/public-tours/components/BrochureCallToAction";
import { DEFAULT_CURRENCY } from "@/shared/constants/domain.constants";
import { buildWhatsAppUrl, toPhoneDigits } from "@/shared/utils/share-links.util";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";

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
  return buildWhatsAppUrl(agencyPhone, { countryCode: "52", message });
}

async function getPublicTour(tourId: string): Promise<PublicTourOutput | null> {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/tour-brochure/public/tours/${tourId}`;
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

  const pdfUrl = tour.brochureUrl ? `http://192.168.1.73/public${tour.brochureUrl}` : null;

  const whatsappUrl = buildWhatsAppAdvisorUrl({
    agencyPhone: tour.agency.phone,
    tourName: tour.title,
    departureDate: formattedDepartureDate,
  });
  const { isBookable } = tour.availability;

  const firstBoardingTime =
    tour.boardingPoints?.length > 0
      ? tour.boardingPoints.sort((a, b) => a.time.localeCompare(b.time))[0].time
      : null;

  return (
    <div className="min-h-screen bg-[#faf8ff] pb-40 text-slate-800 selection:bg-indigo-100 selection:text-indigo-900">
      {/* 1. CABECERA PÚBLICA */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 px-4 py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-700 text-sm font-bold text-white shadow-sm">
              {tour.agency.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="max-w-[180px] truncate text-sm leading-tight font-bold text-slate-900">
                {tour.agency.name}
              </h1>
              <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                Folleto Digital
              </span>
            </div>
          </div>
          {isBookable ? (
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-700"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Disponible
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="gap-1.5 border-red-200 bg-red-50 px-2.5 py-0.5 text-xs text-red-700"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Agotado
            </Badge>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 pt-5">
        {/* 2. HERO CARD (Info General) */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="mb-1 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
            Folleto Oficial de Viaje
          </p>
          <h2 className="mb-4 text-2xl leading-tight font-black text-slate-900">{tour.title}</h2>
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
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-3xl font-black text-indigo-950">
                {formatCurrency(tour.price, { currency: tour.currency })}
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase">{currency}</span>
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
                Aparta con {formatCurrency(tour.depositPerPerson, { currency: tour.currency })}
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
                    {stop.time}
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

        {/* Footer TripAgent */}
        <div className="pt-2 text-center">
          <a
            href="https://tripagent.mx"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-medium text-slate-400 transition-colors hover:text-indigo-500"
          >
            ⚡ Potenciado por <span className="font-bold text-slate-500">TripAgent</span>
          </a>
        </div>
      </main>

      {/* 7. CTA FIJO INFERIOR: Iniciar Reserva (primario) + WhatsApp (secundario) */}
      <BrochureCallToAction
        tourId={tour.id}
        tourTitle={tour.title}
        whatsappUrl={whatsappUrl}
        availableSeats={tour.availability.availableSeats}
        isBookable={isBookable}
      />
    </div>
  );
}
