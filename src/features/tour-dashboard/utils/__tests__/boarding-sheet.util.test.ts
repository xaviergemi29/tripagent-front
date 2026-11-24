import { describe, expect, it } from "vitest";
import type { SeatInfo } from "../../hooks/useTourSeats";
import type { TourManifestOutput } from "../../schemas/tour-manifest.schema";
import { buildBoardingSheet, compareSeatLabels, toShortName } from "../boarding-sheet.util";

const passenger = (id: string, fullName: string, seatLabel: string | null, isTitular = true) => ({
  id,
  bookingId: `b-${id}`,
  fullName,
  isTitular,
  seatLabel,
  boardingPoint: "x",
  emergencyContact: null,
  balance: 0,
  groupSize: 1,
  isMinor: false,
});

const manifest: TourManifestOutput = {
  tourId: "t1",
  tourTitle: "Tour",
  departureDateTime: "2026-11-20",
  currency: "MXN",
  hasMinors: false,
  boardingPoints: [
    {
      id: "a",
      location: "Centro",
      time: "06:00",
      passengers: [passenger("p1", "Ana Torres Ruiz", "10"), passenger("p2", "Beto", null)],
    },
    {
      id: "b",
      location: "Plaza",
      time: "07:00",
      passengers: [passenger("p3", "Carla Díaz", "2", false)],
    },
  ],
};

const layoutMap = [
  [
    { type: "DRIVER" as const },
    "AISLE",
    { type: "SEAT" as const, label: "1", kind: "STAFF" as const },
  ],
  ["2", "AISLE", "3"],
  ["07", "AISLE", "10"],
  ["4", "AISLE", "5"],
];

const seats: SeatInfo[] = [
  { seatLabel: "3", status: "ASSIGNED", passenger: { id: "x", fullName: "Reserva sin pago" } },
  { seatLabel: "4", status: "BLOCKED", passenger: null },
];

describe("toShortName", () => {
  it("primer nombre + inicial del primer apellido", () => {
    expect(toShortName("Ana Torres")).toBe("Ana T.");
    expect(toShortName("Ana Torres Ruiz")).toBe("Ana T.");
    expect(toShortName("María José Torres Ruiz")).toBe("María T.");
  });

  it("un solo nombre o anonimizado: tal cual", () => {
    expect(toShortName("Beto")).toBe("Beto");
    expect(toShortName("Pasajero Eliminado")).toBe("Pasajero Eliminado");
  });
});

describe("compareSeatLabels", () => {
  it("orden natural, con '07' junto a '7'", () => {
    const sorted = ["10", "2", "07", "1", "7b"].sort(compareSeatLabels);
    expect(sorted).toEqual(["1", "2", "07", "7b", "10"]);
  });
});

describe("buildBoardingSheet", () => {
  const sheet = buildBoardingSheet({ manifest, layoutMap, seats });

  it("asigna P1…Pn en el orden del manifiesto", () => {
    expect(sheet.points.map((p) => p.code)).toEqual(["P1", "P2"]);
    expect(sheet.seatsByLabel.get("10")?.point?.code).toBe("P1");
    expect(sheet.seatsByLabel.get("2")?.point?.code).toBe("P2");
  });

  it("ordena solo asientos de pasajero (sin staff) y marca vacíos, staff y ocupados sin nombre", () => {
    expect(sheet.passengerSeatRows.map((s) => s.label)).toEqual(["2", "3", "4", "5", "07", "10"]);
    expect(sheet.seatsByLabel.get("10")).toMatchObject({ status: "OCCUPIED", shortName: "Ana T." });
    expect(sheet.seatsByLabel.get("5")?.status).toBe("FREE");
    expect(sheet.seatsByLabel.get("4")?.status).toBe("STAFF");
    expect(sheet.seatsByLabel.get("1")?.status).toBe("STAFF");
    expect(sheet.seatsByLabel.get("3")).toMatchObject({ status: "OCCUPIED", fullName: null });
  });

  it("lista a los pasajeros sin asiento", () => {
    expect(sheet.unseated.map((p) => p.fullName)).toEqual(["Beto"]);
    expect(sheet.unseated[0].point.code).toBe("P1");
  });

  it("sin vehículo no hay asientos y todos quedan sin asiento", () => {
    const empty = buildBoardingSheet({ manifest, layoutMap: null, seats: [] });
    expect(empty.passengerSeatRows).toEqual([]);
    expect(empty.unseated).toHaveLength(3);
  });
});
