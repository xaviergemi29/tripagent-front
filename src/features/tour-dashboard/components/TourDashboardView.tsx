"use client";

import { useState, useMemo } from "react";
import { TravelersTable } from "./TravelersTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TravelerDetailDrawer } from "./TravelerDetailDrawer";
import { TravelersTableToolbar } from "./TravelersTableToolbar";
import { TourDashboardHeader } from "./TourDashboardHeader";
import { PaymentValidationModal } from "./PaymentValidationModal";
import { useTourDashboardByTourId } from "../hooks/useTourDashboard";
import { QuickReservationModal } from "./QuickReservationModal";
import { SeatMapCanvas } from "@/features/tours/components/SeatMapCanvas";
import type { TravelerRow } from "../schemas/tour-dashboard.schema";
import { Bus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VehicleSelectionModal } from "./VehicleSelectionModal";

export function TourDashboardView({ tourId }: { tourId: string }) {
  const { data: tour, isLoading, isError, error } = useTourDashboardByTourId(tourId);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [formFilter, setFormFilter] = useState("ALL");
  const isAuditMode = tour?.temporalStatus === "FINALIZADO" || tour?.temporalStatus === "CANCELADO";
  const [selectedTravelerId, setSelectedTravelerId] = useState<string | null>(null);
  const [validatingPaymentId, setValidatingPaymentId] = useState<string | null>(null);
  const [isQuickReservationOpen, setIsQuickReservationOpen] = useState(false);

  // 🚀 Transformación tipada estrictamente con TravelerRow
  const flattenedPassengers = useMemo(() => {
    if (!tour?.travelers) return [];
    return tour.travelers.flatMap((titular) => {
      // 🚀 Inyectamos el bookingId a todos para agruparlos visualmente
      const allPassengers = [
        { id: titular.id, fullName: titular.fullName, bookingId: titular.bookingId },
      ];
      if (titular.companions) {
        titular.companions.forEach((c) => {
          allPassengers.push({ id: c.id, fullName: c.fullName, bookingId: titular.bookingId });
        });
      }
      return allPassengers;
    });
  }, [tour?.travelers]);

  // 🚀 Búsqueda unificada tipada correctamente
  const foundTraveler = useMemo(() => {
    if (!selectedTravelerId || !tour?.travelers) return null;
    const allTravelersList = tour.travelers.flatMap((titular: TravelerRow) => [
      titular,
      ...(titular.companions || []),
    ]);
    return allTravelersList.find((t) => t.id === selectedTravelerId) ?? null;
  }, [selectedTravelerId, tour?.travelers]);

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

  console.log("tour.vehicle", tour.vehicle);

  return (
    <main className="flex h-full min-h-screen flex-col bg-slate-50">
      <TourDashboardHeader
        title={tour.title}
        date={tour.departureDateTime}
        metrics={tour.metrics}
        onNewReservation={isAuditMode ? undefined : () => setIsQuickReservationOpen(true)}
      />

      <div className="flex-1 p-4 md:p-6">
        <Tabs defaultValue="viajeros" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="viajeros">Lista de Viajeros</TabsTrigger>
            <TabsTrigger value="asientos">Mapa de Asientos</TabsTrigger>
          </TabsList>

          <TabsContent value="viajeros" className="space-y-4 outline-none">
            <TravelersTableToolbar
              travelers={tour.travelers}
              tourId={tourId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              paymentFilter={paymentFilter}
              onPaymentFilterChange={setPaymentFilter}
              formFilter={formFilter}
              onFormFilterChange={setFormFilter}
            />

            <TravelersTable
              travelers={tour.travelers} // 🚀 Limpio, sin casteos peligrosos (as TitularRowDTO)
              searchQuery={searchQuery}
              paymentFilter={paymentFilter}
              formFilter={formFilter}
              onRowClick={(id) => setSelectedTravelerId(id)}
              onValidatePaymentClick={(id) => setValidatingPaymentId(id)}
              isAuditMode={isAuditMode}
            />
          </TabsContent>

          <TabsContent value="asientos" className="outline-none">
            {tour.vehicle?.layoutMap ? (
              <SeatMapCanvas
                tourId={tourId}
                layoutMap={tour.vehicle.layoutMap}
                activePassengers={flattenedPassengers}
              />
            ) : (
              <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
                <div className="rounded-full bg-slate-100 p-3">
                  <Bus className="h-6 w-6 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Sin vehículo asignado</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Asigna una plantilla (ej. Sprinter, Autobús) para habilitar el plano.
                  </p>
                </div>
                <Button
                  onClick={() => setIsVehicleModalOpen(true)}
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  🚌 Asignar Vehículo
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <TravelerDetailDrawer
        tourId={tourId}
        traveler={foundTraveler} // 🚀 Tipado ya resuelto con el useMemo
        isOpen={!!selectedTravelerId}
        onClose={() => setSelectedTravelerId(null)}
        isAuditMode={isAuditMode}
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
      <VehicleSelectionModal
        tourId={tourId}
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
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
