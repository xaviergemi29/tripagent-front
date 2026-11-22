import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ManifestPrintView from "../page";

// Hoja de abordaje: hora en AM/PM y claves únicas aunque dos puntos lleguen sin id ("sin-id").

const passenger = (id: string, fullName: string) => ({
  id,
  bookingId: `b-${id}`,
  fullName,
  isTitular: true,
  seatLabel: null,
  boardingPoint: "Por asignar",
  emergencyContact: null,
  balance: 0,
  groupSize: 1,
});

const state = vi.hoisted(() => ({
  manifestLoading: false,
  hasVehicle: true,
  seatsFail: false,
}));

const layoutMap = [
  [{ type: "DRIVER" }, "AISLE", { type: "SEAT", label: "1", kind: "STAFF" }],
  ["2", "AISLE", "10"],
];

vi.mock("@/features/tour-dashboard/hooks/useTourDashboard", () => ({
  useTourDashboardByTourId: () => ({
    isLoading: false,
    isError: false,
    isFetching: false,
    data: { vehicle: state.hasVehicle ? { layoutMap } : null },
  }),
}));

vi.mock("@/features/tour-dashboard/hooks/useTourSeats", () => ({
  useTourSeats: () => ({
    isLoading: false,
    isError: state.seatsFail,
    isFetching: false,
    refetch: vi.fn(),
    data: state.seatsFail ? undefined : [],
  }),
}));

vi.mock("@/features/tour-dashboard/hooks/useTourManifest", () => ({
  useTourManifest: () => ({
    isLoading: state.manifestLoading,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
    data: state.manifestLoading
      ? undefined
      : {
          tourId: "t1",
          tourTitle: "Zacatlán",
          departureDateTime: "2026-11-20",
          currency: "MXN",
          boardingPoints: [
            {
              id: "sin-id",
              location: "Plaza Américas",
              time: "18:30",
              passengers: [{ ...passenger("p1", "Ana Torres"), seatLabel: "10" }],
            },
            {
              id: "sin-id",
              location: "Centro",
              time: "06:00",
              passengers: [passenger("p2", "Beto Ruiz")],
            },
          ],
        },
  }),
}));

const renderView = async () => {
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(<ManifestPrintView params={Promise.resolve({ id: "t1" })} />);
  });
  return result;
};

describe("ManifestPrintView", () => {
  beforeEach(() => {
    state.manifestLoading = false;
    state.hasVehicle = true;
    state.seatsFail = false;
  });

  it("muestra la hora en AM/PM y no repite claves con puntos sin id", async () => {
    vi.spyOn(window, "print").mockImplementation(() => {});
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await act(async () => {
      await renderView();
    });

    expect(await screen.findByText(/Plaza Américas - 06:30 PM/)).toBeInTheDocument();
    expect(screen.getByText(/Centro - 06:00 AM/)).toBeInTheDocument();
    expect(screen.getAllByText("Ana Torres").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Beto Ruiz").length).toBeGreaterThan(0);
    const duplicateKey = consoleError.mock.calls.some((call) =>
      String(call[0]).includes("same key"),
    );
    expect(duplicateKey).toBe(false);
    consoleError.mockRestore();
  });

  it("hoja 1 con croquis y leyenda, salto de página y tabla por asiento con Disponible", async () => {
    vi.spyOn(window, "print").mockImplementation(() => {});
    const { container } = await renderView();

    expect(
      await screen.findByRole("heading", { name: "Croquis del vehículo" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Leyenda")).toBeInTheDocument();
    expect(screen.getByText("Frente")).toBeInTheDocument();
    expect(screen.getByText("[P1]")).toBeInTheDocument();
    expect(container.querySelector(".sheet-break")).not.toBeNull();
    expect(container.querySelector("style")?.innerHTML).toContain("break-after: page");

    expect(screen.getByText("Disponible")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Lista por asiento" })).toBeInTheDocument();
  });

  it("sin vehículo muestra el aviso y omite croquis y tabla por asiento", async () => {
    state.hasVehicle = false;
    vi.spyOn(window, "print").mockImplementation(() => {});
    await renderView();

    expect(await screen.findByText(/no tiene vehículo asignado/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Lista por asiento" })).toBeNull();
    expect(screen.getAllByText("Ana Torres").length).toBeGreaterThan(0);
  });

  it("no imprime mientras carga ni si falla una consulta", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    state.manifestLoading = true;
    const { unmount } = await renderView();
    await new Promise((r) => setTimeout(r, 700));
    expect(print).not.toHaveBeenCalled();
    unmount();

    state.manifestLoading = false;
    state.seatsFail = true;
    await renderView();
    await new Promise((r) => setTimeout(r, 700));
    expect(print).not.toHaveBeenCalled();
  });

  it("imprime una vez cargado todo", async () => {
    vi.useFakeTimers();
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    await act(async () => {
      await renderView();
    });
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(print).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
