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
  staffCapacity: number;
  unassignedEligibles: FlattenedPassenger[];
  allEligiblePassengers: FlattenedPassenger[];
  /** Sin acción = Modo Auditoría: croquis de solo consulta, sin cambiar vehículo ni asientos. */
  onOpenVehicleSelection?: () => void;
  /** Modo Auditoría explícito; si se omite, se deduce de que no haya `onOpenVehicleSelection`. */
  isAuditMode?: boolean;
  /** Falso en un tour EN CURSO con unidad: oculta "Cambiar vehículo" sin bloquear los asientos. */
  canChangeVehicle?: boolean;
  pendingSeatPassengerId: string | null;
  setPendingSeatPassengerId: (id: string | null) => void;
}

export function MobileSeatsTab({
  tourId,
  vehicle,
  assignedSeatsCount,
  staffCapacity,
  unassignedEligibles,
  allEligiblePassengers,
  onOpenVehicleSelection,
  isAuditMode,
  canChangeVehicle = true,
  pendingSeatPassengerId,
  setPendingSeatPassengerId,
}: MobileSeatsTabProps) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  // Verificación type-safe gracias al esquema VehicleOutput
  const hasVehicle = Boolean(vehicle?.layoutMap);

  const isReadOnly = isAuditMode ?? !onOpenVehicleSelection;

  const handleIntentChangeVehicle = () => {
    if (assignedSeatsCount > 0) {
      setIsAlertOpen(true);
    } else {
      onOpenVehicleSelection?.();
    }
  };

  const handleConfirmChange = () => {
    setIsAlertOpen(false);
    onOpenVehicleSelection?.();
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
        staffCapacity={staffCapacity}
        unassignedEligibles={unassignedEligibles}
        allEligiblePassengers={allEligiblePassengers}
        pendingSeatPassengerId={pendingSeatPassengerId}
        onChangeVehicleClick={
          isReadOnly || !canChangeVehicle ? undefined : handleIntentChangeVehicle
        }
        onSelectPassenger={isReadOnly ? undefined : setPendingSeatPassengerId}
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
