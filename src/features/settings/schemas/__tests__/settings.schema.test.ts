import { describe, expect, it } from "vitest";
import { brandingFormSchema, hexColorSchema } from "../branding.schema";
import { updateAgencyFormSchema } from "../agency.schema";
import { bankAccountFormSchema } from "../bank-account.schema";

// Configuración de la agencia: mismas reglas que la API (agency.schema.ts / hexColorSchema).

describe("hexColorSchema", () => {
  it("normaliza #RGB y mayúsculas a #rrggbb", () => {
    expect(hexColorSchema.parse("#ABC")).toBe("#aabbcc");
    expect(hexColorSchema.parse(" #4F46E5 ")).toBe("#4f46e5");
  });

  it("rechaza valores que no son hex", () => {
    for (const value of ["4f46e5", "#12", "#gggggg", "azul", ""]) {
      expect(hexColorSchema.safeParse(value).success).toBe(false);
    }
  });
});

describe("brandingFormSchema", () => {
  it("el acento vacío se envía como null (el PDF usa el secundario)", () => {
    expect(
      brandingFormSchema.parse({
        primaryColor: "#4f46e5",
        secondaryColor: "#4338ca",
        accentColor: "",
      }),
    ).toEqual({ primaryColor: "#4f46e5", secondaryColor: "#4338ca", accentColor: null });
  });

  it("normaliza el acento cuando se captura", () => {
    expect(
      brandingFormSchema.parse({
        primaryColor: "#4f46e5",
        secondaryColor: "#4338ca",
        accentColor: "#F00",
      }).accentColor,
    ).toBe("#ff0000");
  });
});

describe("updateAgencyFormSchema", () => {
  const valid = {
    name: "Viajes Xalapa",
    phone: "2281234567",
    phoneCountry: "MX",
    email: "hola@viajesxalapa.mx",
    address: "",
  };

  const pathsOf = (input: Record<string, unknown>) => {
    const result = updateAgencyFormSchema.safeParse(input);
    return result.success ? [] : result.error.issues.map((i) => i.path.join("."));
  };

  it("acepta la agencia sin datos bancarios (tienen su propia sección) y los descarta si llegan", () => {
    expect(pathsOf(valid)).toEqual([]);
    const parsed = updateAgencyFormSchema.parse({
      ...valid,
      bankName: "BBVA",
      clabeNumber: "012180001234567891",
      cardNumber: "4152313412345678",
    });
    expect(parsed).not.toHaveProperty("bankName");
    expect(parsed).not.toHaveProperty("clabeNumber");
    expect(parsed).not.toHaveProperty("cardNumber");
  });

  it("valida teléfono, correo y nombre; descarta el aviso de privacidad", () => {
    expect(pathsOf({ ...valid, phone: "228-123" })).toContain("phone");
    expect(pathsOf({ ...valid, phone: "" })).toContain("phone");
    expect(pathsOf({ ...valid, phone: "2125551234", phoneCountry: "US" })).toEqual([]);
    expect(pathsOf({ ...valid, email: "hola@" })).toContain("email");
    expect(pathsOf({ ...valid, name: "VX" })).toContain("name");
    // El aviso de privacidad ya no se captura aquí: si llega, se descarta (no se envía a la API).
    expect(
      updateAgencyFormSchema.parse({ ...valid, privacyNoticeUrl: "https://x.mx/aviso" }),
    ).not.toHaveProperty("privacyNoticeUrl");
  });
});

describe("bankAccountFormSchema (espejo de POST/PATCH /agencies/bank-accounts)", () => {
  const valid = {
    bankName: "BBVA",
    accountHolder: "Viajes Xalapa SA",
    clabeNumber: "012180001234567891",
    cardNumber: "",
  };

  const pathsOf = (input: Record<string, unknown>) => {
    const result = bankAccountFormSchema.safeParse(input);
    return result.success ? [] : result.error.issues.map((i) => i.path.join("."));
  };

  it("banco y titular son obligatorios (recortados) y con su longitud máxima", () => {
    expect(pathsOf(valid)).toEqual([]);
    expect(pathsOf({ ...valid, bankName: "   " })).toContain("bankName");
    expect(pathsOf({ ...valid, accountHolder: "" })).toContain("accountHolder");
    expect(pathsOf({ ...valid, bankName: "B".repeat(101) })).toContain("bankName");
    expect(pathsOf({ ...valid, accountHolder: "T".repeat(256) })).toContain("accountHolder");
  });

  it("la CLABE debe tener exactamente 18 dígitos", () => {
    expect(pathsOf({ ...valid, clabeNumber: "0121800012345678" })).toContain("clabeNumber");
    expect(pathsOf({ ...valid, clabeNumber: "012 180 001234567 89" })).toContain("clabeNumber"); // 17
    expect(pathsOf({ ...valid, clabeNumber: "" })).toContain("clabeNumber");
  });

  it("la tarjeta, si se captura, debe tener 16 dígitos", () => {
    expect(pathsOf({ ...valid, cardNumber: "4152 3134 1234 567" })).toContain("cardNumber"); // 15
    expect(pathsOf({ ...valid, cardNumber: "415231341234" })).toContain("cardNumber");
  });

  it("acepta CLABE y tarjeta con espacios o guiones y envía solo dígitos; tarjeta vacía → null", () => {
    const result = bankAccountFormSchema.parse({
      ...valid,
      bankName: "  BBVA ",
      clabeNumber: "012 180 00123456789 1",
      cardNumber: "4152-3134-1234-5678",
    });
    expect(result).toEqual({
      bankName: "BBVA",
      accountHolder: "Viajes Xalapa SA",
      clabeNumber: "012180001234567891",
      cardNumber: "4152313412345678",
    });
    expect(bankAccountFormSchema.parse({ ...valid, cardNumber: "  " }).cardNumber).toBeNull();
  });
});
