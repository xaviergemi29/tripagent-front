// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// IP del visitante hacia la API en las páginas públicas que se arman en el servidor (2026-11-22).

let incoming = new Headers();
vi.mock("next/headers", () => ({ headers: async () => incoming }));

const { getForwardedClientIpHeaders, CLIENT_IP_HEADER, INTERNAL_SECRET_HEADER } =
  await import("../forwarded-client-ip");

const SECRET = "s".repeat(40);

beforeEach(() => {
  incoming = new Headers();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getForwardedClientIpHeaders", () => {
  it("sin INTERNAL_PROXY_SECRET no envía nada (comportamiento anterior)", async () => {
    vi.stubEnv("INTERNAL_PROXY_SECRET", "");
    incoming = new Headers({ "x-forwarded-for": "187.190.1.20" });
    expect(await getForwardedClientIpHeaders()).toEqual({});
  });

  it("reenvía el primer valor de x-forwarded-for con el secreto", async () => {
    vi.stubEnv("INTERNAL_PROXY_SECRET", SECRET);
    incoming = new Headers({ "x-forwarded-for": "187.190.1.20, 10.0.0.1" });
    expect(await getForwardedClientIpHeaders()).toEqual({
      [CLIENT_IP_HEADER]: "187.190.1.20",
      [INTERNAL_SECRET_HEADER]: SECRET,
    });
  });

  it("usa x-real-ip si no hay x-forwarded-for", async () => {
    vi.stubEnv("INTERNAL_PROXY_SECRET", SECRET);
    incoming = new Headers({ "x-real-ip": "2806:2f0::1" });
    expect(await getForwardedClientIpHeaders()).toMatchObject({
      [CLIENT_IP_HEADER]: "2806:2f0::1",
    });
  });

  it("sin IP conocida no envía el secreto", async () => {
    vi.stubEnv("INTERNAL_PROXY_SECRET", SECRET);
    expect(await getForwardedClientIpHeaders()).toEqual({});
  });
});
