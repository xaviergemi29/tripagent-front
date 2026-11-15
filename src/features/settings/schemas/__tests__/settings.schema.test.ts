import { describe, expect, it } from "vitest";
import { brandingFormSchema, hexColorSchema } from "../branding.schema";
import { updateAgencyFormSchema } from "../agency.schema";

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
    email: "hola@viajesxalapa.mx",
    bankName: "BBVA",
    bankAccountHolder: "Viajes Xalapa SA",
    address: "",
    privacyNoticeUrl: "",
    clabeNumber: "012180001234567891",
    cardNumber: "",
  };

  const pathsOf = (input: Record<string, unknown>) => {
    const result = updateAgencyFormSchema.safeParse(input);
    return result.success ? [] : result.error.issues.map((i) => i.path.join("."));
  };

  it("acepta la agencia con tarjeta y aviso de privacidad opcionales", () => {
    expect(pathsOf(valid)).toEqual([]);
    expect(
      pathsOf({
        ...valid,
        cardNumber: "4152313412345678",
        privacyNoticeUrl: "https://viajesxalapa.mx/privacidad",
      }),
    ).toEqual([]);
  });

  it("la CLABE debe tener exactamente 18 dígitos sin espacios", () => {
    expect(pathsOf({ ...valid, clabeNumber: "0121800012345678" })).toContain("clabeNumber");
    expect(pathsOf({ ...valid, clabeNumber: "012 180 00123456789 1" })).toContain("clabeNumber");
    expect(pathsOf({ ...valid, clabeNumber: "" })).toContain("clabeNumber");
  });

  it("la tarjeta, si se captura, debe tener 16 dígitos", () => {
    expect(pathsOf({ ...valid, cardNumber: "4152 3134 1234 5678" })).toContain("cardNumber");
    expect(pathsOf({ ...valid, cardNumber: "415231341234" })).toContain("cardNumber");
  });

  it("valida teléfono, correo, nombre y la URL del aviso de privacidad", () => {
    expect(pathsOf({ ...valid, phone: "228-123" })).toContain("phone");
    expect(pathsOf({ ...valid, email: "hola@" })).toContain("email");
    expect(pathsOf({ ...valid, name: "VX" })).toContain("name");
    expect(pathsOf({ ...valid, privacyNoticeUrl: "viajesxalapa.mx/privacidad" })).toContain(
      "privacyNoticeUrl",
    );
  });
});
