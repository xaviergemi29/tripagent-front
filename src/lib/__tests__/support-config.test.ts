import { afterEach, describe, expect, it, vi } from "vitest";

// `SUPPORT_WHATSAPP` se lee al cargar el módulo: cada caso lo vuelve a importar con su variable.
const loadWithPhone = async (value: string | undefined) => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SUPPORT_WHATSAPP", value ?? "");
  return import("../support-config");
};

afterEach(() => vi.unstubAllEnvs());

describe("buildSupportWhatsAppUrl", () => {
  it("con E.164 arma wa.me con la lada y el mensaje", async () => {
    const { buildSupportWhatsAppUrl } = await loadWithPhone("+522281598139");
    expect(buildSupportWhatsAppUrl("Hola, tengo dudas")).toBe(
      "https://wa.me/522281598139?text=Hola%2C%20tengo%20dudas",
    );
  });

  it("10 dígitos sin '+' se toman como México (agrega el 52)", async () => {
    const { buildSupportWhatsAppUrl } = await loadWithPhone("2281598139");
    expect(buildSupportWhatsAppUrl("Hola")).toBe("https://wa.me/522281598139?text=Hola");
  });

  it("sin la variable no hay enlace (nunca un número falso)", async () => {
    const { buildSupportWhatsAppUrl } = await loadWithPhone(undefined);
    expect(buildSupportWhatsAppUrl("Hola")).toBeNull();
  });
});
