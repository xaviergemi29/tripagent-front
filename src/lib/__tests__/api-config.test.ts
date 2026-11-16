import { afterEach, describe, expect, it, vi } from "vitest";

// Respaldo único de la URL de la API (2026-11-16): sin `NEXT_PUBLIC_API_URL`, las páginas públicas
// (`/register`, `/p/[id]`) pedían a "undefined/..." mientras el panel sí funcionaba.

afterEach(() => vi.unstubAllEnvs());

const load = async (apiUrl: string) => {
  vi.stubEnv("NEXT_PUBLIC_API_URL", apiUrl);
  vi.resetModules();
  return import("../api-config");
};

describe("api-config", () => {
  it("usa NEXT_PUBLIC_API_URL cuando existe", async () => {
    expect((await load("https://api.tripagent.mx/api")).API_BASE_URL).toBe(
      "https://api.tripagent.mx/api",
    );
  });

  it("sin la variable usa la API local, igual en el panel y en las páginas públicas", async () => {
    expect((await load("")).API_BASE_URL).toBe("http://localhost:3001/api");
  });

  it("las subidas tienen más margen que una petición normal", async () => {
    const { API_TIMEOUT_MS, UPLOAD_TIMEOUT_MS } = await load("");
    expect(UPLOAD_TIMEOUT_MS).toBeGreaterThan(API_TIMEOUT_MS);
  });
});
