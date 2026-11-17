import { describe, expect, it } from "vitest";
import { HISTORY_FILTERS, isCancelledTrip } from "../TravelerHistoryDrawer";

// Reglas de las píldoras del historial del viajero, con las constantes de dominio (2026-11-16).

const trip = (overrides: Record<string, unknown>) =>
  ({
    passengerStatus: "ACTIVE",
    bookingStatus: "CONFIRMED",
    destinationType: "NATIONAL",
    ...overrides,
  }) as never;

const matches = (value: string, t: never) =>
  HISTORY_FILTERS.find((f) => f.value === value)!.matches(t);

describe("historial del viajero: filtros", () => {
  it("cancelado = pasajero o reserva cancelados", () => {
    expect(isCancelledTrip(trip({ passengerStatus: "CANCELLED" }))).toBe(true);
    expect(isCancelledTrip(trip({ bookingStatus: "CANCELLED" }))).toBe(true);
    expect(isCancelledTrip(trip({}))).toBe(false);
  });

  it("nacionales y extranjero excluyen los cancelados", () => {
    expect(matches("NATIONAL", trip({}))).toBe(true);
    expect(matches("NATIONAL", trip({ bookingStatus: "CANCELLED" }))).toBe(false);
    expect(matches("INTERNATIONAL", trip({ destinationType: "INTERNATIONAL" }))).toBe(true);
    expect(matches("INTERNATIONAL", trip({}))).toBe(false);
    expect(matches("CANCELLED", trip({ passengerStatus: "CANCELLED" }))).toBe(true);
    expect(matches("ALL", trip({ passengerStatus: "CANCELLED" }))).toBe(true);
  });
});
