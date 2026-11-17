import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SeatMapCanvas } from "../SeatMapCanvas";

// Regresiones del 2026-11-16:
// B. Tras asignar (o quitar) un asiento, volver a elegir al mismo pasajero no lo seleccionaba.
// C. "✅ Asiento asignado" salía antes de que la API confirmara.

type MutateOptions = { onSuccess?: () => void };
const updateSeat = vi.fn<(vars: unknown, options?: MutateOptions) => void>();
vi.mock("@/features/tour-dashboard/hooks/useTourSeats", () => ({
  useIsSavingSeat: () => false,
  useTourSeats: () => ({ data: [] }),
  useUpdateSeat: () => ({ mutate: updateSeat }),
}));

const toastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: { success: (...a: unknown[]) => toastSuccess(...a), info: vi.fn(), error: vi.fn() },
}));

const layoutMap = [["1", "AISLE", "2"]];

// Asientos libres listos para asignar (con pasajero seleccionado se pintan punteados; sin
// selección también se llaman "Disponible", pero abren el menú de staff).
const assignableSeats = () =>
  screen.queryAllByTitle("Disponible").filter((el) => el.className.includes("border-dashed"));

/** Contenedor como `DesktopSeatingTab`: el panel y el croquis comparten la selección. */
function Harness() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <>
      <button type="button" onClick={() => setSelected("pA")}>
        Seleccionar Ana
      </button>
      <SeatMapCanvas
        tourId="t1"
        layoutMap={layoutMap as never}
        activePassengers={[]}
        selectedPassengerId={selected}
        onSelectedPassengerChange={setSelected}
      />
    </>
  );
}

beforeEach(() => vi.clearAllMocks());

describe("SeatMapCanvas: selección y avisos", () => {
  it("B: se puede volver a elegir al mismo pasajero después de asignarlo", async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole("button", { name: "Seleccionar Ana" }));
    await userEvent.click(assignableSeats()[0]);
    expect(updateSeat).toHaveBeenCalledWith(
      { seatLabel: "1", status: "ASSIGNED", passengerId: "pA" },
      expect.any(Object),
    );
    // Tras asignar, la selección se limpia también en el contenedor.
    expect(assignableSeats()).toHaveLength(0);

    await userEvent.click(screen.getByRole("button", { name: "Seleccionar Ana" }));
    expect(assignableSeats().length).toBeGreaterThan(0);
  });

  it("C: el aviso de éxito espera la confirmación de la API", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Seleccionar Ana" }));
    await userEvent.click(assignableSeats()[0]);

    expect(toastSuccess).not.toHaveBeenCalled();

    // La API responde bien: recién entonces se avisa.
    updateSeat.mock.calls[0][1]?.onSuccess?.();
    expect(toastSuccess).toHaveBeenCalledWith("✅ Asiento 1 asignado.");
  });
});
