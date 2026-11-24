import { describe, expect, it } from "vitest";
import { convertMxnToUsd, formatExchangeRate, hasAtMostDecimals } from "../exchange-rate.util";

describe("exchange-rate.util (RB-PAG-004)", () => {
  it("convierte pesos a dólares redondeando a centavos", () => {
    expect(convertMxnToUsd(5000, 19.3)).toBe(259.07);
    expect(convertMxnToUsd(5000, 19.354)).toBe(258.34);
    expect(convertMxnToUsd(1950, 19.5)).toBe(100);
  });

  it("sin pesos o sin tipo de cambio no hay conversión", () => {
    expect(convertMxnToUsd(0, 19.3)).toBeNull();
    expect(convertMxnToUsd(5000, 0)).toBeNull();
  });

  it("formatea el tipo de cambio con 2 a 4 decimales", () => {
    expect(formatExchangeRate(19.3)).toBe("19.30");
    expect(formatExchangeRate(19.354)).toBe("19.354");
    expect(formatExchangeRate(19.354)).toBe("19.354");
    expect(formatExchangeRate(19.3541)).toBe("19.3541");
  });

  it("cuenta decimales sin fallar por coma flotante", () => {
    expect(hasAtMostDecimals(19.354, 4)).toBe(true);
    expect(hasAtMostDecimals(19.35401, 4)).toBe(false);
    expect(hasAtMostDecimals(0.1 + 0.2, 2)).toBe(true);
    expect(hasAtMostDecimals(5000.555, 2)).toBe(false);
  });
});
