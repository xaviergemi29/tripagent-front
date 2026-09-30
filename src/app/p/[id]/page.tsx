import { PublicTourOutput } from "@/features/public-tours/public-tour.schema";
import { Calendar, FileText, Clock, ShieldCheck, FileDown, Bus, Footprints } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatLocalDate } from "@/shared/utils/tour-date.util";

function buildWhatsAppBrochureUrl({
  agencyPhone,
  tourName,
  departureDate,
  depositAmount,
  currency,
}: {
  agencyPhone: string;
  tourName: string;
  departureDate: string;
  depositAmount?: number | null;
  currency?: string;
}) {
  const cleanPhone = agencyPhone.replace(/\D/g, "");
  let message = `¡Hola! Vi el folleto digital de *${tourName}* (${departureDate}) y me gustaría apartar mis lugares.`;

  if (depositAmount && depositAmount > 0) {
    message += ` Vi que se aparta con $${depositAmount.toLocaleString()} ${currency} por persona. ¿Me podrías confirmar lugares disponibles?`;
  } else {
    message += ` ¿Me podrías confirmar disponibilidad de asientos?`;
  }

  return `https://wa.me/52${cleanPhone}?text=${encodeURIComponent(message)}`;
}

async function getPublicTour(tourId: string): Promise<PublicTourOutput | null> {
  try {
    const apiUrl = `http://localhost:3001/api/tour-brochure/public/tours/${tourId}`;
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
    return null;
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PublicTourLanding({ params }: PageProps) {
  const { id: tourId } = await params;
  const tour = await getPublicTour(tourId);

  if (!tour) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8 text-center text-slate-500">
        La excursión no fue encontrada o ya no está disponible.
      </div>
    );
  }

  const currency = tour.currency || "MXN";
  const hasDeposit = tour.depositPerPerson && Number(tour.depositPerPerson) > 0;
  const isHiking = tour.transportModality === "INDEPENDENT_ACCESS";
  const formattedDepartureDate = formatLocalDate(tour.departureDateTime);

  const pdfUrl = tour.brochureUrl ? `http://localhost:3001/public${tour.brochureUrl}` : null;

  const whatsappUrl = buildWhatsAppBrochureUrl({
    agencyPhone: tour.agency.phone || "",
    tourName: tour.title,
    departureDate: formattedDepartureDate,
    depositAmount: Number(tour.depositPerPerson),
    currency,
  });

  return (
    <div className="min-h-screen bg-[#faf8ff] pb-28 text-slate-800 selection:bg-indigo-100 selection:text-indigo-900">
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
          <Badge
            variant="outline"
            className="gap-1.5 border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-700"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Disponible
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 pt-5">
        {/* 2. HERO CARD (Info General) */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge className="gap-1 bg-indigo-700 px-3 py-1 text-xs text-white hover:bg-indigo-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              {tour.agency.name.toUpperCase()}
            </Badge>
            <Badge
              variant="outline"
              className="gap-1 border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              {isHiking ? "Hiking / Senderismo" : "Excursión Programada"}
            </Badge>
          </div>

          <p className="mb-1 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
            Folleto Oficial de Viaje
          </p>
          <h2 className="mb-4 text-2xl leading-tight font-black text-slate-900">{tour.title}</h2>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-indigo-100/60 bg-indigo-50/70 px-3.5 py-2 text-xs font-semibold text-indigo-900">
              <Calendar className="h-4 w-4 shrink-0 text-indigo-600" />
              <span>{formattedDepartureDate}</span>
            </div>
            {tour.durationHours > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-slate-100/80 px-3.5 py-2 text-xs font-semibold text-slate-700">
                <Clock className="h-4 w-4 shrink-0 text-slate-500" />
                <span>{tour.durationHours} hrs aprox.</span>
              </div>
            )}
          </div>
        </section>

        {/* 3. INVERSIÓN Y ANTICIPO */}
        <section className="space-y-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Inversión por Persona
            </span>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-3xl font-black text-indigo-950">
                ${Number(tour.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase">{currency}</span>
            </div>
          </div>

          {hasDeposit && (
            <div className="flex items-center justify-between rounded-2xl border border-indigo-100/60 bg-indigo-50/50 p-3">
              <span className="text-xs leading-tight font-semibold text-slate-600">
                Anticipo para
                <br />
                reservar
              </span>
              <Badge className="rounded-full bg-emerald-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-sm hover:bg-emerald-400">
                Aparta con ${Number(tour.depositPerPerson).toLocaleString("es-MX")} {currency}
              </Badge>
            </div>
          )}
        </section>

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
                <p className="text-xs text-slate-500">Consulta todos los detalles del viaje</p>
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
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
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
                <h4 className="text-xs font-bold text-slate-900">Toca el botón de WhatsApp</h4>
                <p className="mt-0.5 text-[11px] leading-tight text-slate-600">
                  Te abrirá un chat directo con tu asesor de {tour.agency.name}.
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
                  Revisaremos disponibilidad en el transporte.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-indigo-50/40 p-3.5">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                3
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Aparta tus lugares</h4>
                <p className="mt-0.5 text-[11px] leading-tight text-slate-600">
                  Asegura tu cupo con el anticipo mediante transferencia o efectivo.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer TripAgent */}
        <div className="pt-2 pb-6 text-center">
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

      {/* 7. CTA STICKY INFERIOR */}
      <footer className="fixed right-0 bottom-0 left-0 z-50 border-t border-slate-100 bg-white/90 p-4 backdrop-blur-md">
        <div className="mx-auto max-w-md">
          <Button
            asChild
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#008069] py-6 text-base font-bold text-white shadow-lg shadow-emerald-900/10 transition-all hover:bg-[#006e5a] active:scale-[0.98]"
          >
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              {/* <WhatsAppIcon className="h-5 w-5 fill-white" /> */}
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
              Apartar por WhatsApp
            </a>
          </Button>
        </div>
      </footer>
    </div>
  );
}
