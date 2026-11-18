import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ToursPage from "../(dashboard)/tours/page";
import TravelersPage from "../(dashboard)/travelers/page";
import { TravelerHistoryDrawer } from "@/features/travelers/components/TravelerHistoryDrawer";

// Si la API falla, las pantallas dicen que no se pudo cargar (con "Volver a intentar"), no que no hay
// datos: antes mostraban "No tienes tours programados" / "Aún no hay viajeros" (2026-11-16).

const refetch = vi.fn();
let query: Record<string, unknown> = {};
const failed = () => ({
  data: undefined,
  isLoading: false,
  isError: true,
  error: new Error("timeout of 10000ms exceeded"),
  refetch,
  isFetching: false,
});

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/features/onboarding/hooks/useGuidedTour", () => ({
  useGuidedTour: () => ({ start: vi.fn() }),
}));
vi.mock("@/features/tours/hooks/useTours", () => ({ useTours: () => query }));
// Banner de agencia sin CLABE en /tours (OBS-038): sin datos de la agencia no se dibuja.
vi.mock("@/features/settings/hooks/useAgency", () => ({ useAgency: () => ({ data: undefined }) }));
vi.mock("@/features/travelers/hooks/useTravelers", () => ({
  useTravelers: () => query,
  useDeleteTraveler: () => ({ mutate: vi.fn() }),
  useTravelerHistory: () => query,
  useUpdateTraveler: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe("Pantallas con la consulta fallida", () => {
  beforeEach(() => {
    refetch.mockClear();
    query = failed();
  });

  it("/tours: error con Reintentar, no el estado vacío", async () => {
    render(<ToursPage />);
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar tus tours");
    // Sin tecnicismos: el error de la API no se muestra.
    expect(screen.queryByText(/timeout/)).not.toBeInTheDocument();
    expect(screen.queryByText("No tienes tours programados")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Volver a intentar/ }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("/travelers: error con Reintentar, no 'Aún no hay viajeros'", () => {
    render(<TravelersPage />);
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar tus viajeros");
    expect(screen.queryByText(/Aún no hay viajeros registrados/)).not.toBeInTheDocument();
  });

  it("historial: error con Reintentar, no un perfil vacío con 0 viajes", () => {
    render(<TravelerHistoryDrawer travelerId="v1" onClose={vi.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar el historial");
    expect(screen.queryByText(/No se encontraron registros/)).not.toBeInTheDocument();
  });

  it("si la API responde bien y vacía, sí se muestra el estado vacío", () => {
    query = { ...failed(), isError: false, error: null, data: [] };
    render(<ToursPage />);
    expect(screen.getByText("No tienes tours programados")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
