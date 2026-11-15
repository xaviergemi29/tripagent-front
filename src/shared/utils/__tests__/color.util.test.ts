import { describe, expect, it } from "vitest";
import { hexToRgb, tintRgb } from "../color.util";

describe("hexToRgb / tintRgb", () => {
  it("convierte #RRGGBB y #RGB (con o sin #)", () => {
    expect(hexToRgb("#4f46e5", "#000000")).toEqual([79, 70, 229]);
    expect(hexToRgb("fff", "#000000")).toEqual([255, 255, 255]);
    expect(hexToRgb(" #0F0 ", "#000000")).toEqual([0, 255, 0]);
  });

  it("usa el color de respaldo si el valor no es válido", () => {
    expect(hexToRgb("azul", "#4338ca")).toEqual([67, 56, 202]);
    expect(hexToRgb(null, "#4338ca")).toEqual([67, 56, 202]);
    expect(hexToRgb(undefined, "no-válido")).toEqual([0, 0, 0]);
  });

  it("tintRgb mezcla con blanco según la proporción", () => {
    expect(tintRgb([79, 70, 229], 0)).toEqual([79, 70, 229]);
    expect(tintRgb([79, 70, 229], 1)).toEqual([255, 255, 255]);
    expect(tintRgb([0, 0, 0], 0.5)).toEqual([128, 128, 128]);
  });
});
