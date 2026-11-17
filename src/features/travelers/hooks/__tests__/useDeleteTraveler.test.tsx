import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { useDeleteTraveler } from "../useTravelers";
import { TRAVELER_KEYS } from "@/shared/api/query-keys";

const remove = vi.fn<(url: string) => Promise<object>>(async () => ({}));
vi.mock("@/lib/api-client", () => ({
  apiClient: { delete: (url: string) => remove(url) },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("useDeleteTraveler", () => {
  it("con el historial y el detalle en caché, elimina y solo filtra las listas", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(TRAVELER_KEYS.lists(undefined), [{ id: "a" }, { id: "b" }]);
    const history = { id: "a", history: [] };
    queryClient.setQueryData(TRAVELER_KEYS.history("a"), history);
    queryClient.setQueryData(TRAVELER_KEYS.detail("a"), { id: "a" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useDeleteTraveler(), { wrapper });
    result.current.mutate("b");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(remove).toHaveBeenCalledWith("/travelers/b");
    expect(queryClient.getQueryData(TRAVELER_KEYS.history("a"))).toBe(history);
    // Borrado lógico: aviso genérico, sin prometer un borrado permanente.
    expect(toast.success).toHaveBeenCalledWith("Se ha eliminado el viajero");
  });
});
