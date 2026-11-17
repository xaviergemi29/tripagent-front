import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useIsSavingSeat, useUpdateSeat, type SeatInfo } from "../useTourSeats";
import { TOUR_SEAT_KEYS } from "@/shared/api/query-keys";

// Asignar un asiento se ve al instante (con el nombre real y "guardando") y la lista de
// "Faltan por acomodar" lo refleja sin esperar la recarga del dashboard (2026-11-17).

let resolvePatch: () => void = () => {};
const patch = vi.fn(
  () =>
    new Promise<void>((resolve) => {
      resolvePatch = resolve;
    }),
);
vi.mock("@/lib/api-client", () => ({
  apiClient: { patch: (...a: unknown[]) => patch(...(a as [])) },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("useUpdateSeat", () => {
  it("pinta el asiento con el nombre real, lo marca como guardando y no envía el nombre a la API", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<SeatInfo[]>(TOUR_SEAT_KEYS.byTour("t1"), []);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(
      () => ({ update: useUpdateSeat("t1"), saving: useIsSavingSeat("t1") }),
      { wrapper },
    );

    act(() =>
      result.current.update.mutate({
        seatLabel: "7",
        status: "ASSIGNED",
        passengerId: "p1",
        passengerName: "Ana Torres",
      }),
    );

    await waitFor(() =>
      expect(queryClient.getQueryData(TOUR_SEAT_KEYS.byTour("t1"))).toEqual([
        {
          seatLabel: "7",
          status: "ASSIGNED",
          passenger: { id: "p1", fullName: "Ana Torres" },
          isPending: true,
        },
      ]),
    );
    expect(result.current.saving).toBe(true);
    expect(patch).toHaveBeenCalledWith("/seats/t1/seats/7", {
      seatLabel: "7",
      status: "ASSIGNED",
      passengerId: "p1",
    });

    act(() => resolvePatch());
    await waitFor(() => expect(result.current.saving).toBe(false));
  });
});
