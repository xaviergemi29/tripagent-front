import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PASSENGER_ROLE, TOUR_TEMPORAL_STATUS } from "@/shared/constants/domain.constants";
import type { TourDashboardOutput } from "../../schemas/tour-dashboard.schema";
import { TourDashboardView } from "../TourDashboardView";

// Cuenta operativa salvo en el caso del Modo Solo Lectura por suscripción (2026-11-18).
let subscriptionReadOnly = false;
vi.mock("@/features/settings/hooks/useSubscriptionAccess", () => ({
  SUBSCRIPTION_SETTINGS_HREF: "/settings?tab=subscription",
  useSubscriptionAccess: () => ({
    isReadOnly: subscriptionReadOnly,
    isLoading: false,
    canWrite: !subscriptionReadOnly,
    subscription: undefined,
  }),
}));

// El resaltado de una notificación limpia `?bookingId=` de la URL al apagarse.
const routerReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplace, push: vi.fn() }),
  usePathname: () => "/tours/92779764-2131-4c4b-8153-398fbd74bfad",
}));

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

const renderView = (focusBookingId: string | null = null) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<TourDashboardView tourId={TOUR_ID} focusBookingId={focusBookingId} />, {
    wrapper,
  });
};

beforeEach(() => {
  subscriptionReadOnly = false;
  routerReplace.mockReset();
  dashboardQuery.mockReset();
  dashboardQuery.mockReturnValue({ data: dashboard(), isLoading: false, isError: false });
});

describe("TourDashboardView", () => {
  it("?bookingId= de una reserva que la caché aún no trae: recarga el dashboard una vez y la resalta", () => {
    const newId = "33333333-3333-4333-8333-33333333333b";
    const refetch = vi.fn();
    const stale = dashboard();
    dashboardQuery.mockReturnValue({ data: stale, isLoading: false, isError: false, refetch });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { rerender } = render(<TourDashboardView tourId={TOUR_ID} focusBookingId={newId} />, {
      wrapper,
    });
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(document.querySelector(`[data-booking-id="${newId}"]`)).toBeNull();

    // Llega el dashboard fresco con la reserva nueva.
    const fresh = dashboard();
    fresh.travelers = [
      ...fresh.travelers,
      titular("33333333-3333-4333-8333-333333333333", "Carla Soto", { bookingId: newId }),
    ] as TourDashboardOutput["travelers"];
    dashboardQuery.mockReturnValue({ data: fresh, isLoading: false, isError: false, refetch });
    rerender(<TourDashboardView tourId={TOUR_ID} focusBookingId={newId} />);
    const row = document.querySelector(`[data-booking-id="${newId}"]`);
    expect(row!.className).toMatch(/bg-indigo-50/);
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("?bookingId= (notificación): resalta el grupo en escritorio y celular, y luego se apaga", () => {
    vi.useFakeTimers();
    try {
      const betoBookingId = "22222222-2222-4222-8222-22222222222b";
      renderView(betoBookingId);

      const highlighted = document.querySelectorAll(`[data-booking-id="${betoBookingId}"]`);
      expect(highlighted).toHaveLength(2); // fila de escritorio + tarjeta del celular
      const [row, card] = Array.from(highlighted);
      expect(row!.className).toMatch(/bg-indigo-50/);
      expect(card!.className).toMatch(/ring-indigo-400/);
      const anaRow = document.querySelector(
        '[data-booking-id="11111111-1111-4111-8111-11111111111b"]',
      );
      expect(anaRow!.className).not.toMatch(/bg-indigo-50/);

      act(() => vi.advanceTimersByTime(4000));
      expect(row!.className).not.toMatch(/bg-indigo-50/);
      expect(card!.className).not.toMatch(/ring-indigo-400/);
    } finally {
      vi.useRealTimers();
    }
  });

  it("al apagar el resaltado quita ?bookingId= y otro clic en la misma notificación vuelve a resaltar", () => {
    vi.useFakeTimers();
    try {
      const betoBookingId = "22222222-2222-4222-8222-22222222222b";
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      );
      const view = (focus: string | null) => (
        <TourDashboardView tourId={TOUR_ID} focusBookingId={focus} />
      );
      const { rerender } = render(view(betoBookingId), { wrapper });
      const row = () => document.querySelector(`[data-booking-id="${betoBookingId}"]`)!;

      act(() => vi.advanceTimersByTime(4000));
      expect(row().className).not.toMatch(/bg-indigo-50/);
      expect(routerReplace).toHaveBeenCalledWith(`/tours/${TOUR_ID}`, { scroll: false });

      // La URL ya no trae el parámetro; el segundo clic lo vuelve a poner.
      rerender(view(null));
      rerender(view(betoBookingId));
      expect(row().className).toMatch(/bg-indigo-50/);
    } finally {
      vi.useRealTimers();
    }
  });

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

  it("cuenta en Modo Solo Lectura por suscripción: un tour próximo se consulta sin acciones", () => {
    subscriptionReadOnly = true;
    renderView();
    expect(screen.queryByRole("button", { name: /Nueva Reserva/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cancelar tour/ })).not.toBeInTheDocument();
    expect(screen.getAllByText("Ana Torres").length).toBeGreaterThan(0);
  });

  it("filtro «Canceladas»: reservas canceladas por el cliente en solo lectura; el drawer solo permite anular", async () => {
    // Decisión del usuario (2026-11-17): corte de caja de un abono mal capturado después de cancelar.
    const user = userEvent.setup();
    dashboardQuery.mockReturnValue({
      data: dashboard({
        cancelledTravelers: [
          titular("33333333-3333-4333-8333-333333333333", "Carla Díaz", {
            bookingStatus: "CANCELLED",
            paymentStatus: "PAID",
            paidAmount: 1500,
            balance: 0,
            payments: [
              {
                id: "pay-1",
                amount: 1500,
                method: "CASH",
                type: "PAYMENT",
                createdAt: "2026-11-11T10:00:00.000Z",
                referenceInfo: null,
                registeredBy: null,
                amountUSD: null,
                amountMXN: null,
                exchangeRate: null,
              },
            ],
          }),
        ],
      } as unknown as Partial<TourDashboardOutput>),
      isLoading: false,
      isError: false,
    });
    renderView();

    const [desktopPaymentFilter] = screen.getAllByDisplayValue("Pagos: Todos");
    await user.selectOptions(desktopPaymentFilter!, "CANCELLED");

    expect(screen.getAllByText("Carla Díaz").length).toBeGreaterThan(0);
    expect(screen.queryByText("Ana Torres")).not.toBeInTheDocument();
    expect(screen.getAllByText(/Retenido: \$1,500\.00 MXN/).length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole("button", { name: "Registrar abonos y pagos" })[0]!);
    // Solo lectura: sin registrar abonos ni cancelar; "Anular" sí.
    expect(screen.queryByText(/Registrar Abono/)).not.toBeInTheDocument();
    expect(screen.queryByText("Cancelar Reserva Completa (Todos)")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Anular abono" }));

    // Ya no acepta abonos: no se ofrece volver a capturar, y se explica el efecto en la retención.
    expect(screen.queryByText("Anular y volver a capturar")).not.toBeInTheDocument();
    expect(screen.getByText(/la retención bajará a lo que realmente se abonó/)).toBeInTheDocument();
  });

  it("filtro «Canceladas» sin reservas canceladas: lo dice en lugar de una lista vacía", async () => {
    const user = userEvent.setup();
    renderView();
    const [desktopPaymentFilter] = screen.getAllByDisplayValue("Pagos: Todos");
    await user.selectOptions(desktopPaymentFilter!, "CANCELLED");
    expect(
      screen.getByText("No hay reservas canceladas por el cliente en este tour."),
    ).toBeInTheDocument();
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
