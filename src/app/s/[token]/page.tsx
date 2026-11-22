import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Clock } from "lucide-react";
import { PublicBookingHeader } from "@/components/layout/public/PublicBookingHeader";
import { StaffShareMessageScreen } from "@/features/staff-share/components/StaffShareMessageScreen";
import { StaffShareView } from "@/features/staff-share/components/StaffShareView";
import { fetchStaffShare } from "@/features/staff-share/utils/fetch-staff-share";
import { formatMexicoDateTime, formatSpanishLongDate } from "@/shared/utils/tour-date.util";

// Enlace privado del coordinador: título neutro y sin indexar.
export const metadata: Metadata = {
  title: "Croquis del viaje",
  robots: { index: false, follow: false },
};

interface StaffSharePageProps {
  params: Promise<{ token: string }>;
}

/** Croquis y lista de pasajeros de solo lectura para el staff (sin cuenta, 2026-11-22). */
export default async function StaffSharePage({ params }: StaffSharePageProps) {
  const { token } = await params;
  const result = await fetchStaffShare(token);

  if (result.kind === "not-found") notFound();
  if (result.kind === "error") return <StaffShareMessageScreen message={result.message} />;

  const { data } = result;
  const expiresAt = formatMexicoDateTime(data.expiresAt);

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8ff] font-sans text-slate-800 antialiased">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-6">
        <PublicBookingHeader
          agencyName={data.agency.name}
          agencyLogoPath={data.agency.logoPath}
          statusBadgeText="Enlace para staff · solo lectura"
          statusVariant="neutral"
          tourTitle={data.tour.title}
          departureDate={data.tour.departureDate}
        />

        <div className="mb-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
          {data.tour.returnDate && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              Regreso: {formatSpanishLongDate(data.tour.returnDate)}
            </span>
          )}
          {expiresAt && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              Vigente hasta {expiresAt} (hora CDMX)
            </span>
          )}
        </div>

        <main className="w-full min-w-0 flex-1">
          <StaffShareView data={data} />
        </main>

        <footer className="mt-8 text-center text-[11px] font-medium text-slate-400">
          ⚡ Potenciado por <span className="font-bold text-slate-500">TripAgent</span>
        </footer>
      </div>
    </div>
  );
}
