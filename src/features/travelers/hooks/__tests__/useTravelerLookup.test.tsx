import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTravelerLookup } from "../useTravelers";

// Apartado rápido: la búsqueda de /travelers es parcial (nombre, correo y teléfono), así que solo
// se autocompleta el viajero cuyo WhatsApp es exactamente el escrito (2026-11-16).

const results = vi.fn();
vi.mock("@/lib/api-client", () => ({ apiClient: { get: async () => results() } }));

function setup() {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useTravelerLookup(), { wrapper }).result.current.lookupTraveler;
}

describe("useTravelerLookup", () => {
  it("ignora a otro viajero que solo tiene esos dígitos en el correo", async () => {
    results.mockReturnValue([
      {
        id: "x",
        fullName: "Otra Persona",
        email: "2281234567@gmail.com",
        whatsappPhone: "5511112222",
      },
      { id: "a", fullName: "Ana Torres", email: "ana@correo.mx", whatsappPhone: "2281234567" },
    ]);
    expect((await setup()("2281234567"))?.id).toBe("a");
  });

  it("sin coincidencia exacta de WhatsApp no autocompleta", async () => {
    results.mockReturnValue([
      {
        id: "x",
        fullName: "Otra Persona",
        email: "2281234567@gmail.com",
        whatsappPhone: "5511112222",
      },
    ]);
    expect(await setup()("2281234567")).toBeNull();
  });
});
