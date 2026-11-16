"use client";

import { useState } from "react";
import {
  DEFAULT_DASHBOARD_TAB,
  type DashboardTab,
} from "@/features/tour-dashboard/constants/dashboard-tabs";
import { TOUR_TEMPORAL_STATUS } from "@/shared/constants/domain.constants";
import { CancelTourDialog } from "@/features/tour-dashboard/components/header/CancelTourDialog";
import { CancelledTourBanner } from "@/features/tour-dashboard/components/header/CancelledTourBanner";
import { RefundsPanel } from "@/features/tour-dashboard/components/finance/RefundsPanel";
import { TourDashboardHeader } from "@/features/tour-dashboard/components/header/TourDashboardHeader";
import { useTourDashboardByTourId } from "../hooks/useTourDashboard";
import { QuickReservationModal } from "@/features/tour-dashboard/components/passengers/QuickReservationModal";
import { DashboardTravelerTable } from "@/features/tour-dashboard/components/passengers/DashboardTravelerTable";
import { useAgency } from "@/features/settings/hooks/useAgency";
import { useAgencyBranding } from "@/features/settings/hooks/useAgencyBranding";
import { useDashboardFilters } from "../hooks/useDashboardFilters";
import {
  filterDashboardTravelers,
  findDashboardTraveler,
  getSeatEligiblePassengers,
} from "../utils/dashboard-travelers.util";
import { buildOperatorStatementAgency } from "../utils/statement-agency.util";

import { TravelersTableToolbar } from "@/features/tour-dashboard/components/passengers/TravelersTableToolbar";
import { TravelerDetailDrawer } from "@/features/tour-dashboard/components/finance/TravelerDetailDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import { TourTabsNav } from "@/features/tour-dashboard/components/header/TourTabsNav";
import { DesktopSeatingTab } from "@/features/tour-dashboard/components/seating/DesktopSeatingTab";
import { VehicleSelectionModal } from "@/features/tour-dashboard/components/seating/VehicleSelectionModal";
import { MobileHeader } from "./mobile/MobileHeader";
import { MobileKpiCards } from "./mobile/MobileKpiCards";
import { MobileTabsNav } from "./mobile/MobileTabsNav";
import { MobileFilters } from "./mobile/MobileFilters";
import { MobilePassengersList } from "./mobile/MobilePassengersList";
import { MobileSeatsTab } from "./mobile/MobileSeatsTab";
import {
  TOUR_DASHBOARD_GUIDED_TOUR,
  TOUR_TARGET,
} from "@/features/onboarding/constants/guided-tours";
import { useGuidedTour } from "@/features/onboarding/hooks/useGuidedTour";

interface TourDashboardViewProps {
  tourId: string;
}

export function TourDashboardView({ tourId }: TourDashboardViewProps) {
  const { data: tour, isLoading, isError, error } = useTourDashboardByTourId(tourId);
  // Datos de la agencia para el estado de cuenta PDF (perfil, banco y colores de marca).
  const { data: agency } = useAgency();
  const { data: branding } = useAgencyBranding();
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const { filters, setSearchQuery, setPaymentFilter, setFormFilter, setSeatFilter, clearFilters } =
    useDashboardFilters();

  // Modo Auditoría (solo lectura): tour FINALIZADO o CANCELADO (pausado). Un tour EN CURSO sigue
  // operable: abonos de último minuto y ajustes de asiento antes de salir (decisión del PM, 2026-11-14).
  const isAuditMode =
    tour?.temporalStatus === TOUR_TEMPORAL_STATUS.FINISHED ||
    tour?.temporalStatus === TOUR_TEMPORAL_STATUS.CANCELLED;
  const requiresSeats = tour?.requiresSeats ?? Boolean(tour?.vehicle);
  const [selectedTravelerId, setSelectedTravelerId] = useState<string | null>(null);
  const [isQuickReservationOpen, setIsQuickReservationOpen] = useState(false);
  const [isCancelTourOpen, setIsCancelTourOpen] = useState(false);

  // Pestaña única para escritorio y móvil (ver constants/dashboard-tabs.ts).
  const [activeTab, setActiveTab] = useState<DashboardTab>(DEFAULT_DASHBOARD_TAB);
  const [pendingSeatPassengerId, setPendingSeatPassengerId] = useState<string | null>(null);
  // Guía interactiva: se abre sola la primera vez, cuando el tour ya cargó. Los pasos cuyo
  // elemento no está en pantalla (p. ej. "Nueva Reserva" en Modo Auditoría) se omiten.
  const { start: startGuide } = useGuidedTour(TOUR_DASHBOARD_GUIDED_TOUR, {
    autoStart: Boolean(tour),
  });
  // La guía recorre la lista de pasajeros: se abre en esa pestaña.
  const handleStartGuide = (): void => {
    setActiveTab("passengers");
    window.setTimeout(() => void startGuide(), 0);
  };

  const freeSeatsCount =
    (tour?.metrics?.occupancy?.max || 0) - (tour?.metrics?.occupancy?.current || 0);

  const handleAssignSeatIntent = (passengerId: string): void => {
    setPendingSeatPassengerId(passengerId);
    if (!tour?.vehicle) {
      setIsVehicleModalOpen(true);
    } else {
      // La asignación de asientos vive en la pestaña del croquis (escritorio y móvil).
      setActiveTab("seatmap");
    }
  };

  // Cálculos de presentación (utils/dashboard-travelers.util): los mismos en escritorio y celular.
  const flattenedPassengers = getSeatEligiblePassengers(tour?.travelers);
  const unassignedPassengers = flattenedPassengers.filter((p) => !p.seatNumber);
  const foundTraveler = findDashboardTraveler(tour?.travelers, selectedTravelerId);
  const filteredTravelers = filterDashboardTravelers(tour?.travelers, filters);

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
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const totalEligiblePassengers = tour.metrics.logistics.total;
  const assignedSeatsCount = tour.metrics.logistics.assigned;
  // Cancelar el tour (decisión del PM, 2026-11-14): solo si aún opera (ni finalizado ni cancelado).
  const openCancelTour = isAuditMode ? undefined : () => setIsCancelTourOpen(true);
  // Reembolsos: se registran salvo en un tour FINALIZADO (excepción del Modo Auditoría para los
  // tours cancelados).
  const canRegisterRefunds = tour.temporalStatus !== TOUR_TEMPORAL_STATUS.FINISHED;
  // Estado de cuenta PDF del operador: mismos datos en escritorio y celular.
  const statementAgency = buildOperatorStatementAgency(agency, branding);
  const statementContext = {
    agency: statementAgency,
    tourTitle: tour.title,
    tourDepartureDate: tour.departureDateTime,
    tourReturnDate: tour.returnDate ?? null,
    tourPostPaymentInstructions: tour.postPaymentInstructions ?? null,
    tourCurrency: tour.currency,
  };
  const refundsPanel = (
    <RefundsPanel
      tourId={tourId}
      currency={tour.currency}
      refunds={tour.refunds}
      canRegisterRefunds={canRegisterRefunds}
    />
  );

  return (
    <main className="flex h-full min-h-screen flex-col bg-slate-50">
      {/* VISTA DESKTOP */}
      <div className="hidden h-full w-full flex-col md:flex">
        <TourDashboardHeader
          title={tour.title}
          departureDateTime={tour.departureDateTime}
          currency={tour.currency}
          metrics={tour.metrics}
          logistics={tour.metrics.logistics}
          onNewReservation={isAuditMode ? undefined : () => setIsQuickReservationOpen(true)}
          onCancelTour={openCancelTour}
          onStartGuide={handleStartGuide}
        />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {tour.cancellation && <CancelledTourBanner cancellation={tour.cancellation} />}
          <div data-tour={TOUR_TARGET.DASHBOARD_TABS}>
            <TourTabsNav
              requiresSeats={requiresSeats}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              totalPassengers={totalEligiblePassengers}
              assignedSeatsCount={assignedSeatsCount}
              vehicle={tour.vehicle}
            />
          </div>

          <div className="flex-1">
            {activeTab === "passengers" && (
              <div className="animate-in fade-in space-y-4 duration-300">
                {refundsPanel}
                <div data-tour={TOUR_TARGET.DASHBOARD_FILTERS}>
                  <TravelersTableToolbar
                    tourId={tourId}
                    searchQuery={filters.searchQuery}
                    onSearchChange={setSearchQuery}
                    paymentFilter={filters.paymentFilter}
                    onPaymentFilterChange={setPaymentFilter}
                    formFilter={filters.formFilter}
                    onFormFilterChange={setFormFilter}
                    seatFilter={filters.seatFilter}
                    onSeatFilterChange={setSeatFilter}
                  />
                </div>

                <div data-tour={TOUR_TARGET.DASHBOARD_TRAVELERS}>
                  <DashboardTravelerTable
                    tourId={tourId}
                    tourTitle={tour.title}
                    tourDepartureDate={tour.departureDateTime}
                    tourReturnDate={tour.returnDate ?? null}
                    tourPostPaymentInstructions={tour.postPaymentInstructions ?? null}
                    statementAgency={statementAgency}
                    travelers={tour.travelers}
                    searchQuery={filters.searchQuery}
                    tourCurrency={tour.currency}
                    paymentFilter={filters.paymentFilter}
                    formFilter={filters.formFilter}
                    seatFilter={filters.seatFilter}
                    isAuditMode={isAuditMode}
                    freeSeatsCount={freeSeatsCount}
                    onRowClick={(id) => setSelectedTravelerId(id)}
                    onAssignSeatClick={handleAssignSeatIntent}
                    onClearFilters={clearFilters}
                    requiresSeats={requiresSeats}
                  />
                </div>
              </div>
            )}

            {activeTab === "seatmap" && (
              <DesktopSeatingTab
                tourId={tourId}
                vehicle={tour.vehicle}
                staffCapacity={tour.staffCapacity}
                eligiblePassengers={flattenedPassengers}
                unassignedPassengers={unassignedPassengers}
                pendingSeatPassengerId={pendingSeatPassengerId}
                onSelectPassenger={setPendingSeatPassengerId}
                onChangeVehicleClick={isAuditMode ? undefined : () => setIsVehicleModalOpen(true)}
                isAuditMode={isAuditMode}
              />
            )}
          </div>
        </div>
      </div>

      {/* VISTA MOBILE */}
      <div className="mx-auto block w-full max-w-lg space-y-5 px-4 py-5 pb-24 md:hidden">
        <MobileHeader
          tourTitle={tour.title}
          departureDateTime={tour.departureDateTime}
          onOpenNewBookingModal={isAuditMode ? undefined : () => setIsQuickReservationOpen(true)}
          onCancelTour={openCancelTour}
          onStartGuide={handleStartGuide}
        />

        {tour.cancellation && <CancelledTourBanner cancellation={tour.cancellation} />}

        <div data-tour={TOUR_TARGET.DASHBOARD_KPIS}>
          <MobileKpiCards metrics={tour.metrics} currency={tour.currency} />
        </div>

        <div data-tour={TOUR_TARGET.DASHBOARD_TABS}>
          <MobileTabsNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            totalPassengers={totalEligiblePassengers}
            assignedCount={assignedSeatsCount}
            totalBookedPax={totalEligiblePassengers}
            requiresSeats={requiresSeats}
          />
        </div>

        {activeTab === "passengers" ? (
          <div className="animate-in fade-in space-y-4 duration-300">
            {refundsPanel}
            <div data-tour={TOUR_TARGET.DASHBOARD_FILTERS}>
              <MobileFilters
                searchQuery={filters.searchQuery}
                onSearchChange={setSearchQuery}
                paymentFilter={filters.paymentFilter}
                onPaymentFilterChange={setPaymentFilter}
                formFilter={filters.formFilter}
                onFormFilterChange={setFormFilter}
                seatFilter={filters.seatFilter}
                onSeatFilterChange={setSeatFilter}
              />
            </div>

            <div data-tour={TOUR_TARGET.DASHBOARD_TRAVELERS}>
              <MobilePassengersList
                tourId={tourId}
                requiresSeats={requiresSeats}
                freeSeatsCount={freeSeatsCount}
                travelers={filteredTravelers}
                tourCurrency={tour.currency}
                isAuditMode={isAuditMode}
                statementContext={statementContext}
                onAssignSeatClick={handleAssignSeatIntent}
                onRowClick={(id) => setSelectedTravelerId(id)}
              />
            </div>
          </div>
        ) : (
          <MobileSeatsTab
            tourId={tourId}
            vehicle={tour.vehicle}
            assignedSeatsCount={assignedSeatsCount}
            staffCapacity={tour.staffCapacity}
            unassignedEligibles={unassignedPassengers}
            allEligiblePassengers={flattenedPassengers}
            onOpenVehicleSelection={isAuditMode ? undefined : () => setIsVehicleModalOpen(true)}
            pendingSeatPassengerId={pendingSeatPassengerId}
            setPendingSeatPassengerId={setPendingSeatPassengerId}
          />
        )}
      </div>

      <TravelerDetailDrawer
        tourId={tourId}
        traveler={foundTraveler}
        tourCurrency={tour.currency}
        isOpen={!!selectedTravelerId}
        onClose={() => setSelectedTravelerId(null)}
        isAuditMode={isAuditMode}
      />

      <QuickReservationModal
        tourId={tourId}
        isOpen={isQuickReservationOpen}
        onClose={() => setIsQuickReservationOpen(false)}
      />

      <VehicleSelectionModal
        tourId={tourId}
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        passengersCount={totalEligiblePassengers}
        assignedSeatsCount={assignedSeatsCount}
        currentVehicle={tour.vehicle}
        onSuccess={() => setActiveTab("seatmap")}
      />

      <CancelTourDialog
        tourId={tourId}
        tourTitle={tour.title}
        activeBookings={tour.travelers.length}
        collectedAmount={tour.metrics.revenue.collected}
        currency={tour.currency}
        open={isCancelTourOpen}
        onOpenChange={setIsCancelTourOpen}
      />
    </main>
  );
}
