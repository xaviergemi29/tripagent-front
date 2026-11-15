"use client";

import { useState, useMemo } from "react";
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
import { SeatMapCanvas } from "@/features/tour-dashboard/components/seating/SeatMapCanvas";
import { DashboardTravelerTable } from "@/features/tour-dashboard/components/passengers/DashboardTravelerTable";
import { useAgency } from "@/features/settings/hooks/useAgency";
import { useAgencyBranding } from "@/features/settings/hooks/useAgencyBranding";
import type { StatementPDFData } from "@/features/statements/pdf/payment-receipt.pdf";
import { buildApiPublicFileUrl } from "@/shared/utils/share-links.util";
import type {
  CompanionOutput,
  FlattenedPassenger,
  TitularRowOutput,
} from "../schemas/tour-dashboard.schema";

import { TravelersTableToolbar } from "@/features/tour-dashboard/components/passengers/TravelersTableToolbar";
import { TravelerDetailDrawer } from "@/features/tour-dashboard/components/finance/TravelerDetailDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import { TourTabsNav } from "@/features/tour-dashboard/components/header/TourTabsNav";
import { VehicleStatusBanner } from "@/features/tour-dashboard/components/seating/VehicleStatusBanner";
import { UnassignedSeatsPanel } from "@/features/tour-dashboard/components/seating/UnassignedSeatsPanel";
import { VehicleSelectionModal } from "@/features/tour-dashboard/components/seating/VehicleSelectionModal";
import { MobileHeader } from "./mobile/MobileHeader";
import { MobileKpiCards } from "./mobile/MobileKpiCards";
import { MobileTabsNav } from "./mobile/MobileTabsNav";
import { MobileFilters } from "./mobile/MobileFilters";
import { BookingCard } from "./mobile/BookingCard";
import { MobileSeatsTab } from "./mobile/MobileSeatsTab";

interface TourDashboardViewProps {
  tourId: string;
}

export function TourDashboardView({ tourId }: TourDashboardViewProps) {
  const { data: tour, isLoading, isError, error } = useTourDashboardByTourId(tourId);
  // Datos de la agencia para el estado de cuenta PDF (perfil, banco y colores de marca).
  const { data: agency } = useAgency();
  const { data: branding } = useAgencyBranding();
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [formFilter, setFormFilter] = useState("ALL");
  const [seatFilter, setSeatFilter] = useState("ALL");

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

  const handleClearFilters = (): void => {
    setSearchQuery("");
    setPaymentFilter("ALL");
    setFormFilter("ALL");
    setSeatFilter("ALL");
  };

  const flattenedPassengers = useMemo(() => {
    if (!tour?.travelers) return [];

    return tour.travelers.flatMap((titular) => {
      // Solo grupos que cubren el anticipo requerido pasan a "Faltan por acomodar".
      if (!titular.hasSeatRight) return [];

      const eligiblePassengers: FlattenedPassenger[] = [
        {
          id: titular.id,
          fullName: titular.fullName,
          bookingId: titular.bookingId,
          seatNumber: titular.seatLabel,
          role: titular.role,
          paxCount: titular.groupSize,
        },
      ];

      if (titular.companions) {
        titular.companions.forEach((c) => {
          eligiblePassengers.push({
            id: c.id,
            fullName: c.fullName,
            bookingId: titular.bookingId,
            seatNumber: c.seatLabel,
            role: c.role,
            paxCount: 1,
          });
        });
      }
      return eligiblePassengers;
    });
  }, [tour?.travelers]);

  const unassignedPassengers = useMemo(() => {
    return flattenedPassengers.filter((p) => !p.seatNumber);
  }, [flattenedPassengers]);

  const foundTraveler = useMemo(() => {
    if (!selectedTravelerId || !tour?.travelers) return null;
    const allTravelersList: Array<TitularRowOutput | CompanionOutput> = tour.travelers.flatMap(
      (titular) => [titular, ...(titular.companions || [])],
    );
    return allTravelersList.find((t) => t.id === selectedTravelerId) ?? null;
  }, [selectedTravelerId, tour?.travelers]);

  const filteredTravelers = useMemo(() => {
    if (!tour?.travelers) return [];

    return tour.travelers.filter((titular) => {
      const matchSearch = () => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase().trim();

        const titularMatch =
          titular.fullName.toLowerCase().includes(query) || titular.whatsapp.includes(query);

        if (titularMatch) return true;

        return (
          titular.companions?.some(
            (comp) => comp.fullName.toLowerCase().includes(query) || comp.whatsapp.includes(query),
          ) ?? false
        );
      };

      const matchPayment = () => {
        if (paymentFilter === "ALL") return true;

        let resolvedStatus = "UNPAID";
        if (titular.paymentStatus === "PAID" || (titular.paidAmount > 0 && titular.balance <= 0)) {
          resolvedStatus = "PAID";
        } else if (
          titular.paidAmount > 0 ||
          ["ADVANCE", "PARTIAL", "PENDING_VALIDATION"].includes(titular.paymentStatus)
        ) {
          resolvedStatus = "PARTIAL";
        }

        return resolvedStatus === paymentFilter;
      };

      const matchRegistration = () => {
        if (formFilter === "ALL") return true;

        const isTitularCompleted = titular.formStatus === "COMPLETED";
        const areCompanionsCompleted =
          titular.companions?.every((c) => c.formStatus === "COMPLETED") ?? true;

        const groupStatus = isTitularCompleted && areCompanionsCompleted ? "COMPLETED" : "PENDING";
        return groupStatus === formFilter;
      };

      const matchSeat = () => {
        if (seatFilter === "ALL") return true;

        const groupMembers = [titular, ...(titular.companions || [])];

        if (seatFilter === "UNASSIGNED") {
          return groupMembers.some((member) => !member.seatLabel);
        }

        if (seatFilter === "ASSIGNED") {
          return groupMembers.every((member) => !!member.seatLabel);
        }

        return true;
      };

      return matchSearch() && matchPayment() && matchRegistration() && matchSeat();
    });
  }, [tour?.travelers, searchQuery, paymentFilter, formFilter, seatFilter]);

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
        />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {tour.cancellation && <CancelledTourBanner cancellation={tour.cancellation} />}
          <TourTabsNav
            requiresSeats={requiresSeats}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            totalPassengers={totalEligiblePassengers}
            assignedSeatsCount={assignedSeatsCount}
            vehicle={tour.vehicle}
          />

          <div className="flex-1">
            {activeTab === "passengers" && (
              <div className="animate-in fade-in space-y-4 duration-300">
                {refundsPanel}
                <TravelersTableToolbar
                  tourId={tourId}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  paymentFilter={paymentFilter}
                  onPaymentFilterChange={setPaymentFilter}
                  formFilter={formFilter}
                  onFormFilterChange={setFormFilter}
                  seatFilter={seatFilter}
                  onSeatFilterChange={setSeatFilter}
                />

                <DashboardTravelerTable
                  tourId={tourId}
                  tourTitle={tour.title}
                  tourDepartureDate={tour.departureDateTime}
                  tourReturnDate={tour.returnDate ?? null}
                  tourPostPaymentInstructions={tour.postPaymentInstructions ?? null}
                  statementAgency={
                    {
                      name: agency?.name ?? "",
                      email: agency?.email ?? "",
                      whatsapp: agency?.phone ?? "",
                      logoUrl: branding?.logoPath ? buildApiPublicFileUrl(branding.logoPath) : null,
                      primaryColor: branding?.primaryColor ?? null,
                      secondaryColor: branding?.secondaryColor ?? null,
                      accentColor: branding?.accentColor ?? null,
                      bankInfo:
                        // Sin número de tarjeta: el PDF solo lleva banco, titular y CLABE.
                        agency?.bankName || agency?.clabeNumber
                          ? {
                              bankName: agency.bankName ?? "",
                              accountHolder: agency.bankAccountHolder ?? "",
                              clabe: agency.clabeNumber ?? "",
                            }
                          : null,
                      policies: agency?.policies ?? null,
                    } satisfies StatementPDFData["agency"]
                  }
                  travelers={tour.travelers}
                  searchQuery={searchQuery}
                  tourCurrency={tour.currency}
                  paymentFilter={paymentFilter}
                  formFilter={formFilter}
                  seatFilter={seatFilter}
                  isAuditMode={isAuditMode}
                  freeSeatsCount={freeSeatsCount}
                  onRowClick={(id) => setSelectedTravelerId(id)}
                  onAssignSeatClick={handleAssignSeatIntent}
                  onClearFilters={handleClearFilters}
                  requiresSeats={requiresSeats}
                />
              </div>
            )}

            {activeTab === "seatmap" && (
              <div className="animate-in fade-in flex flex-col gap-4 duration-300 lg:flex-row">
                <div className="flex flex-1 flex-col gap-4">
                  <VehicleStatusBanner
                    vehicle={tour.vehicle}
                    onChangeVehicleClick={
                      isAuditMode ? undefined : () => setIsVehicleModalOpen(true)
                    }
                  />

                  {tour.vehicle?.layoutMap && (
                    <div className="flex min-h-[500px] items-center justify-center overflow-auto rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                      <SeatMapCanvas
                        tourId={tourId}
                        layoutMap={tour.vehicle.layoutMap}
                        activePassengers={flattenedPassengers}
                        initialSelectedPassengerId={pendingSeatPassengerId}
                        staffCapacity={tour.staffCapacity}
                        readOnly={isAuditMode}
                      />
                    </div>
                  )}
                </div>

                {tour.vehicle?.layoutMap && !isAuditMode && (
                  <div className="w-full shrink-0 lg:w-80">
                    <UnassignedSeatsPanel
                      unassignedPassengers={unassignedPassengers}
                      onSelectPassenger={setPendingSeatPassengerId}
                      selectedPassengerId={pendingSeatPassengerId}
                    />
                  </div>
                )}
              </div>
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
        />

        {tour.cancellation && <CancelledTourBanner cancellation={tour.cancellation} />}

        <MobileKpiCards metrics={tour.metrics} currency={tour.currency} />

        <MobileTabsNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          totalPassengers={totalEligiblePassengers}
          assignedCount={assignedSeatsCount}
          totalBookedPax={totalEligiblePassengers}
          requiresSeats={requiresSeats}
        />

        {activeTab === "passengers" ? (
          <div className="animate-in fade-in space-y-4 duration-300">
            {refundsPanel}
            <MobileFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              paymentFilter={paymentFilter}
              onPaymentFilterChange={setPaymentFilter}
              formFilter={formFilter}
              onFormFilterChange={setFormFilter}
              seatFilter={seatFilter}
              onSeatFilterChange={setSeatFilter}
            />

            <div className="space-y-3">
              {filteredTravelers.map((titular) => (
                <BookingCard
                  key={titular.id}
                  titular={titular}
                  tourCurrency={tour.currency}
                  onAssignSeatClick={handleAssignSeatIntent}
                  onRowClick={(id) => setSelectedTravelerId(id)}
                  isAuditMode={isAuditMode}
                />
              ))}

              {filteredTravelers.length === 0 && (
                <div className="py-12 text-center text-slate-500">
                  <p>No se encontraron reservas con los filtros actuales.</p>
                </div>
              )}
            </div>

            <div className="py-6 text-center text-xs font-medium text-slate-500">
              Mostrando {filteredTravelers.length} reservas principales
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
