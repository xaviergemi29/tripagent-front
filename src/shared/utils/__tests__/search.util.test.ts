import { describe, expect, it } from "vitest";
import { matchesSearch, normalizeSearchText } from "../search.util";

describe("normalizeSearchText", () => {
  it("quita acentos, diéresis y mayúsculas", () => {
    expect(normalizeSearchText("  José Ñúñez Güémez ")).toBe("jose nunez guemez");
    expect(normalizeSearchText(null)).toBe("");
  });
});

describe("matchesSearch", () => {
  it("búsqueda vacía → coincide", () => {
    expect(matchesSearch("   ", { texts: ["Zacatlán"] })).toBe(true);
  });

  it("textos sin distinguir acentos, en ambos sentidos", () => {
    expect(matchesSearch("zacatlan", { texts: ["Zacatlán de las manzanas"] })).toBe(true);
    expect(matchesSearch("José", { texts: ["Jose Ramos"] })).toBe(true);
    expect(matchesSearch("MARÍA", { texts: ["maría lópez"] })).toBe(true);
    expect(matchesSearch("pedro", { texts: ["Zacatlán"] })).toBe(false);
  });

  it("teléfonos con espacios, guiones, paréntesis o lada encuentran el número guardado", () => {
    const phones = ["2281234567"];
    expect(matchesSearch("228 123 4567", { phones })).toBe(true);
    expect(matchesSearch("228-123-4567", { phones })).toBe(true);
    expect(matchesSearch("(228) 123", { phones })).toBe(true);
    expect(matchesSearch("4567", { phones })).toBe(true);
    expect(matchesSearch("555 000", { phones })).toBe(false);
  });

  it("un texto con letras no se compara contra teléfonos ni coincide con 'Sin teléfono'", () => {
    expect(matchesSearch("ana 2", { phones: ["2281234567"] })).toBe(false);
    expect(matchesSearch("123", { phones: ["Sin teléfono"] })).toBe(false);
  });
});
