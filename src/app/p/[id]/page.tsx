import { PublicTourOutput } from "@/features/public-tours/public-tour.schema";
import { MapPin, Calendar, FileText } from "lucide-react";

async function getPublicTour(id: string): Promise<PublicTourOutput | null> {
  try {
    // const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/public/tours/${id}`;
    const apiUrl = `http://localhost:3001/api/tour-brochure/public/tours/${id}`;

    const res = await fetch(apiUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error(`[Next.js Server] Error HTTP ${res.status} - ${res.statusText}`);

      const errorBody = await res.text();
      console.error(`[Next.js Server] Detalles del backend:`, errorBody);

      return null;
    }

    return await res.json();
  } catch (error) {
    console.error("[Next.js Server] Error crítico de red en fetch:", error);
    return null;
  }
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PublicTourLanding({ params }: PageProps) {
  const { id } = await params;
  const tour = await getPublicTour(id);

  if (!tour) {
    return (
      <div className="p-8 text-center text-slate-500">
        Tour no encontrado o ya no está disponible.
      </div>
    );
  }

  const cleanPhone = tour.agency.phone?.replace(/\D/g, "") || "";
  const whatsappMessage = encodeURIComponent(
    `Hola, vi el folleto de la *${tour.title}*.\n\nQuiero solicitar lugares. ¿Aún tienen disponibilidad?`,
  );
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${whatsappMessage}`;
  //   const pdfUrl = tour.brochureUrl
  //     ? `${process.env.NEXT_PUBLIC_API_URL}/public${tour.brochureUrl}`
  //     : null;

  const pdfUrl = tour.brochureUrl ? `http://localhost:3001/public${tour.brochureUrl}` : null;

  return (
    <main className="relative min-h-screen bg-slate-50 pb-28">
      {/* 1. Cabecera de Marca (Mayor Jerarquía) */}
      <header className="bg-white py-5 shadow-sm">
        <div className="mx-auto max-w-md px-6 text-center">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-black text-indigo-700 shadow-inner">
            {tour.agency.name.charAt(0)}
          </div>
          <h1 className="text-lg font-black tracking-wider text-slate-800 uppercase">
            {tour.agency.name}
          </h1>
        </div>
      </header>

      <section className="mx-auto mt-6 max-w-md space-y-6 px-4">
        {/* 2. Tarjeta Hero (Imagen + Título + Urgencia) */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Imagen de Portada */}
          <div className="relative h-48 w-full bg-slate-200">
            <img
              src={
                "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1200"
              }
              alt={tour.title}
              className="h-full w-full object-cover"
            />
            {/* Gradiente sutil inferior para fusionar con la tarjeta */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>

          <div className="p-6 text-center">
            <h2 className="text-2xl leading-tight font-extrabold text-slate-900">{tour.title}</h2>

            <div className="mt-4 flex flex-col items-center gap-2 text-sm font-medium text-slate-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-500" />
                {new Date(tour.departureDateTime).toLocaleDateString("es-MX", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>

              <div className="mt-2 flex flex-col items-center">
                <span className="text-2xl font-black text-emerald-600">
                  {tour.price.toLocaleString("es-MX", { style: "currency", currency: "MXN" })} MXN
                </span>
                {/* Microcopy de Urgencia */}
                <span className="mt-1.5 inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-bold tracking-wide text-orange-700 uppercase">
                  🔥 Cupo Limitado
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. El PDF de Alfredo */}
        {pdfUrl && (
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="...">
            <FileText className="..." /> Ver Itinerario Completo (PDF)
          </a>
        )}

        {/* 4. Logística */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800 uppercase">
            <MapPin className="h-4 w-4 text-slate-400" /> Puntos de Abordaje
          </h3>
          <div className="space-y-3">
            {tour.boardingPoints.map((point) => (
              <div
                key={point.id}
                className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm"
              >
                <span className="font-medium text-slate-700">{point.location}</span>
                <span className="rounded bg-white px-2 py-1 font-mono font-bold text-indigo-600 shadow-sm">
                  {point.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="pt-5 pb-5 text-center">
        <a
          href="https://tripagent.mx"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-medium text-slate-400 transition-colors hover:text-indigo-500"
        >
          ⚡ Potenciado por <span className="font-bold text-slate-500">TripAgent</span> -
          Sistematiza tu agencia
        </a>
      </div>

      {/* 5. CTA Killer con Logo Oficial de WhatsApp */}
      <div className="fixed right-0 bottom-0 left-0 z-50 bg-gradient-to-t from-white via-white/90 px-4 pt-8 pb-6">
        <div className="mx-auto max-w-md">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full animate-bounce items-center justify-center gap-2.5 rounded-full bg-[#25D366] px-8 py-4 text-lg font-black text-white shadow-xl shadow-green-600/20 transition-transform hover:scale-[1.02] active:scale-95"
            style={{ animationDuration: "3s" }}
          >
            {/* SVG Oficial de WhatsApp (Path limpio, cero dependencias) */}
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
            Solicitar mis lugares
          </a>
        </div>
      </div>
    </main>
  );
}
