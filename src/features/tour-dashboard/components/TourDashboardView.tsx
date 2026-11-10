// src/features/tour-dashboard/components/TourDashboardView.tsx
"use client";

import { useState, useMemo } from "react";
import { TourDashboardHeader } from "./TourDashboardHeader";
import { useTourDashboardByTourId } from "../hooks/useTourDashboard";
import { QuickReservationModal } from "./QuickReservationModal";
import { SeatMapCanvas } from "@/features/tours/components/SeatMapCanvas";
import { DashboardTravelerTable } from "./DashboardTravelerTable";
import { CompanionDTO, TitularRowDTO } from "../schemas/tour-dashboard.schema";

import { TravelersTableToolbar } from "./TravelersTableToolbar";
import { TravelerDetailDrawer } from "./TravelerDetailDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import { TourTabsNav } from "./TourTabsNav";
import { VehicleStatusBanner } from "./VehicleStatusBanner";
import { UnassignedSeatsPanel } from "./UnassignedSeatsPanel";
import { VehicleSelectionModal } from "./VehicleSelectionModal";
import { MobileHeader } from "./MobileHeader";
import { MobileKpiCards } from "./MobileKpiCards";
import { MobileTabsNav } from "./MobileTabsNav";
import { MobileFilters } from "./MobileFilters";
import { BookingCard } from "./BookingCard";

interface TourDashboardViewProps {
  tourId: string;
}

interface FlattenedPassenger {
  id: string;
  fullName: string;
  bookingId: string;
  seatNumber: string | null;
  role: "TITULAR" | "COMPANION";
  paxCount: number;
}

export function TourDashboardView({ tourId }: TourDashboardViewProps) {
  const { data: tour, isLoading, isError, error } = useTourDashboardByTourId(tourId);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"passengers" | "seatmap">("passengers");
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [formFilter, setFormFilter] = useState("ALL");
  const [seatFilter, setSeatFilter] = useState("ALL");

  const isAuditMode = tour?.temporalStatus === "FINALIZADO" || tour?.temporalStatus === "CANCELADO";
  const [selectedTravelerId, setSelectedTravelerId] = useState<string | null>(null);
  const [isQuickReservationOpen, setIsQuickReservationOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<"viajeros" | "asientos">("viajeros");
  const [pendingSeatPassengerId, setPendingSeatPassengerId] = useState<string | null>(null);

  const freeSeatsCount =
    (tour?.metrics?.occupancy?.max || 0) - (tour?.metrics?.occupancy?.current || 0);

  const handleAssignSeatIntent = (passengerId: string): void => {
    setPendingSeatPassengerId(passengerId);
    if (!tour?.vehicle) {
      setIsVehicleModalOpen(true);
    } else {
      setActiveTab("asientos");
      setMobileTab("seatmap");
    }
  };

  const handleClearFilters = (): void => {
    setSearchQuery("");
    setPaymentFilter("ALL");
    setFormFilter("ALL");
    setSeatFilter("ALL");
  };

  // 1. FLATTEN PARA ASIENTOS (Intacto)
  const flattenedPassengers = useMemo(() => {
    if (!tour?.travelers) return [];

    return tour.travelers.flatMap((titular) => {
      const hasPaid = titular.paidAmount > 0 || titular.paymentStatus !== "PENDING";
      if (!hasPaid) return [];

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
    const allTravelersList: Array<TitularRowDTO | CompanionDTO> = tour.travelers.flatMap(
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
        />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <TourTabsNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            totalPassengers={totalEligiblePassengers}
            assignedSeatsCount={assignedSeatsCount}
            vehicle={tour.vehicle}
          />

          <div className="flex-1">
            {activeTab === "viajeros" && (
              <div className="animate-in fade-in space-y-4 duration-300">
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

                {/* Ojo: A la tabla original seguimos pasándole "tour.travelers" porque ella tiene su propia lógica residual o si refactorizamos ambas, le pasamos "filteredTravelers" */}
                <DashboardTravelerTable
                  tourId={tourId}
                  tourTitle={tour.title}
                  agencyName={""}
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
                />
              </div>
            )}

            {activeTab === "asientos" && (
              <div className="animate-in fade-in flex flex-col gap-4 duration-300 lg:flex-row">
                <div className="flex flex-1 flex-col gap-4">
                  <VehicleStatusBanner
                    vehicle={tour.vehicle}
                    onChangeVehicleClick={() => setIsVehicleModalOpen(true)}
                  />

                  {tour.vehicle?.layoutMap && (
                    <div className="flex min-h-[500px] items-center justify-center overflow-auto rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                      <SeatMapCanvas
                        tourId={tourId}
                        layoutMap={tour.vehicle.layoutMap}
                        activePassengers={flattenedPassengers}
                        initialSelectedPassengerId={pendingSeatPassengerId}
                      />
                    </div>
                  )}
                </div>

                {tour.vehicle?.layoutMap && (
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
        />

        <MobileKpiCards metrics={tour.metrics} />

        <MobileTabsNav
          activeTab={mobileTab}
          onTabChange={setMobileTab}
          totalPassengers={totalEligiblePassengers}
          assignedCount={assignedSeatsCount}
          totalBookedPax={totalEligiblePassengers}
        />

        {mobileTab === "passengers" ? (
          <div className="animate-in fade-in space-y-4 duration-300">
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
                  onAssignSeatClick={handleAssignSeatIntent}
                  onRowClick={(id) => setSelectedTravelerId(id)}
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
          <div className="animate-in fade-in overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm duration-300">
            {tour.vehicle?.layoutMap ? (
              <SeatMapCanvas
                tourId={tourId}
                layoutMap={tour.vehicle.layoutMap}
                activePassengers={flattenedPassengers}
                initialSelectedPassengerId={pendingSeatPassengerId}
              />
            ) : (
              <div className="space-y-3 py-12 text-center">
                <p className="text-sm font-semibold text-slate-800">Sin vehículo asignado</p>
                <button
                  onClick={() => setIsVehicleModalOpen(true)}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white"
                >
                  Asignar Vehículo
                </button>
              </div>
            )}
          </div>
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
        onSuccess={() => setActiveTab("asientos")}
      />
    </main>
  );
}
