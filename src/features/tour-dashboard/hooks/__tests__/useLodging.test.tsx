import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import {
  useAssignLodgingRoom,
  useDeleteLodgingBed,
  useDeleteLodgingRoom,
  useRegisterLodgingRooms,
  useTourLodging,
  useUnassignLodgingSlot,
  useUpdateLodgingRoom,
} from "../useLodging";
import { LODGING_KEYS } from "@/shared/api/query-keys";
import type { LodgingOutput } from "../../schemas/lodging.schema";
import { makeLodging, makeRoom } from "../../utils/__tests__/lodging.fixtures";

const get = vi.fn(async () => ({ hotels: [], totalRooms: 0, totalCapacity: 0 }));
const patch = vi.fn(async () => ({ room: makeRoom("r1") }));
const del = vi.fn(async () => ({ room: makeRoom("r1") }));
const post = vi.fn(async () => ({
  hotel: { id: "h1", name: "Hotel Sierra", createdAt: "x", rooms: [] },
  createdRooms: 2,
  createdCapacity: 4,
}));
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: (...a: unknown[]) => get(...(a as [])),
    post: (...a: unknown[]) => post(...(a as [])),
    patch: (...a: unknown[]) => patch(...(a as [])),
    delete: (...a: unknown[]) => del(...(a as [])),
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function setup(seed?: LodgingOutput) {
  const queryClient = new QueryClient();
  if (seed) queryClient.setQueryData(LODGING_KEYS.detail("t1"), seed);
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper, invalidate, queryClient };
}

describe("hooks de hospedaje", () => {
  it("useTourLodging consulta GET /lodging/:tourId", async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useTourLodging("t1"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledWith("/lodging/t1");
  });

  it("useRegisterLodgingRooms envía POST /lodging/:tourId/rooms e invalida el hospedaje", async () => {
    const { wrapper, invalidate } = setup();
    const { result } = renderHook(() => useRegisterLodgingRooms("t1"), { wrapper });
    const body = {
      hotelName: "Hotel Sierra",
      rooms: [{ roomType: "MATRIMONIAL" as const, quantity: 2 }],
    };
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(post).toHaveBeenCalledWith("/lodging/t1/rooms", body);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: LODGING_KEYS.detail("t1") });
  });

  it("useTourLodging no consulta con enabled en falso", () => {
    get.mockClear();
    const { wrapper } = setup();
    renderHook(() => useTourLodging("t1", { enabled: false }), { wrapper });
    expect(get).not.toHaveBeenCalled();
  });

  it("useUpdateLodgingRoom hace PATCH, actualiza la caché al instante e invalida", async () => {
    const { wrapper, invalidate, queryClient } = setup(makeLodging([makeRoom("r1")]));
    const { result } = renderHook(() => useUpdateLodgingRoom("t1"), { wrapper });
    result.current.mutate({ roomId: "r1", roomNumber: " 101 " });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(patch).toHaveBeenCalledWith("/lodging/t1/rooms/r1", { roomNumber: " 101 " });
    const cached = queryClient.getQueryData<LodgingOutput>(LODGING_KEYS.detail("t1"));
    expect(cached?.hotels[0].rooms[0].roomNumber).toBe("101");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: LODGING_KEYS.detail("t1") });
  });

  it("useUpdateLodgingRoom regresa la caché anterior si la API falla", async () => {
    patch.mockRejectedValueOnce({ status: 409, message: "Número repetido" });
    const { wrapper, queryClient } = setup(makeLodging([makeRoom("r1", { roomNumber: "100" })]));
    const { result } = renderHook(() => useUpdateLodgingRoom("t1"), { wrapper });
    result.current.mutate({ roomId: "r1", roomNumber: "101" });
    await waitFor(() => expect(result.current.isError).toBe(true));
    const cached = queryClient.getQueryData<LodgingOutput>(LODGING_KEYS.detail("t1"));
    expect(cached?.hotels[0].rooms[0].roomNumber).toBe("100");
  });

  it("useAssignLodgingRoom envía las asignaciones en una llamada y ocupa las camas", async () => {
    const { wrapper, queryClient } = setup(makeLodging([makeRoom("r1")]));
    const { result } = renderHook(() => useAssignLodgingRoom("t1"), { wrapper });
    const assignments = [
      { slotIndex: 1, bookingPassengerId: "p1" },
      { slotIndex: 2, bookingPassengerId: "p2" },
    ];
    result.current.mutate({ roomId: "r1", assignments });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(post).toHaveBeenCalledWith("/lodging/t1/rooms/r1/assignments", { assignments });
    const cached = queryClient.getQueryData<LodgingOutput>(LODGING_KEYS.detail("t1"));
    expect(cached?.hotels[0].rooms[0].slots).toEqual(assignments);
  });

  it("useUnassignLodgingSlot hace DELETE de la cama y la libera en la caché", async () => {
    const room = makeRoom("r1", { slots: [{ slotIndex: 2, bookingPassengerId: "p1" }] });
    const { wrapper, queryClient } = setup(makeLodging([room]));
    const { result } = renderHook(() => useUnassignLodgingSlot("t1"), { wrapper });
    result.current.mutate({ roomId: "r1", slotIndex: 2 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(del).toHaveBeenCalledWith("/lodging/t1/rooms/r1/slots/2");
    const cached = queryClient.getQueryData<LodgingOutput>(LODGING_KEYS.detail("t1"));
    expect(cached?.hotels[0].rooms[0].slots).toEqual([]);
  });

  it("useDeleteLodgingBed hace DELETE, baja la capacidad y recorre las camas siguientes", async () => {
    del.mockResolvedValueOnce({ room: makeRoom("r1"), releasedPassenger: true } as never);
    const room = makeRoom("r1", {
      roomType: "TRIPLE",
      capacity: 3,
      slots: [
        { slotIndex: 1, bookingPassengerId: "p1" },
        { slotIndex: 2, bookingPassengerId: "p2" },
        { slotIndex: 3, bookingPassengerId: "p3" },
      ],
    });
    const { wrapper, queryClient, invalidate } = setup(makeLodging([room]));
    const { result } = renderHook(() => useDeleteLodgingBed("t1"), { wrapper });
    result.current.mutate({ roomId: "r1", slotIndex: 2 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(del).toHaveBeenCalledWith("/lodging/t1/rooms/r1/beds/2");
    const cached = queryClient.getQueryData<LodgingOutput>(LODGING_KEYS.detail("t1"));
    expect(cached?.hotels[0].rooms[0].capacity).toBe(2);
    expect(cached?.hotels[0].rooms[0].slots).toEqual([
      { slotIndex: 1, bookingPassengerId: "p1" },
      { slotIndex: 2, bookingPassengerId: "p3" },
    ]);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: LODGING_KEYS.detail("t1") });
    expect(toast.success).toHaveBeenCalledWith("Cama eliminada", expect.anything());
  });

  it("useDeleteLodgingBed regresa la caché anterior si la API falla", async () => {
    del.mockRejectedValueOnce({ status: 409, message: "Última cama" });
    const room = makeRoom("r1", { slots: [{ slotIndex: 2, bookingPassengerId: "p1" }] });
    const { wrapper, queryClient } = setup(makeLodging([room]));
    const { result } = renderHook(() => useDeleteLodgingBed("t1"), { wrapper });
    result.current.mutate({ roomId: "r1", slotIndex: 1 });
    await waitFor(() => expect(result.current.isError).toBe(true));
    const cached = queryClient.getQueryData<LodgingOutput>(LODGING_KEYS.detail("t1"));
    expect(cached?.hotels[0].rooms[0].capacity).toBe(2);
    expect(cached?.hotels[0].rooms[0].slots[0].slotIndex).toBe(2);
    expect(toast.error).toHaveBeenCalledWith("No se pudo eliminar la cama", {
      description: "Última cama",
    });
  });

  it("useDeleteLodgingRoom quita la habitación, conserva el hotel y avisa de los liberados", async () => {
    del.mockResolvedValueOnce({ deletedRoomId: "r1", releasedPassengers: 2 } as never);
    const { wrapper, queryClient } = setup(makeLodging([makeRoom("r1"), makeRoom("r2")]));
    const { result } = renderHook(() => useDeleteLodgingRoom("t1"), { wrapper });
    result.current.mutate({ roomId: "r1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(del).toHaveBeenCalledWith("/lodging/t1/rooms/r1");
    const cached = queryClient.getQueryData<LodgingOutput>(LODGING_KEYS.detail("t1"));
    expect(cached?.hotels[0].rooms.map((room) => room.id)).toEqual(["r2"]);
    expect(cached?.totalRooms).toBe(1);
    expect(toast.success).toHaveBeenCalledWith("Habitación eliminada", {
      description: '2 pasajeros regresaron a "Pasajeros sin habitación"',
    });
  });

  it("useDeleteLodgingRoom regresa la habitación si la API falla", async () => {
    del.mockRejectedValueOnce({ status: 402, message: "Solo lectura" });
    const { wrapper, queryClient } = setup(makeLodging([makeRoom("r1")]));
    const { result } = renderHook(() => useDeleteLodgingRoom("t1"), { wrapper });
    result.current.mutate({ roomId: "r1" });
    await waitFor(() => expect(result.current.isError).toBe(true));
    const cached = queryClient.getQueryData<LodgingOutput>(LODGING_KEYS.detail("t1"));
    expect(cached?.hotels[0].rooms).toHaveLength(1);
  });
});
