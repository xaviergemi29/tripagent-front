import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

describe("next.config: encabezados de seguridad", () => {
  it("aplica anti-clickjacking, nosniff y Referrer-Policy a todas las páginas", async () => {
    const rules = await nextConfig.headers!();
    const all = rules.find((rule) => rule.source === "/:path*");
    const headers = Object.fromEntries(all!.headers.map((h) => [h.key, h.value]));

    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });

  it("conserva el no-store de las páginas privadas", async () => {
    const rules = await nextConfig.headers!();
    const tours = rules.find((rule) => rule.source === "/tours/:path*");
    expect(tours!.headers[0]!.value).toContain("no-store");
  });
});
