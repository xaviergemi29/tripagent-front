import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TOUR_DASHBOARD_KEYS } from "@/features/tour-dashboard/hooks/useTourDashboard";
import { TOUR_KEYS, useUpdateTour } from "../useTours";

const TOUR_ID = "92779764-2131-4c4b-8153-398fbd74bfad";

vi.mock("@/lib/api-client", () => ({
  apiClient: { patch: vi.fn(async () => ({ id: TOUR_ID, staffCapacity: 1 })) },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("useUpdateTour", () => {
  it("al editar el tour invalida también el Centro de Control (staffCapacity, cupo, anticipo)", async () => {
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUpdateTour(), { wrapper });
    result.current.mutate({ tourId: TOUR_ID, tourData: { staffCapacity: 1 } as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const keys = invalidate.mock.calls.map(([filters]) => filters?.queryKey);
    expect(keys).toContainEqual(TOUR_DASHBOARD_KEYS.detail(TOUR_ID));
    expect(keys).toContainEqual(TOUR_KEYS.detail(TOUR_ID));
  });
});
