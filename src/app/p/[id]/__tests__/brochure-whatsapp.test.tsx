import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import PublicTourLanding from "../page";

// El Server Component async se llama como función (ver /s/[token]): caché nueva del React Compiler.
vi.mock("react/compiler-runtime", () => ({
  c: (size: number) => new Array(size).fill(Symbol.for("react.memo_cache_sentinel")),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("@/lib/forwarded-client-ip", () => ({ getForwardedClientIpHeaders: async () => ({}) }));

const tour = (availability: Record<string, unknown>, phone: string | null = "+522281234567") => ({
  id: "t1",
  title: "Zacatlán de las manzanas",
  currency: "MXN",
  transportModality: "TRANSPORT_INCLUDED",
  durationHours: 12,
  depositPerPerson: 500,
  price: 1200,
  departureDateTime: "2026-12-12",
  returnDate: "2026-12-12",
  brochureUrl: null,
  boardingPoints: [{ id: "b1", location: "Plaza Central", time: "06:00" }],
  agency: { name: "Viajes Xalapa", phone, logoPath: null, address: null },
  availability: {
    sellableCapacity: 20,
    occupiedSeats: 10,
    availableSeats: 10,
    isBookable: true,
    hasDeparted: false,
    acceptsOnlineBookings: true,
    ...availability,
  },
});

const renderPage = async (body: unknown) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, json: async () => body })),
  );
  const page = await PublicTourLanding({ params: Promise.resolve({ id: "t1" }) });
  render(<QueryClientProvider client={new QueryClient()}>{page}</QueryClientProvider>);
};

const whatsappText = () =>
  decodeURIComponent(
    screen
      .getByRole("link", { name: /Contactar asesor por WhatsApp/ })
      .getAttribute("href")!
      .split("?text=")[1]!,
  );

describe("Folleto /p/[id]: mensaje de WhatsApp según el estado del tour", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ["disponible", {}, "Iniciar Reserva", "me interesa reservar"],
    [
      "agotado",
      { availableSeats: 0, occupiedSeats: 20, isBookable: false },
      "Agotado",
      "¿Podrían avisarme si se libera algún lugar?",
    ],
    [
      "finalizado",
      { isBookable: false, hasDeparted: true },
      "Finalizado",
      "¿Tienen próximas salidas de este tour?",
    ],
    [
      "reservas en pausa",
      { isBookable: false, acceptsOnlineBookings: false },
      "Reservas en pausa",
      "¿Me pueden dar información para reservar?",
    ],
  ])("%s", async (_state, availability, buttonLabel, message) => {
    await renderPage(tour(availability));

    expect(screen.getByRole("button", { name: buttonLabel })).toBeInTheDocument();
    expect(whatsappText()).toContain("*Zacatlán de las manzanas* (sábado, 12 de diciembre)");
    expect(whatsappText()).toContain(message);
  });

  it("sin teléfono de la agencia no se ofrece el WhatsApp", async () => {
    await renderPage(tour({ availableSeats: 0, isBookable: false }, null));
    expect(screen.queryByRole("link", { name: /Contactar asesor por WhatsApp/ })).toBeNull();
  });
});
