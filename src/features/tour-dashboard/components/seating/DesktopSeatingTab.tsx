import type {
  FlattenedPassenger,
  VehicleOutput,
} from "@/features/tour-dashboard/schemas/tour-dashboard.schema";
import { useIsSavingSeat } from "@/features/tour-dashboard/hooks/useTourSeats";
import { SeatMapCanvas } from "./SeatMapCanvas";
import { UnassignedSeatsPanel } from "./UnassignedSeatsPanel";
import { VehicleStatusBanner } from "./VehicleStatusBanner";

interface DesktopSeatingTabProps {
  tourId: string;
  vehicle: VehicleOutput | null | undefined;
  staffCapacity?: number;
  /** Pasajeros con derecho a asiento (`getSeatEligiblePassengers`). */
  eligiblePassengers: FlattenedPassenger[];
  unassignedPassengers: FlattenedPassenger[];
  pendingSeatPassengerId: string | null;
  onSelectPassenger: (passengerId: string | null) => void;
  /** Sin acción en Modo Auditoría: no se puede cambiar el vehículo. */
  onChangeVehicleClick?: () => void;
  isAuditMode: boolean;
}

/** Pestaña "Croquis" del Centro de Control en escritorio: vehículo, mapa y "Faltan por acomodar". */
export function DesktopSeatingTab({
  tourId,
  vehicle,
  staffCapacity,
  eligiblePassengers,
  unassignedPassengers,
  pendingSeatPassengerId,
  onSelectPassenger,
  onChangeVehicleClick,
  isAuditMode,
}: DesktopSeatingTabProps) {
  const isSavingSeat = useIsSavingSeat(tourId);
  return (
    <div className="animate-in fade-in flex flex-col gap-4 duration-300 lg:flex-row">
      <div className="flex flex-1 flex-col gap-4">
        <VehicleStatusBanner vehicle={vehicle} onChangeVehicleClick={onChangeVehicleClick} />

        {vehicle?.layoutMap && (
          <div className="flex min-h-[500px] items-center justify-center overflow-auto rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <SeatMapCanvas
              tourId={tourId}
              layoutMap={vehicle.layoutMap}
              activePassengers={eligiblePassengers}
              selectedPassengerId={pendingSeatPassengerId}
              onSelectedPassengerChange={onSelectPassenger}
              staffCapacity={staffCapacity}
              readOnly={isAuditMode}
            />
          </div>
        )}
      </div>

      {vehicle?.layoutMap && !isAuditMode && (
        <div className="w-full shrink-0 lg:w-80">
          <UnassignedSeatsPanel
            unassignedPassengers={unassignedPassengers}
            onSelectPassenger={onSelectPassenger}
            selectedPassengerId={pendingSeatPassengerId}
            isSaving={isSavingSeat}
          />
        </div>
      )}
    </div>
  );
}
