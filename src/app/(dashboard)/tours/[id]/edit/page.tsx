"use client";

import { Button } from "@/components/ui/button";
import { TourForm } from "@/features/tours/components/TourForm";
import { useTourById } from "@/features/tours/hooks/useTours";
import { isTourReadOnly } from "@/features/tours/utils/tour-read-only.util";
import { TOUR_TEMPORAL_STATUS } from "@/shared/constants/domain.constants";
import { QueryErrorState } from "@/components/shared/QueryErrorState";
import { isNotFoundError } from "@/lib/api-error";
import { ChevronLeft, Lock } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function EditTourPage() {
  const params = useParams<{ id: string }>();
  const { data: tour, isLoading, isError, error, refetch, isFetching } = useTourById(params.id);

  if (isLoading) {
    return <div className="animate-pulse p-10 text-center">Cargando datos del tour...</div>;
  }

  if (!tour) {
    if (isError && !isNotFoundError(error)) {
      return (
        <div className="mx-auto max-w-3xl p-6">
          <QueryErrorState
            resourceArticle="el"
            resourceName="tour"
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      );
    }
    return <div className="text-destructive p-10 text-center">Tour no encontrado.</div>;
  }

  // Modo Auditoría (OBS-004): un tour finalizado o cancelado no se edita (la API responde 409).
  if (isTourReadOnly(tour)) {
    const isCancelled = tour.temporalStatus === TOUR_TEMPORAL_STATUS.CANCELLED;
    return (
      <div className="mx-auto max-w-xl p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <Lock className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-slate-900">
            {isCancelled ? "Este tour fue cancelado" : "Este tour ya finalizó"}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Está en modo de solo consulta y ya no se puede editar. Puedes revisar sus reservas y
            pagos en el Centro de Control.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <Button asChild>
              <Link href={`/tours/${tour.id}`}>Ir al Centro de Control</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/tours">Volver a Lista de Tours</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <div className="mx-auto flex max-w-7xl items-center">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="-ml-2 text-slate-500 hover:text-slate-900"
          >
            <Link href="/tours">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Volver a Lista de Tours
            </Link>
          </Button>
          <span className="mx-2 text-slate-300">/</span>
        </div>
      </div>

      <div className="container mx-auto flex justify-center px-4 py-6">
        <div className="w-full max-w-3xl space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Editar Tour: {tour.title}
            </h2>
          </div>
          <TourForm tour={tour} />
        </div>
      </div>
    </>
  );
}
