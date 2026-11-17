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
import { useTourSeats } from "../hooks/useTourSeats";
import { QuickReservationModal } from "@/features/tour-dashboard/components/passengers/QuickReservationModal";
import { DashboardTravelerTable } from "@/features/tour-dashboard/components/passengers/DashboardTravelerTable";
import { useAgency } from "@/features/settings/hooks/useAgency";
import { useAgencyBranding } from "@/features/settings/hooks/useAgencyBranding";
import { useDashboardFilters } from "../hooks/useDashboardFilters";
import {
  applyLiveSeats,
  isCancelledFilter,
  selectDashboardGroups,
  findDashboardTraveler,
  getSeatEligiblePassengers,
} from "../utils/dashboard-travelers.util";
import { buildOperatorStatementAgency } from "../utils/statement-agency.util";
import { QueryErrorState } from "@/components/shared/QueryErrorState";
import { isNotFoundError } from "@/lib/api-error";

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
  const {
    data: tour,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useTourDashboardByTourId(tourId);
  // Datos de la agencia para el estado de cuenta PDF (perfil, banco y colores de marca).
  const agencyQuery = useAgency();
  const brandingQuery = useAgencyBranding();
  const agency = agencyQuery.data;
  const branding = brandingQuery.data;
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const { filters, setSearchQuery, setPaymentFilter, setFormFilter, setSeatFilter, clearFilters } =
    useDashboardFilters();

  // Modo Auditoría (solo lectura): tour FINALIZADO o CANCELADO (pausado). Un tour EN CURSO sigue
  // operable: abonos de último minuto y ajustes de asiento antes de salir (decisión del PM, 2026-11-14).
  const isAuditMode =
    tour?.temporalStatus === TOUR_TEMPORAL_STATUS.FINISHED ||
    tour?.temporalStatus === TOUR_TEMPORAL_STATUS.CANCELLED;
  const requiresSeats = tour?.requiresSeats ?? Boolean(tour?.vehicle);
  // Un tour EN CURSO ya salió en su unidad: no se cambia de vehículo (petición del usuario,
  // 2026-11-17). Se conservan los ajustes de asiento y, si aún no tiene unidad, asignarla.
  const canChangeVehicle =
    !isAuditMode &&
    !(tour?.temporalStatus === TOUR_TEMPORAL_STATUS.IN_PROGRESS && Boolean(tour?.vehicle));
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
  // Asientos en vivo (misma caché que el croquis, que se actualiza al instante al asignar o liberar):
  // "Faltan por acomodar" ya no espera la respuesta de la API ni la recarga del dashboard.
  const { data: liveSeats } = useTourSeats(tourId, { enabled: Boolean(tour?.vehicle) });
  const flattenedPassengers = applyLiveSeats(
    getSeatEligiblePassengers(tour?.travelers),
    tour?.vehicle ? liveSeats : undefined,
  );
  const unassignedPassengers = flattenedPassengers.filter((p) => !p.seatNumber);
  // Filtro "Canceladas" (2026-11-17): la lista muestra las reservas que canceló el cliente, en
  // solo lectura; en su drawer solo se puede "Anular" un abono mal capturado (corte de caja).
  const isCancelledView = isCancelledFilter(filters);
  const foundTraveler = findDashboardTraveler(
    isCancelledView ? tour?.cancelledTravelers : tour?.travelers,
    selectedTravelerId,
  );
  const filteredTravelers = selectDashboardGroups(tour, filters);
  const isListReadOnly = isAuditMode || isCancelledView;

  // Falló sin datos: motivo + Reintentar (antes el mensaje técnico sin forma de recuperarse). Un 404
  // (tour inexistente o de otra agencia) no se reintenta. Si falla una recarga con datos en caché,
  // se siguen mostrando.
  if (isError && !tour) {
    return (
      <div className="mx-auto max-w-4xl p-4 sm:p-8">
        {isNotFoundError(error) ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Tour no encontrado</h3>
            <p className="mt-1 text-sm text-slate-500">
              Es posible que se haya eliminado o que el enlace esté incompleto.
            </p>
          </div>
        ) : (
          <QueryErrorState
            resourceArticle="el"
            resourceName="Centro de Control"
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        )}
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
  // Sin los datos de la agencia (cargando o consulta fallida) no se genera el PDF: saldría sin
  // nombre ni CLABE. `retryStatementAgency` vuelve a pedirlos al intentar descargar.
  const statementAgency =
    agency && branding ? buildOperatorStatementAgency(agency, branding) : null;
  const retryStatementAgency = (): void => {
    if (!agency) void agencyQuery.refetch();
    if (!branding) void brandingQuery.refetch();
  };
  const statementContext = {
    agency: statementAgency,
    onAgencyMissing: retryStatementAgency,
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
                    onStatementAgencyMissing={retryStatementAgency}
                    travelers={tour.travelers}
                    cancelledTravelers={tour.cancelledTravelers}
                    searchQuery={filters.searchQuery}
                    tourCurrency={tour.currency}
                    paymentFilter={filters.paymentFilter}
                    formFilter={filters.formFilter}
                    seatFilter={filters.seatFilter}
                    isAuditMode={isListReadOnly}
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
                onChangeVehicleClick={
                  canChangeVehicle ? () => setIsVehicleModalOpen(true) : undefined
                }
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
                isAuditMode={isListReadOnly}
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
            isAuditMode={isAuditMode}
            canChangeVehicle={canChangeVehicle}
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
        // Reserva cancelada por el cliente: solo lectura, pero se puede anular un abono mal
        // capturado (corte de caja). En Modo Auditoría (tour finalizado o cancelado), nada.
        isAuditMode={isListReadOnly}
        canVoidPayments={!isAuditMode}
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
