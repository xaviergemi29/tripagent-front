import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, renderHook, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PASSENGER_ROLE, TOUR_TEMPORAL_STATUS } from "@/shared/constants/domain.constants";
import type { TourDashboardOutput } from "../../schemas/tour-dashboard.schema";
import { useCancelFullBooking } from "../../hooks/useBookingActions";
import { useQuickRemovePassenger } from "../../hooks/useTourDashboard";
import { TourDashboardView } from "../TourDashboardView";

// Baja de un acompañante y cancelación total: el grupo afectado se dibuja como skeleton mientras la
// mutación está en curso y mientras se recarga el dashboard, y vuelve con los datos nuevos.

vi.mock("@/features/settings/hooks/useSubscriptionAccess", () => ({
  SUBSCRIPTION_SETTINGS_HREF: "/settings?tab=subscription",
  useSubscriptionAccess: () => ({
    isReadOnly: false,
    isLoading: false,
    canWrite: true,
    subscription: undefined,
  }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/tours/t1",
}));

const dashboardQuery = vi.fn();
vi.mock("../../hooks/useTourDashboard", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../hooks/useTourDashboard")>()),
  useTourDashboardByTourId: () => dashboardQuery(),
}));
vi.mock("../../hooks/useLodging", () => ({
  useTourLodging: () => ({ data: undefined }),
  useRegisterLodgingRooms: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/features/settings/hooks/useAgency", () => ({
  useAgency: () => ({ data: { name: "Viajes Xalapa", bankName: "BBVA", clabeNumber: "012" } }),
}));
vi.mock("@/features/settings/hooks/useAgencyBranding", () => ({
  useAgencyBranding: () => ({ data: undefined }),
}));

const patch = vi.fn();
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: () => new Promise(() => {}),
    post: () => new Promise(() => {}),
    patch: (...args: unknown[]) => patch(...args),
    delete: () => new Promise(() => {}),
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const ANA_BOOKING = "11111111-1111-4111-8111-11111111111b";

const titular = (id: string, fullName: string) => ({
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
});

const dashboard = () =>
  ({
    id: "t1",
    title: "Huasteca Potosina",
    currency: "MXN",
    departureDateTime: "2026-12-20T00:00:00.000Z",
    returnDate: null,
    postPaymentInstructions: null,
    temporalStatus: TOUR_TEMPORAL_STATUS.UPCOMING,
    requiresSeats: false,
    metrics: {
      occupancy: { max: 20, current: 2 },
      revenue: { projected: 3000, collected: 0 },
      pendingValidations: 0,
      logistics: { total: 0, assigned: 0, unassigned: 0 },
    },
    vehicle: null,
    staffCapacity: 0,
    travelers: [
      titular("11111111-1111-4111-8111-111111111111", "Ana Torres"),
      titular("22222222-2222-4222-8222-222222222222", "Beto Ruiz"),
    ],
    cancellation: null,
    refunds: [],
  }) as unknown as TourDashboardOutput;

const loaded = (extra: Record<string, unknown> = {}) => ({
  data: dashboard(),
  isLoading: false,
  isError: false,
  isFetching: false,
  dataUpdatedAt: 1000,
  ...extra,
});

let client: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  patch.mockReset();
  dashboardQuery.mockReset();
  dashboardQuery.mockReturnValue(loaded());
});

const cases = [
  {
    name: "dar de baja a un acompañante",
    run: () => {
      const { result } = renderHook(() => useQuickRemovePassenger(), { wrapper });
      act(() => result.current.mutate({ bookingId: ANA_BOOKING, passengerId: "p1" }));
    },
  },
  {
    name: "cancelar la reserva completa",
    run: () => {
      const { result } = renderHook(() => useCancelFullBooking(), { wrapper });
      act(() => result.current.mutate({ bookingId: ANA_BOOKING, penaltyAmount: 0 }));
    },
  },
];

describe("Grupo en actualización (baja y cancelación total)", () => {
  it.each(cases)(
    "$name: skeleton del grupo mientras se guarda y se recarga, y desaparece con los datos nuevos",
    async ({ run }) => {
      let resolvePatch: (value: unknown) => void = () => {};
      patch.mockReturnValue(new Promise((resolve) => (resolvePatch = resolve)));

      const view = render(<TourDashboardView tourId="t1" />, { wrapper });
      expect(screen.queryByRole("status", { name: "Actualizando reserva" })).toBeNull();
      expect(screen.getAllByText("Ana Torres").length).toBeGreaterThan(0);

      // 1. Mutación en curso: escritorio y celular dibujan el skeleton de ese grupo.
      run();
      const busy = await screen.findAllByRole("status", { name: "Actualizando reserva" });
      expect(busy).toHaveLength(2);
      expect(screen.queryByText("Ana Torres")).toBeNull();
      expect(screen.getAllByText("Beto Ruiz").length).toBeGreaterThan(0);

      // 2. La API respondió y el dashboard se está recargando (datos anteriores a la mutación).
      dashboardQuery.mockReturnValue(loaded({ isFetching: true }));
      await act(async () => resolvePatch({}));
      view.rerender(<TourDashboardView tourId="t1" />);
      expect(screen.getAllByRole("status", { name: "Actualizando reserva" })).toHaveLength(2);

      // 3. Llegaron los datos nuevos.
      dashboardQuery.mockReturnValue(
        loaded({ isFetching: false, dataUpdatedAt: Date.now() + 5000 }),
      );
      view.rerender(<TourDashboardView tourId="t1" />);
      expect(screen.queryByRole("status", { name: "Actualizando reserva" })).toBeNull();
      expect(screen.getAllByText("Ana Torres").length).toBeGreaterThan(0);
    },
  );

  it("si la recarga falla, vuelve a mostrar los datos en caché", async () => {
    patch.mockResolvedValue({});
    const view = render(<TourDashboardView tourId="t1" />, { wrapper });
    dashboardQuery.mockReturnValue(loaded({ isFetching: true }));
    const { result } = renderHook(() => useCancelFullBooking(), { wrapper });
    await act(async () => result.current.mutate({ bookingId: ANA_BOOKING, penaltyAmount: 0 }));
    view.rerender(<TourDashboardView tourId="t1" />);
    expect(screen.getAllByRole("status", { name: "Actualizando reserva" })).toHaveLength(2);

    dashboardQuery.mockReturnValue(loaded({ isFetching: false }));
    view.rerender(<TourDashboardView tourId="t1" />);
    expect(screen.queryByRole("status", { name: "Actualizando reserva" })).toBeNull();
    expect(screen.getAllByText("Ana Torres").length).toBeGreaterThan(0);
  });
});
