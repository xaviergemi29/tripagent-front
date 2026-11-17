import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MobileSeatsTab } from "../mobile/MobileSeatsTab";
import { VehicleStatusBanner } from "../seating/VehicleStatusBanner";

// Un tour EN CURSO no cambia de vehículo, pero sus asientos se siguen ajustando (2026-11-17).

vi.mock("@/features/tour-dashboard/hooks/useTourSeats", () => ({
  useTourSeats: () => ({ data: [], isError: false, isFetching: false, refetch: vi.fn() }),
  useUpdateSeat: () => ({ mutate: vi.fn() }),
}));

const vehicle = {
  id: "v1",
  name: "Sprinter 20",
  layoutMap: [["1", "AISLE", "2"]],
  capacity: { total: 2, passenger: 2, staff: 0 },
} as never;

const passenger = {
  id: "p1",
  fullName: "Ana Torres",
  bookingId: "b1",
  seatNumber: null,
  role: "TITULAR",
  paxCount: 1,
} as never;

const renderMobile = (props: Partial<Parameters<typeof MobileSeatsTab>[0]>) =>
  render(
    <MobileSeatsTab
      tourId="t1"
      vehicle={vehicle}
      assignedSeatsCount={0}
      staffCapacity={0}
      unassignedEligibles={[passenger]}
      allEligiblePassengers={[passenger]}
      onOpenVehicleSelection={vi.fn()}
      pendingSeatPassengerId={null}
      setPendingSeatPassengerId={vi.fn()}
      {...props}
    />,
  );

describe("Cambio de vehículo bloqueado en un tour EN CURSO", () => {
  it("celular: sin botón 'Cambiar vehículo', pero el croquis sigue editable", () => {
    renderMobile({ isAuditMode: false, canChangeVehicle: false });
    expect(screen.queryByRole("button", { name: "Cambiar vehículo" })).not.toBeInTheDocument();
    // Los asientos libres siguen ofreciendo acciones (no es Modo Auditoría).
    expect(screen.getAllByTitle("Disponible").length).toBeGreaterThan(0);
  });

  it("celular: en un tour PRÓXIMO el botón sí aparece", () => {
    renderMobile({ isAuditMode: false, canChangeVehicle: true });
    expect(screen.getByRole("button", { name: "Cambiar vehículo" })).toBeInTheDocument();
  });

  it("escritorio: sin acción, el aviso del vehículo no ofrece cambiarlo", () => {
    render(<VehicleStatusBanner vehicle={vehicle} />);
    expect(screen.queryByRole("button", { name: /Cambiar Vehículo/ })).not.toBeInTheDocument();
  });
});
