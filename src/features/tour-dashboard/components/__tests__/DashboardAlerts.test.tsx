import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SeatWithoutDepositBadge } from "@/features/tour-dashboard/components/passengers/SeatWithoutDepositBadge";
import {
  formatUnpaidHoldAge,
  getElapsedHours,
  UnpaidHoldAge,
} from "@/features/tour-dashboard/components/passengers/UnpaidHoldAge";

const NOW = new Date("2026-11-13T18:00:00.000Z");
const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * 3_600_000).toISOString();

describe("Asiento asignado sin anticipo cubierto", () => {
  it("muestra el asiento con la alerta completa", () => {
    render(<SeatWithoutDepositBadge seatLabel="12" />);

    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Asiento asignado sin anticipo cubierto")).toBeInTheDocument();
  });

  it("compacto: texto corto visible y el completo para lectores de pantalla", () => {
    render(<SeatWithoutDepositBadge seatLabel="7" compact />);

    expect(screen.getByText("Sin anticipo")).toBeInTheDocument();
    expect(screen.getByText("Asiento asignado sin anticipo cubierto")).toHaveClass("sr-only");
  });
});

describe("Apartado hace N h sin pago", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it("getElapsedHours: horas completas, 0 con fecha inválida o futura", () => {
    expect(getElapsedHours(hoursAgo(50.9), NOW.getTime())).toBe(50);
    expect(getElapsedHours("no-es-fecha", NOW.getTime())).toBe(0);
    expect(getElapsedHours(hoursAgo(-3), NOW.getTime())).toBe(0);
  });

  it("menos de 24 h en horas; desde 24 h en días y horas", () => {
    expect(formatUnpaidHoldAge(0)).toBe("Apartado hace menos de 1 hora sin pago");
    expect(formatUnpaidHoldAge(1)).toBe("Apartado hace 1 hora sin pago");
    expect(formatUnpaidHoldAge(4)).toBe("Apartado hace 4 horas sin pago");
    expect(formatUnpaidHoldAge(23)).toBe("Apartado hace 23 horas sin pago");
    expect(formatUnpaidHoldAge(24)).toBe("Apartado hace 1 día sin pago");
    expect(formatUnpaidHoldAge(25)).toBe("Apartado hace 1 día y 1 hora sin pago");
    expect(formatUnpaidHoldAge(51)).toBe("Apartado hace 2 días y 3 horas sin pago");
    expect(formatUnpaidHoldAge(160)).toBe("Apartado hace 6 días y 16 horas sin pago");
  });

  it("antes de 48 h: texto neutro", () => {
    render(<UnpaidHoldAge bookedAt={hoursAgo(5)} />);

    const label = screen.getByText("Apartado hace 5 horas sin pago");
    expect(label).not.toHaveClass("text-red-600");
  });

  it("desde 48 h: texto en rojo para la revisión manual", () => {
    render(<UnpaidHoldAge bookedAt={hoursAgo(50)} />);

    expect(screen.getByText("Apartado hace 2 días y 2 horas sin pago")).toHaveClass("text-red-600");
  });

  it("recién apartado y se actualiza solo con el paso del tiempo", () => {
    render(<UnpaidHoldAge bookedAt={hoursAgo(0.5)} />);
    expect(screen.getByText("Apartado hace menos de 1 hora sin pago")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(60 * 60_000);
    });

    expect(screen.getByText("Apartado hace 1 hora sin pago")).toBeInTheDocument();
  });
});
