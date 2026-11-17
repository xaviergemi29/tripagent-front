import { describe, expect, it } from "vitest";
import {
  buildTelUrl,
  formatPhoneForDisplay,
  getPhoneCountryOptions,
  isSamePhone,
  normalizePhoneInput,
  parseStoredPhone,
  toE164,
  toInternationalDigits,
} from "../phone.util";

// Teléfonos internacionales (2026-11-16): país + número nacional → E.164.

describe("toE164", () => {
  it("convierte el número nacional según el país", () => {
    expect(toE164("228 123 4567", "MX")).toBe("+522281234567");
    expect(toE164("2125551234", "US")).toBe("+12125551234");
    expect(toE164("6045551234", "CA")).toBe("+16045551234");
    expect(toE164("612345678", "ES")).toBe("+34612345678");
    expect(toE164("3001234567", "CO")).toBe("+573001234567");
  });

  it("rechaza números incompletos o de otro país", () => {
    expect(toE164("22812", "MX")).toBeNull();
    expect(toE164("", "MX")).toBeNull();
    expect(toE164("+12125551234", "MX")).toBeNull();
  });
});

describe("parseStoredPhone", () => {
  it("separa un E.164 en país y número nacional; el país guardado distingue +1", () => {
    expect(parseStoredPhone("+16045551234", "CA")).toEqual({
      country: "CA",
      nationalNumber: "6045551234",
      confirmed: true,
    });
    expect(parseStoredPhone("+34612345678", null).country).toBe("ES");
  });

  it("un registro anterior de 10 dígitos es México con la lada sin confirmar", () => {
    expect(parseStoredPhone("2281234567")).toEqual({
      country: "MX",
      nationalNumber: "2281234567",
      confirmed: false,
    });
  });

  it("vacío usa el país de respaldo", () => {
    expect(parseStoredPhone("", null, "US")).toEqual({
      country: "US",
      nationalNumber: "",
      confirmed: true,
    });
  });
});

describe("normalizePhoneInput", () => {
  it("al pegar +lada o 00lada cambia el país y deja solo el número nacional", () => {
    expect(normalizePhoneInput("+34 612 345 678", "MX")).toEqual({
      country: "ES",
      value: "612345678",
    });
    expect(normalizePhoneInput("0057 300 123 4567", "MX")).toEqual({
      country: "CO",
      value: "3001234567",
    });
  });

  it("quita la lada repetida del país seleccionado", () => {
    expect(normalizePhoneInput("52 228 123 4567", "MX")).toEqual({
      country: "MX",
      value: "2281234567",
    });
  });

  it("conserva un + incompleto mientras se escribe y limpia separadores", () => {
    expect(normalizePhoneInput("+3", "MX")).toEqual({ country: "MX", value: "+3" });
    expect(normalizePhoneInput("(228) 123-45", "MX")).toEqual({ country: "MX", value: "22812345" });
  });
});

describe("formato, enlaces y comparación", () => {
  it("muestra México en formato nacional y el resto en internacional", () => {
    expect(formatPhoneForDisplay("+522281234567")).toBe("228 123 4567");
    expect(formatPhoneForDisplay("2281234567")).toBe("228 123 4567");
    expect(formatPhoneForDisplay("+12125551234")).toBe("+1 212 555 1234");
    expect(formatPhoneForDisplay("Sin teléfono")).toBe("Sin teléfono");
  });

  it("los dígitos internacionales nunca anteponen 52 a un número de otro país", () => {
    expect(toInternationalDigits("+12125551234")).toBe("12125551234");
    expect(toInternationalDigits("2281234567")).toBe("522281234567"); // registro anterior
    expect(buildTelUrl("+34612345678")).toBe("tel:+34612345678");
    expect(buildTelUrl("")).toBeUndefined();
  });

  it("compara números en cualquier formato", () => {
    expect(isSamePhone("2281234567", "+522281234567")).toBe(true);
    expect(isSamePhone("+12125551234", "2125551234")).toBe(false);
    expect(isSamePhone(null, null)).toBe(false);
  });

  it("el catálogo trae todos los países con lada, México, EE. UU. y Canadá primero", () => {
    const options = getPhoneCountryOptions();
    expect(options.slice(0, 3).map((o) => o.code)).toEqual(["MX", "US", "CA"]);
    expect(options.length).toBeGreaterThan(200);
    expect(options.find((o) => o.code === "ES")).toMatchObject({
      name: "España",
      callingCode: "34",
    });
  });
});
