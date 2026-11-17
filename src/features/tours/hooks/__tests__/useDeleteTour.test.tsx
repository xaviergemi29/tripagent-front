import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDeleteTour } from "../useTours";
import { TOUR_KEYS, TOUR_SEAT_KEYS } from "@/shared/api/query-keys";

let rejectDelete = false;
let resolveDelete: () => void = () => {};
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    delete: () =>
      new Promise((resolve, reject) => {
        resolveDelete = () => (rejectDelete ? reject(new Error("409")) : resolve({}));
      }),
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function setup() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(TOUR_KEYS.lists(undefined), [{ id: "t1" }, { id: "t2" }]);
  const seats = [{ seatLabel: "7" }];
  queryClient.setQueryData(TOUR_SEAT_KEYS.byTour("t1"), seats);
  queryClient.setQueryData(TOUR_KEYS.detail("t1"), { id: "t1" });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useDeleteTour(), { wrapper });
  return { queryClient, result, seats };
}

describe("useDeleteTour (actualización optimista)", () => {
  it("quita la fila del listado de inmediato sin tocar el detalle ni los asientos", async () => {
    rejectDelete = false;
    const { queryClient, result, seats } = setup();
    result.current.mutate("t1");

    await waitFor(() =>
      expect(queryClient.getQueryData(TOUR_KEYS.lists(undefined))).toEqual([{ id: "t2" }]),
    );
    expect(queryClient.getQueryData(TOUR_SEAT_KEYS.byTour("t1"))).toBe(seats);
    expect(queryClient.getQueryData(TOUR_KEYS.detail("t1"))).toEqual({ id: "t1" });
    resolveDelete();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("si la API rechaza (409), la fila vuelve", async () => {
    rejectDelete = true;
    const { queryClient, result } = setup();
    result.current.mutate("t1");
    await waitFor(() =>
      expect(queryClient.getQueryData(TOUR_KEYS.lists(undefined))).toEqual([{ id: "t2" }]),
    );
    resolveDelete();
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(TOUR_KEYS.lists(undefined))).toEqual([
      { id: "t1" },
      { id: "t2" },
    ]);
  });
});
