import { describe, expect, it } from "vitest";
import { formatCurrency } from "@/shared/utils/currency.util";

describe("formatCurrency: formato estándar $1,000.00 MXN|USD", () => {
  it.each([
    [1000, "USD", "$1,000.00 USD"],
    [1000, "MXN", "$1,000.00 MXN"],
    [1500.5, "USD", "$1,500.50 USD"],
    [1500.5, "MXN", "$1,500.50 MXN"],
    [0, "MXN", "$0.00 MXN"],
    [-500, "USD", "-$500.00 USD"],
    [1234567.891, "MXN", "$1,234,567.89 MXN"],
    [999, "USD", "$999.00 USD"],
  ] as const)("%s %s → %s", (value, currency, expected) => {
    expect(formatCurrency(value, { currency })).toBe(expected);
  });

  it("usa MXN (DEFAULT_CURRENCY) cuando no se indica la divisa", () => {
    expect(formatCurrency(2000)).toBe("$2,000.00 MXN");
  });

  it("acepta cadenas numéricas", () => {
    expect(formatCurrency("1500.5", { currency: "USD" })).toBe("$1,500.50 USD");
  });

  it("null, undefined, vacío o no numérico se muestran como cero en la divisa indicada", () => {
    expect(formatCurrency(null, { currency: "USD" })).toBe("$0.00 USD");
    expect(formatCurrency(undefined)).toBe("$0.00 MXN");
    expect(formatCurrency("")).toBe("$0.00 MXN");
    expect(formatCurrency("abc", { currency: "USD" })).toBe("$0.00 USD");
    expect(formatCurrency(Number.NaN)).toBe("$0.00 MXN");
  });

  it("no muestra signo negativo en importes que se redondean a cero", () => {
    expect(formatCurrency(-0.001)).toBe("$0.00 MXN");
    expect(formatCurrency(-0)).toBe("$0.00 MXN");
  });
});
