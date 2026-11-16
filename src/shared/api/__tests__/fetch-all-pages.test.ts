import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
vi.mock("@/lib/api-client", () => ({ apiClient: { get: (...args: unknown[]) => get(...args) } }));

import { API_PAGE_SIZE, fetchAllPages, MAX_PAGES } from "../fetch-all-pages";

const rows = (from: number, count: number) =>
  Array.from({ length: count }, (_, i) => ({ id: `id-${from + i}` }));

beforeEach(() => get.mockReset());

describe("fetchAllPages", () => {
  it("con más de 100 registros pide las páginas siguientes hasta una incompleta", async () => {
    get
      .mockResolvedValueOnce(rows(0, API_PAGE_SIZE))
      .mockResolvedValueOnce(rows(100, API_PAGE_SIZE))
      .mockResolvedValueOnce(rows(200, 5));

    const result = await fetchAllPages("/travelers");

    expect(result).toHaveLength(205);
    expect(get).toHaveBeenCalledTimes(3);
    expect(get).toHaveBeenNthCalledWith(1, "/travelers", { params: { limit: 100, offset: 0 } });
    expect(get).toHaveBeenNthCalledWith(3, "/travelers", { params: { limit: 100, offset: 200 } });
  });

  it("con 100 exactos hace una petición más que llega vacía", async () => {
    get.mockResolvedValueOnce(rows(0, API_PAGE_SIZE)).mockResolvedValueOnce([]);

    expect(await fetchAllPages("/tours")).toHaveLength(100);
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("conserva la búsqueda y descarta duplicados entre páginas", async () => {
    get
      .mockResolvedValueOnce(rows(0, API_PAGE_SIZE))
      .mockResolvedValueOnce([{ id: "id-99" }, { id: "id-100" }]);

    const result = await fetchAllPages("/tours", { search: "zaca" });

    expect(result.map((r) => r.id)).toHaveLength(101);
    expect(get).toHaveBeenNthCalledWith(2, "/tours", {
      params: { search: "zaca", limit: 100, offset: 100 },
    });
  });

  it("se detiene en el tope de seguridad", async () => {
    let n = 0;
    get.mockImplementation(async () => rows(n++ * API_PAGE_SIZE, API_PAGE_SIZE));

    const result = await fetchAllPages("/travelers");

    expect(get).toHaveBeenCalledTimes(MAX_PAGES);
    expect(result).toHaveLength(MAX_PAGES * API_PAGE_SIZE);
  });
});
