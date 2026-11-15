// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "../proxy";

// Middleware de Next 16 (src/proxy.ts): protege el panel por la existencia de la cookie `token`.
// Debe mantenerse en sincronía con las cabeceras `no-store` de next.config.ts.

const request = (path: string, token?: string) => {
  const req = new NextRequest(new URL(path, "http://localhost:3000"));
  if (token) req.cookies.set("token", token);
  return req;
};

const locationOf = (res: Response) => res.headers.get("location");

describe("proxy (middleware)", () => {
  it.each(["/tours", "/tours/abc/edit", "/travelers", "/settings", "/pdf-tour/abc"])(
    "sin cookie, %s redirige a /login",
    (path) => {
      const res = proxy(request(path));
      expect(res.status).toBe(307);
      expect(locationOf(res)).toBe("http://localhost:3000/login");
    },
  );

  it("con cookie deja pasar al panel", () => {
    const res = proxy(request("/tours", "jwt"));
    expect(locationOf(res)).toBeNull();
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("no protege rutas que solo empiezan igual (p. ej. /toursx) ni las páginas públicas", () => {
    for (const path of ["/toursx", "/register?token=abc", "/p/tour-1", "/"]) {
      expect(locationOf(proxy(request(path)))).toBeNull();
    }
  });

  it("con sesión, entrar a /login manda a /tours", () => {
    const res = proxy(request("/login", "jwt"));
    expect(locationOf(res)).toBe("http://localhost:3000/tours");
  });

  it("con ?expired=true deja entrar al login y borra la cookie vencida", () => {
    const res = proxy(request("/login?expired=true", "jwt-vencido"));
    expect(locationOf(res)).toBeNull();
    expect(res.headers.get("set-cookie")).toMatch(/token=;/);
  });

  it("sin sesión, /login se muestra normalmente", () => {
    expect(locationOf(proxy(request("/login")))).toBeNull();
  });

  it("el matcher excluye la API, los estáticos y las imágenes de Next", () => {
    expect(config.matcher[0]).toContain("api|_next/static|_next/image|favicon.ico");
  });
});
