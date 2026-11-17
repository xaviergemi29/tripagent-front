import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ManifestPrintView from "../page";

// Hoja de abordaje: hora en AM/PM y claves únicas aunque dos puntos lleguen sin id ("sin-id").

const passenger = (id: string, fullName: string) => ({
  id,
  bookingId: `b-${id}`,
  fullName,
  isTitular: true,
  seatLabel: null,
  boardingPoint: "Por asignar",
  medicalNotes: "",
  emergencyContact: null,
  balance: 0,
  groupSize: 1,
});

vi.mock("@/features/tour-dashboard/hooks/useTourManifest", () => ({
  useTourManifest: () => ({
    isLoading: false,
    isError: false,
    data: {
      tourId: "t1",
      tourTitle: "Zacatlán",
      departureDateTime: "2026-11-20",
      currency: "MXN",
      boardingPoints: [
        {
          id: "sin-id",
          location: "Plaza Américas",
          time: "18:30",
          passengers: [passenger("p1", "Ana Torres")],
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

describe("ManifestPrintView", () => {
  it("muestra la hora en AM/PM y no repite claves con puntos sin id", async () => {
    vi.spyOn(window, "print").mockImplementation(() => {});
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await act(async () => {
      render(<ManifestPrintView params={Promise.resolve({ id: "t1" })} />);
    });

    expect(await screen.findByText(/Plaza Américas - 06:30 PM/)).toBeInTheDocument();
    expect(screen.getByText(/Centro - 06:00 AM/)).toBeInTheDocument();
    expect(screen.getByText("Ana Torres")).toBeInTheDocument();
    expect(screen.getByText("Beto Ruiz")).toBeInTheDocument();
    const duplicateKey = consoleError.mock.calls.some((call) =>
      String(call[0]).includes("same key"),
    );
    expect(duplicateKey).toBe(false);
    consoleError.mockRestore();
  });
});
