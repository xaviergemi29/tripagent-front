import { afterEach, describe, expect, it, vi } from "vitest";
import { generateMetadata } from "../page";

// La vista previa del folleto al compartirlo por WhatsApp muestra el tour y la agencia, no
// "Panel de Administración" (2026-11-16).

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("generateMetadata del folleto (/p/[id])", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("título y descripción con el tour, la agencia y la fecha de salida", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          title: "Zacatlán de las manzanas",
          departureDateTime: "2026-11-20",
          agency: { name: "Viajes Xalapa" },
        }),
      })),
    );

    const metadata = await generateMetadata(params("t1"));

    expect(metadata.title).toEqual({ absolute: "Zacatlán de las manzanas | Viajes Xalapa" });
    expect(metadata.description).toMatch(/^Salida: Viernes, 20 de noviembre/);
    expect(metadata.openGraph).toMatchObject({
      title: "Zacatlán de las manzanas | Viajes Xalapa",
      locale: "es_MX",
      siteName: "Viajes Xalapa",
    });
  });

  it("tour cancelado o inexistente (404): título genérico y sin indexar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, json: async () => ({}) })),
    );
    const metadata = await generateMetadata(params("no-existe"));
    expect(metadata).toEqual({ title: "Folleto no disponible", robots: { index: false } });
  });
});
