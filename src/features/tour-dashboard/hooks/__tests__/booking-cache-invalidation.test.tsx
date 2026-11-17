import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCancelFullBooking, useQuickReservation } from "../useBookingActions";
import { useCreatePayment, useVoidPayment } from "../usePayments";
import {
  useAddPassengerToBooking,
  useQuickRemovePassenger,
  useRemovePendingSlot,
  useTransferPassenger,
} from "../useTourDashboard";
import { useUpdateTraveler } from "@/features/travelers/hooks/useTravelers";
import {
  TOUR_DASHBOARD_KEYS,
  TOUR_KEYS,
  TOUR_SEAT_KEYS,
  TRAVELER_KEYS,
} from "@/shared/api/query-keys";

// Una mutación de reserva debe refrescar todo lo que muestra ese dato (2026-11-16): antes solo el
// Centro de Control, y el listado de /tours, el croquis y Viajeros quedaban viejos hasta 5 min.

const TOUR_ID = "tour-1";

vi.mock("@/lib/api-client", () => {
  const ok = vi.fn(async () => ({
    id: "trav-1",
    tourId: "tour-1",
    transferredPassenger: { role: "COMPANION" },
  }));
  return { apiClient: { post: ok, patch: ok, delete: ok } };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function setup<T>(useHook: () => T) {
  const queryClient = new QueryClient();
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(useHook, { wrapper });
  const keys = () => invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { result, keys };
}

type AnyMutation = {
  mutate: (variables: never) => void;
  isSuccess: boolean;
};

const cases: [string, () => AnyMutation, unknown, boolean][] = [
  ["apartado rápido", useQuickReservation, { tourId: TOUR_ID, fullName: "Ana" }, true],
  ["cancelar reserva", useCancelFullBooking, { bookingId: "b1", penaltyAmount: 0 }, false],
  ["agregar lugar", useAddPassengerToBooking, { bookingId: "b1", tourId: TOUR_ID }, true],
  ["liberar lugar", useRemovePendingSlot, { bookingId: "b1" }, false],
  ["dar de baja", useQuickRemovePassenger, { bookingId: "b1", passengerId: "p1" }, false],
  ["transferir", useTransferPassenger, { bookingId: "b1", data: {} }, true],
  [
    "abono",
    () => useCreatePayment(TOUR_ID),
    { bookingId: "b1", payload: { type: "PAYMENT" } },
    true,
  ],
  [
    "anular abono",
    () => useVoidPayment(TOUR_ID),
    { bookingId: "b1", paymentId: "x", data: {} },
    true,
  ],
];

describe("caché tras una mutación de reserva", () => {
  it.each(cases)(
    "%s: Centro de Control, listado de tours, croquis y Viajeros",
    async (_, useHook, variables, knowsTour) => {
      const { result, keys } = setup(useHook as () => AnyMutation);
      result.current.mutate(variables as never);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(keys()).toContainEqual(
        knowsTour ? TOUR_DASHBOARD_KEYS.detail(TOUR_ID) : TOUR_DASHBOARD_KEYS.all,
      );
      // `TOUR_KEYS.all` cubre el listado, el detalle y el croquis (cuelga de ["tours"]).
      expect(keys()).toContainEqual(TOUR_KEYS.all);
      expect(TOUR_SEAT_KEYS.byTour(TOUR_ID)[0]).toBe(TOUR_KEYS.all[0]);
      expect(keys()).toContainEqual(TRAVELER_KEYS.all);
    },
  );

  it("editar un viajero refresca el Centro de Control (nombre, notas médicas, contacto)", async () => {
    const { result, keys } = setup(useUpdateTraveler);
    result.current.mutate({ travelerId: "trav-1", travelerData: {} as never });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(keys()).toContainEqual(TRAVELER_KEYS.all);
    expect(keys()).toContainEqual(TOUR_DASHBOARD_KEYS.all);
  });
});
