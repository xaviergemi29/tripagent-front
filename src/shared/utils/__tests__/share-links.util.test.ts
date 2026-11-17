import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildApiPublicFileUrl,
  buildBrochureUrl,
  buildMagicLinkUrl,
  buildWhatsAppUrl,
  formatPhoneForDisplay,
  toPhoneDigits,
} from "../share-links.util";

afterEach(() => vi.unstubAllEnvs());

describe("toPhoneDigits", () => {
  it("deja solo dígitos y tolera nulos", () => {
    expect(toPhoneDigits("+52 (228) 123-4567")).toBe("522281234567");
    expect(toPhoneDigits(null)).toBe("");
    expect(toPhoneDigits(undefined)).toBe("");
  });
});

describe("formatPhoneForDisplay", () => {
  it("muestra México en formato nacional 3-3-4 y otros países con su lada", () => {
    expect(formatPhoneForDisplay("+522288492011")).toBe("228 849 2011");
    expect(formatPhoneForDisplay("2288492011")).toBe("228 849 2011");
    expect(formatPhoneForDisplay("+34612345678")).toBe("+34 612 34 56 78");
  });

  it("con menos de 10 dígitos devuelve el valor recortado", () => {
    expect(formatPhoneForDisplay(" 12345 ")).toBe("12345");
    expect(formatPhoneForDisplay(null)).toBe("");
  });
});

describe("buildWhatsAppUrl", () => {
  it("limpia el teléfono y codifica el mensaje", () => {
    expect(buildWhatsAppUrl("228 123 4567", { message: "Hola, ¿cómo estás? & más" })).toBe(
      "https://wa.me/522281234567?text=Hola%2C%20%C2%BFc%C3%B3mo%20est%C3%A1s%3F%20%26%20m%C3%A1s",
    );
  });

  it("antepone la lada solo si se pide y omite ?text sin mensaje", () => {
    expect(buildWhatsAppUrl("2281234567", { countryCode: "52" })).toBe(
      "https://wa.me/522281234567",
    );
    // Por defecto: 10 dígitos llevan la lada de México (sin ella wa.me lo lee como +228, Togo);
    // un número ya internacional no se duplica.
    expect(buildWhatsAppUrl("2281234567")).toBe("https://wa.me/522281234567");
    expect(buildWhatsAppUrl("522281234567")).toBe("https://wa.me/522281234567");
    expect(buildWhatsAppUrl("+1 415 555 0100")).toBe("https://wa.me/14155550100");
    // Un E.164 de EE. UU. (10 dígitos nacionales) ya no recibe la lada 52 (2026-11-16).
    expect(buildWhatsAppUrl("+12125551234")).toBe("https://wa.me/12125551234");
  });
});

describe("enlaces públicos del front", () => {
  it("magic link y folleto usan el origen actual", () => {
    expect(buildMagicLinkUrl("abc123")).toBe(`${window.location.origin}/register?token=abc123`);
    expect(buildBrochureUrl("tour-1")).toBe(`${window.location.origin}/p/tour-1`);
  });
});

// `API_BASE_URL` (lib/api-config) se resuelve al cargar el módulo, como en la app (Next inyecta
// `NEXT_PUBLIC_API_URL` al compilar): cada caso recarga el módulo con la variable que prueba.
const loadWithApiUrl = async (apiUrl: string) => {
  vi.stubEnv("NEXT_PUBLIC_API_URL", apiUrl);
  vi.resetModules();
  return (await import("../share-links.util")).buildApiPublicFileUrl;
};

describe("buildApiPublicFileUrl", () => {
  it("sirve los archivos en <origen API>/public, fuera del prefijo /api", async () => {
    const build = await loadWithApiUrl("https://api.tripagent.mx/api");
    expect(build("/uploads/brochures/tour-1.pdf")).toBe(
      "https://api.tripagent.mx/public/uploads/brochures/tour-1.pdf",
    );
  });

  it("normaliza la ruta sin diagonal inicial y usa el origen local por defecto", async () => {
    const build = await loadWithApiUrl("");
    expect(build("uploads/logos/agency-1.png")).toBe(
      "http://localhost:3001/public/uploads/logos/agency-1.png",
    );
  });

  it("buildApiPublicFileUrl del import estático usa la misma configuración", () => {
    expect(buildApiPublicFileUrl("/uploads/x.pdf")).toMatch(/\/public\/uploads\/x\.pdf$/);
  });
});
