import { describe, expect, it } from "vitest";
import { formatCardNumberForDisplay, formatClabeForDisplay } from "../bank-account.util";

describe("bank-account.util", () => {
  it("agrupa la CLABE 3-3-11-1 y la tarjeta 4-4-4-4", () => {
    expect(formatClabeForDisplay("012345678901234567")).toBe("012 345 67890123456 7");
    expect(formatCardNumberForDisplay("4152313412345678")).toBe("4152 3134 1234 5678");
    expect(formatCardNumberForDisplay("4152-3134-1234-5678")).toBe("4152 3134 1234 5678");
  });

  it("si la longitud no coincide, devuelve el texto original recortado", () => {
    expect(formatCardNumberForDisplay(" 1234 ")).toBe("1234");
  });
});
