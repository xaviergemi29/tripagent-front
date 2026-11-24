import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StaffSharePage, { metadata } from "../page";
import { buildPayload } from "@/features/staff-share/__tests__/staff-share.fixtures";

// El Server Component async se llama como función (sin renderer de React): el runtime del React
// Compiler necesita una caché; una nueva en cada llamada equivale a no memorizar.
vi.mock("react/compiler-runtime", () => ({
  c: (size: number) => new Array(size).fill(Symbol.for("react.memo_cache_sentinel")),
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const params = (token: string) => ({ params: Promise.resolve({ token }) });
const stubFetch = (status: number, body: unknown = {}) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: status < 400, status, json: async () => body })),
  );

describe("/s/[token]", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("no se indexa y lleva título propio", () => {
    expect(metadata.title).toBe("Croquis del viaje");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("dibuja encabezado, vigencia (CDMX) y croquis con el sobre { data }", async () => {
    stubFetch(200, { data: buildPayload() });
    render(await StaffSharePage(params("tok-1")));

    expect(screen.getByRole("heading", { name: "Zacatlán de las manzanas" })).toBeInTheDocument();
    expect(screen.getByText("Viajes Xalapa")).toBeInTheDocument();
    expect(screen.getByText("Enlace para staff")).toBeInTheDocument();
    expect(
      screen.getByText(/Vigente hasta 15 de diciembre de 2026 a las 11:59/),
    ).toBeInTheDocument();
    expect(screen.getByText("Ana T.")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/2281234567|4321/);
    expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({ cache: "no-store" });
  });

  it("404 → notFound()", async () => {
    stubFetch(404);
    await expect(StaffSharePage(params("x"))).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("429, 500 y red → pantalla amable", async () => {
    stubFetch(429);
    render(await StaffSharePage(params("x")));
    expect(screen.getByText(/Demasiados intentos/)).toBeInTheDocument();

    stubFetch(500);
    render(await StaffSharePage(params("x")));
    expect(screen.getAllByText(/No pudimos cargar el croquis/)).toHaveLength(1);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("red")));
    render(await StaffSharePage(params("x")));
    expect(screen.getAllByText(/No pudimos cargar el croquis/)).toHaveLength(2);
  });
});
