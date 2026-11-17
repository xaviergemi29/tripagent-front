import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SeatMapCanvas } from "../seating/SeatMapCanvas";
import { VehicleSelectionModal } from "../seating/VehicleSelectionModal";

// Sin los asientos no se dibuja el croquis ni se cambia de vehículo: con la lista vacía todos se
// veían libres y la API reasigna un asiento ocupado sin avisar (2026-11-16).

const refetchSeats = vi.fn();
const ok = (data: unknown) => ({ data, isError: false, isFetching: false, refetch: vi.fn() });
const failed = () => ({
  data: undefined,
  isError: true,
  error: new Error("Network Error"),
  isFetching: false,
  refetch: refetchSeats,
});
let seatsQuery: Record<string, unknown> = {};

vi.mock("@/features/tour-dashboard/hooks/useTourSeats", () => ({
  useTourSeats: () => seatsQuery,
  useUpdateSeat: () => ({ mutate: vi.fn() }),
}));
vi.mock("@/features/vehicles/hooks/useVehicleTemplates", () => ({
  useVehicleTemplates: () => ok([]),
}));
vi.mock("@/features/tour-dashboard/hooks/useTourDashboard", () => ({
  useVehicles: () => ok([]),
  useAssignVehicleToTour: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const layoutMap = [["1", "AISLE", "2", "3"]] as never;

describe("Croquis sin asientos cargados", () => {
  beforeEach(() => refetchSeats.mockClear());

  it("si falla la consulta: error con Reintentar y ningún asiento para elegir", async () => {
    seatsQuery = failed();
    render(
      <SeatMapCanvas tourId="t1" layoutMap={layoutMap} activePassengers={[]} staffCapacity={1} />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar los asientos");
    expect(screen.queryByTitle("Disponible")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Volver a intentar/ }));
    expect(refetchSeats).toHaveBeenCalledOnce();
  });

  it("mientras carga: indicador de carga, sin asientos", () => {
    seatsQuery = { data: undefined, isError: false, isFetching: true, refetch: vi.fn() };
    render(
      <SeatMapCanvas tourId="t1" layoutMap={layoutMap} activePassengers={[]} staffCapacity={1} />,
    );
    expect(screen.getByText("Cargando asientos…")).toBeInTheDocument();
    expect(screen.queryByTitle("Disponible")).not.toBeInTheDocument();
  });
});

describe("Selector de vehículo sin asientos cargados", () => {
  it("muestra el error y no permite asignar", () => {
    seatsQuery = failed();
    render(
      <VehicleSelectionModal
        tourId="t1"
        isOpen
        onClose={vi.fn()}
        passengersCount={2}
        assignedSeatsCount={1}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar los vehículos");
    expect(screen.getByRole("button", { name: /Asignar y Cargar Mapa/ })).toBeDisabled();
  });
});
