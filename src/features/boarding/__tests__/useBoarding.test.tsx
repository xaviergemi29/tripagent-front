import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BOARDING_KEYS } from "@/shared/api/query-keys";
import { useSetStaffBoarding, useSetTourBoarding } from "../hooks/useBoarding";
import type { StaffBoardingOutput, TourBoardingOutput } from "../schemas/boarding.schema";

const patch = vi.fn();
vi.mock("@/lib/api-client", () => ({
  apiClient: { patch: (...args: unknown[]) => patch(...args), get: vi.fn() },
}));
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { error: (...args: unknown[]) => toastError(...args), success: vi.fn() },
}));

const passenger = {
  fullName: "Ana Torres",
  holderName: "Ana Torres",
  isTitular: true,
  passengerType: "ADULT" as const,
  seatLabel: null,
  boardingPointCode: null,
  rooms: [],
  boardedAt: null,
  isMinor: false,
};

const setup = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
};

beforeEach(() => {
  patch.mockReset();
  toastError.mockReset();
});

describe("useBoarding (marcas optimistas)", () => {
  it("panel: marca al instante y toma la hora del servidor", async () => {
    const { queryClient, wrapper } = setup();
    const data: TourBoardingOutput = {
      canMarkBoarding: true,
      hasMinors: false,
      temporalStatus: "EN CURSO",
      boardingPoints: [],
      passengers: [{ ...passenger, travelerId: "t-1" }],
    };
    queryClient.setQueryData(BOARDING_KEYS.byTour("tour-1"), data);
    let resolve!: (value: unknown) => void;
    patch.mockImplementation(() => new Promise((r) => (resolve = r)));

    const { result } = renderHook(() => useSetTourBoarding("tour-1"), { wrapper });
    act(() => result.current.mutate({ id: "t-1", boarded: true }));

    await waitFor(() =>
      expect(
        queryClient.getQueryData<TourBoardingOutput>(BOARDING_KEYS.byTour("tour-1"))!.passengers[0]!
          .boardedAt,
      ).not.toBeNull(),
    );
    expect(patch).toHaveBeenCalledWith("/tours/tour-1/passengers/t-1/boarding", { boarded: true });

    await act(async () => resolve({ travelerId: "t-1", boardedAt: "2026-11-23T12:30:00.000Z" }));
    await waitFor(() =>
      expect(
        queryClient.getQueryData<TourBoardingOutput>(BOARDING_KEYS.byTour("tour-1"))!.passengers[0]!
          .boardedAt,
      ).toBe("2026-11-23T12:30:00.000Z"),
    );
  });

  it("enlace: si la API falla, revierte la marca y avisa", async () => {
    const { queryClient, wrapper } = setup();
    const data: StaffBoardingOutput = {
      canMarkBoarding: true,
      hasMinors: false,
      temporalStatus: "EN CURSO",
      boardingPoints: [],
      passengers: [{ ...passenger, boardingKey: "clave-opaca-1234567890" }],
    };
    queryClient.setQueryData(BOARDING_KEYS.byStaffToken("tok"), data);
    patch.mockRejectedValue({ status: 409, message: "El tour ya finalizó" });

    const { result } = renderHook(() => useSetStaffBoarding("tok"), { wrapper });
    act(() => result.current.mutate({ id: "clave-opaca-1234567890", boarded: true }));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(patch).toHaveBeenCalledWith("/public/staff-share/tok/boarding/clave-opaca-1234567890", {
      boarded: true,
    });
    expect(
      queryClient.getQueryData<StaffBoardingOutput>(BOARDING_KEYS.byStaffToken("tok"))!
        .passengers[0]!.boardedAt,
    ).toBeNull();
    expect(toastError.mock.calls[0]![1]).toEqual({ description: "El tour ya finalizó" });
  });
});
