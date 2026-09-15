"use client";

import { useState } from "react";
import { TitularRowDTO, TravelersTable } from "./TravelersTable";
import { TravelerDetailDrawer } from "./TravelerDetailDrawer";
import { TravelersTableToolbar } from "./TravelersTableToolbar";
import { TourDashboardHeader } from "./TourDashboardHeader";
import { PaymentValidationModal } from "./PaymentValidationModal";
import { useTourDashboardByTourId } from "../hooks/useTourDashboard";
import { QuickReservationModal } from "./QuickReservationModal";

export function TourDashboardView({ tourId }: { tourId: string }) {
  const { data: tour, isLoading, isError, error } = useTourDashboardByTourId(tourId);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [formFilter, setFormFilter] = useState("ALL");

  const [selectedTravelerId, setSelectedTravelerId] = useState<string | null>(null);
  const [validatingPaymentId, setValidatingPaymentId] = useState<string | null>(null);
  const [isQuickReservationOpen, setIsQuickReservationOpen] = useState(false);

  if (isError) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
          <h3 className="mb-2 text-lg font-bold">Error cargando el Centro de Control</h3>
          <p className="rounded border border-red-200 bg-red-100/50 p-3 font-mono text-sm">
            {error instanceof Error ? error.message : "Error desconocido"}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || !tour) {
    return <DashboardSkeleton />;
  }

  const foundTraveler = selectedTravelerId
    ? (tour.travelers
        .flatMap((titular) => [titular, ...titular.companions])
        .find((traveler) => traveler.id === selectedTravelerId) ?? null)
    : null;

  return (
    <main className="flex h-full min-h-screen flex-col bg-slate-50">
      <TourDashboardHeader
        title={tour.title}
        date={tour.departureDateTime}
        metrics={tour.metrics}
        onNewReservation={() => setIsQuickReservationOpen(true)}
      />

      <div className="flex-1 space-y-4 p-4 md:p-6">
        <TravelersTableToolbar
          travelers={tour.travelers}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          paymentFilter={paymentFilter}
          onPaymentFilterChange={setPaymentFilter}
          formFilter={formFilter}
          onFormFilterChange={setFormFilter}
          onAddTravelerClick={() => alert("Abrir modal")}
        />

        <TravelersTable
          travelers={tour.travelers as TitularRowDTO[]}
          searchQuery={searchQuery}
          paymentFilter={paymentFilter}
          formFilter={formFilter}
          onRowClick={(id) => setSelectedTravelerId(id)}
          onValidatePaymentClick={(id) => setValidatingPaymentId(id)}
        />
      </div>

      {/* Drawer Lateral conectado con el objeto encontrado */}
      <TravelerDetailDrawer
        tourId={tourId}
        traveler={foundTraveler}
        isOpen={!!selectedTravelerId}
        onClose={() => setSelectedTravelerId(null)}
      />

      {validatingPaymentId && (
        <PaymentValidationModal
          travelerId={validatingPaymentId}
          isOpen={!!validatingPaymentId}
          onClose={() => setValidatingPaymentId(null)}
        />
      )}

      <QuickReservationModal
        tourId={tourId}
        isOpen={isQuickReservationOpen}
        onClose={() => setIsQuickReservationOpen(false)}
      />
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="h-32 w-full rounded-xl bg-slate-200"></div>
      <div className="h-14 w-full rounded-xl bg-slate-200"></div>
      <div className="h-96 w-full rounded-xl bg-slate-200"></div>
    </div>
  );
}
