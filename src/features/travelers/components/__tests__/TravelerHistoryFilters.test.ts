import { describe, expect, it } from "vitest";
import {
  HISTORY_FILTERS,
  isCancelledTrip,
  resolveTripDisplayStatus,
} from "../TravelerHistoryDrawer";

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

describe("historial del viajero: estado de cada viaje (temporalStatus de la API)", () => {
  it("usa el estado de la API: un viaje que ya salió pero no regresa sigue en curso", () => {
    expect(resolveTripDisplayStatus(trip({ temporalStatus: "PRÓXIMO" }))).toBe("UPCOMING");
    expect(resolveTripDisplayStatus(trip({ temporalStatus: "EN CURSO" }))).toBe("IN_PROGRESS");
    expect(resolveTripDisplayStatus(trip({ temporalStatus: "FINALIZADO" }))).toBe("COMPLETED");
  });

  it("cancelado si lo canceló la agencia o si el pasajero o la reserva están cancelados", () => {
    expect(resolveTripDisplayStatus(trip({ temporalStatus: "CANCELADO" }))).toBe("CANCELLED");
    expect(
      resolveTripDisplayStatus(trip({ temporalStatus: "FINALIZADO", bookingStatus: "CANCELLED" })),
    ).toBe("CANCELLED");
  });
});
