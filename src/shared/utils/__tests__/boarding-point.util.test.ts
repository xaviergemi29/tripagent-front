import { describe, expect, it } from "vitest";
import { resolveBoardingPointDisplay } from "../boarding-point.util";

describe("resolveBoardingPointDisplay", () => {
  it("prefiere el punto resuelto por la API (ubicación y hora)", () => {
    expect(
      resolveBoardingPointDisplay({
        boardingPoint: "bp-1",
        boardingPointDetails: { location: "Plaza Xalapeña", time: "06:00" },
      }),
    ).toEqual({ location: "Plaza Xalapeña", time: "06:00" });
  });

  it("sin coincidencia muestra el texto guardado, nunca un UUID", () => {
    expect(resolveBoardingPointDisplay({ boardingPoint: "  Gasolinera Las Trancas " })).toEqual({
      location: "Gasolinera Las Trancas",
      time: null,
    });
    expect(
      resolveBoardingPointDisplay({ boardingPoint: "92779764-2131-4c4b-8153-398fbd74bfad" }),
    ).toBeNull();
    expect(resolveBoardingPointDisplay({ boardingPoint: "   " })).toBeNull();
    expect(resolveBoardingPointDisplay({})).toBeNull();
  });
});
