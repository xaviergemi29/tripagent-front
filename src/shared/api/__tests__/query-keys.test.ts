import { describe, expect, it } from "vitest";
import {
  BOOKING_KEYS,
  PUBLIC_TRAVELER_LOOKUP_KEYS,
  TOUR_DASHBOARD_KEYS,
  TOUR_KEYS,
  TOUR_MANIFEST_KEYS,
  TOUR_SEAT_KEYS,
  TRAVELER_KEYS,
} from "../query-keys";

// React Query invalida por prefijo: estas pruebas fijan la jerarquía de la que dependen las
// mutaciones (qué refresca a qué).
const startsWith = (key: readonly unknown[], prefix: readonly unknown[]) =>
  prefix.every((part, i) => JSON.stringify(key[i]) === JSON.stringify(part));

describe("Claves de React Query", () => {
  it("los asientos cuelgan de ['tours']: invalidar TOUR_KEYS.all también los refresca", () => {
    expect(startsWith(TOUR_SEAT_KEYS.byTour("t1"), TOUR_KEYS.all)).toBe(true);
    expect(startsWith(TOUR_KEYS.detail("t1"), TOUR_KEYS.all)).toBe(true);
    expect(startsWith(TOUR_KEYS.lists("zaca"), TOUR_KEYS.all)).toBe(true);
  });

  it("el Centro de Control NO cuelga de ['tours']: hay que invalidarlo explícitamente", () => {
    expect(startsWith(TOUR_DASHBOARD_KEYS.detail("t1"), TOUR_KEYS.all)).toBe(false);
    expect(startsWith(TOUR_DASHBOARD_KEYS.detail("t1"), TOUR_DASHBOARD_KEYS.all)).toBe(true);
    expect(startsWith(TOUR_MANIFEST_KEYS.byTour("t1"), TOUR_KEYS.all)).toBe(false);
  });

  it("las claves con id son distintas por recurso", () => {
    expect(TOUR_DASHBOARD_KEYS.detail("t1")).not.toEqual(TOUR_DASHBOARD_KEYS.detail("t2"));
    expect(TRAVELER_KEYS.detail("v1")).not.toEqual(TRAVELER_KEYS.history("v1"));
    expect(BOOKING_KEYS.lists()).toEqual(["bookings", { search: undefined }]);
  });

  it("la búsqueda pública separa por token y teléfono", () => {
    expect(PUBLIC_TRAVELER_LOOKUP_KEYS.byPhone("tok", "2281234567")).toEqual([
      "public-traveler-lookup",
      "tok",
      "2281234567",
    ]);
  });
});
