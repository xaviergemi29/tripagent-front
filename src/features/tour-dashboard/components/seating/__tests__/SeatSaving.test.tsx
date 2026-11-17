import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SeatMapCanvas } from "../SeatMapCanvas";
import { UnassignedSeatsPanel } from "../UnassignedSeatsPanel";

// Mientras la API confirma un asiento, el croquis y "Faltan por acomodar" muestran que se está
// guardando (2026-11-17).

vi.mock("@/features/tour-dashboard/hooks/useTourSeats", () => ({
  useIsSavingSeat: () => true,
  useTourSeats: () => ({
    data: [
      {
        seatLabel: "1",
        status: "ASSIGNED",
        passenger: { id: "p1", fullName: "Ana Torres" },
        isPending: true,
      },
    ],
  }),
  useUpdateSeat: () => ({ mutate: vi.fn() }),
}));

describe("Asiento guardándose", () => {
  it("el croquis muestra el asiento ocupado con indicador de carga y sin menú", () => {
    render(
      <SeatMapCanvas
        tourId="t1"
        layoutMap={[["1", "AISLE", "2"]] as never}
        activePassengers={[]}
      />,
    );
    const seat = screen.getByRole("status", { name: /Asiento 1: guardando a Ana Torres/ });
    expect(seat).toHaveAttribute("aria-busy", "true");
    expect(seat.tagName).toBe("DIV");
  });

  it("el panel avisa 'Guardando…'", () => {
    render(
      <UnassignedSeatsPanel
        unassignedPassengers={[]}
        onSelectPassenger={vi.fn()}
        selectedPassengerId={null}
        isSaving
      />,
    );
    expect(screen.getByText("Guardando…")).toBeInTheDocument();
  });
});
