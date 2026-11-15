import { describe, expect, it } from "vitest";
import { getAvatarColor, getInitials } from "../travelers-helpers";

describe("getInitials / getAvatarColor", () => {
  it("toma la inicial de las dos primeras palabras", () => {
    expect(getInitials("ana torres ruiz")).toBe("AT");
    expect(getInitials("  Luis   Pérez ")).toBe("LP");
    expect(getInitials("Mariana")).toBe("MA");
    expect(getInitials(null)).toBe("VI");
    expect(getInitials("   ")).toBe("VI");
  });

  it("el color del avatar es estable para el mismo nombre", () => {
    expect(getAvatarColor("Ana Torres")).toBe(getAvatarColor("Ana Torres"));
    expect(getAvatarColor("Ana Torres")).toMatch(/^bg-\w+-100 text-\w+-\d{3}/);
    expect(getAvatarColor(null)).toBe(getAvatarColor(undefined));
  });
});
