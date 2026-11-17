import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PASSENGER_ROLE, TOUR_TEMPORAL_STATUS } from "@/shared/constants/domain.constants";
import type { TourDashboardOutput } from "../../schemas/tour-dashboard.schema";
import { TourDashboardView } from "../TourDashboardView";

// Contenedor del Centro de Control: compone escritorio y celular con un solo estado (pestaña y
// filtros). Los datos del tour y de la agencia se simulan en sus hooks; la red queda bloqueada.

const dashboardQuery = vi.fn();
vi.mock("../../hooks/useTourDashboard", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../hooks/useTourDashboard")>()),
  useTourDashboardByTourId: () => dashboardQuery(),
}));
vi.mock("@/features/settings/hooks/useAgency", () => ({
  useAgency: () => ({ data: { name: "Viajes Xalapa", bankName: "BBVA", clabeNumber: "012" } }),
}));
vi.mock("@/features/settings/hooks/useAgencyBranding", () => ({
  useAgencyBranding: () => ({ data: undefined }),
}));
// Ninguna petición real: cualquier llamada queda pendiente.
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: () => new Promise(() => {}),
    post: () => new Promise(() => {}),
    patch: () => new Promise(() => {}),
    delete: () => new Promise(() => {}),
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const TOUR_ID = "92779764-2131-4c4b-8153-398fbd74bfad";

const titular = (id: string, fullName: string, overrides: Record<string, unknown> = {}) => ({
  id,
  bookingId: `${id.slice(0, -1)}b`,
  role: PASSENGER_ROLE.TITULAR,
  fullName,
  whatsapp: "2281234567",
  groupSize: 1,
  unitPrice: 1500,
  bookingStatus: "PENDING",
  requiredDeposit: 500,
  hasSeatRight: false,
  bookedAt: new Date().toISOString(),
  formStatus: "COMPLETED",
  seatLabel: null,
  boardingPoint: "Plaza",
  boardingPointDetails: null,
  magicToken: null,
  paymentStatus: "PENDING",
  paidAmount: 0,
  balance: 1500,
  companions: [],
  ...overrides,
});

const dashboard = (overrides: Partial<TourDashboardOutput> = {}) =>
  ({
    id: TOUR_ID,
    title: "Huasteca Potosina",
    currency: "MXN",
    departureDateTime: "2026-12-20T00:00:00.000Z",
    returnDate: null,
    postPaymentInstructions: null,
    temporalStatus: TOUR_TEMPORAL_STATUS.UPCOMING,
    requiresSeats: false,
    metrics: {
      occupancy: { max: 20, current: 2 },
      revenue: { projected: 3000, collected: 500 },
      pendingValidations: 0,
      logistics: { total: 0, assigned: 0, unassigned: 0 },
    },
    vehicle: null,
    staffCapacity: 0,
    travelers: [
      titular("11111111-1111-4111-8111-111111111111", "Ana Torres", {
        paymentStatus: "PARTIAL",
        paidAmount: 500,
        balance: 1000,
      }),
      titular("22222222-2222-4222-8222-222222222222", "Beto Ruiz"),
    ],
    cancellation: null,
    refunds: [],
    ...overrides,
  }) as TourDashboardOutput;

const renderView = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<TourDashboardView tourId={TOUR_ID} />, { wrapper });
};

beforeEach(() => {
  dashboardQuery.mockReset();
  dashboardQuery.mockReturnValue({ data: dashboard(), isLoading: false, isError: false });
});

describe("TourDashboardView", () => {
  it("mientras carga no muestra el tour", () => {
    dashboardQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    renderView();
    expect(screen.queryByText("Huasteca Potosina")).not.toBeInTheDocument();
  });

  it("si falla muestra el aviso con Volver a intentar, sin el error técnico", async () => {
    const refetch = vi.fn();
    dashboardQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { status: 500, message: "Error interno del servidor" },
      refetch,
      isFetching: false,
    });
    renderView();
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar el Centro de Control");
    expect(screen.queryByText(/Error interno del servidor/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Volver a intentar/ }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("un 404 dice 'Tour no encontrado' y no ofrece reintentar", () => {
    dashboardQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { status: 404, message: "Tour no encontrado" },
      refetch: vi.fn(),
      isFetching: false,
    });
    renderView();
    expect(screen.getByRole("heading", { name: "Tour no encontrado" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Volver a intentar/ })).not.toBeInTheDocument();
  });

  it("los filtros son un solo estado para escritorio y celular", async () => {
    const user = userEvent.setup();
    renderView();
    expect(screen.getByText("Mostrando 2 reservas principales")).toBeInTheDocument();

    // Se escribe en el buscador de escritorio; la lista del celular también se filtra.
    const [desktopSearch] = screen.getAllByPlaceholderText("Buscar viajero o teléfono...");
    await user.type(desktopSearch!, "beto");
    expect(screen.getByText("Mostrando 1 reservas principales")).toBeInTheDocument();
  });

  it("tour operable: permite nueva reserva y cancelar el tour", () => {
    renderView();
    expect(screen.getAllByRole("button", { name: /Nueva Reserva/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /Cancelar tour/ }).length).toBeGreaterThan(0);
  });

  it("Modo Auditoría (FINALIZADO): sin nueva reserva ni cancelar", () => {
    dashboardQuery.mockReturnValue({
      data: dashboard({ temporalStatus: TOUR_TEMPORAL_STATUS.FINISHED }),
      isLoading: false,
      isError: false,
    });
    renderView();
    expect(screen.queryByRole("button", { name: /Nueva Reserva/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cancelar tour/ })).not.toBeInTheDocument();
  });
});
