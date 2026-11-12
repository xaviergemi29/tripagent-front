"use client";

import { useState } from "react";
import { NoVehicleView } from "./NoVehicleView";
import { VehicleAssignedView } from "./VehicleAssignedView";
import { ChangeVehicleAlert } from "./ChangeVehicleAlert";
import type { FlattenedPassenger, VehicleOutput } from "../../schemas/tour-dashboard.schema";

interface MobileSeatsTabProps {
  tourId: string;
  vehicle?: VehicleOutput | null;
  assignedSeatsCount: number;
  unassignedEligibles: FlattenedPassenger[];
  allEligiblePassengers: FlattenedPassenger[];
  onOpenVehicleSelection: () => void;
  pendingSeatPassengerId: string | null;
  setPendingSeatPassengerId: (id: string | null) => void;
}

export function MobileSeatsTab({
  tourId,
  vehicle,
  assignedSeatsCount,
  unassignedEligibles,
  allEligiblePassengers,
  onOpenVehicleSelection,
  pendingSeatPassengerId,
  setPendingSeatPassengerId,
}: MobileSeatsTabProps) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  // Verificación type-safe gracias al esquema VehicleOutput
  const hasVehicle = Boolean(vehicle?.layoutMap);

  const handleIntentChangeVehicle = () => {
    if (assignedSeatsCount > 0) {
      setIsAlertOpen(true);
    } else {
      onOpenVehicleSelection();
    }
  };

  const handleConfirmChange = () => {
    setIsAlertOpen(false);
    onOpenVehicleSelection();
  };

  if (!hasVehicle) {
    return (
      <NoVehicleView
        eligibleWaitingPassengers={unassignedEligibles}
        onOpenVehicleModal={onOpenVehicleSelection}
      />
    );
  }

  // Ahora TypeScript sabe que vehicle no es null aquí, pero hacemos un cast
  // seguro o permitimos que VehicleAssignedView lo maneje
  return (
    <>
      <VehicleAssignedView
        tourId={tourId}
        vehicle={vehicle!}
        assignedSeatsCount={assignedSeatsCount}
        unassignedEligibles={unassignedEligibles}
        allEligiblePassengers={allEligiblePassengers}
        pendingSeatPassengerId={pendingSeatPassengerId}
        onChangeVehicleClick={handleIntentChangeVehicle}
        onSelectPassenger={setPendingSeatPassengerId}
      />

      <ChangeVehicleAlert
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        onConfirm={handleConfirmChange}
        assignedSeatsCount={assignedSeatsCount}
      />
    </>
  );
}
