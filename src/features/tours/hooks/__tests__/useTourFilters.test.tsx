import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TOUR_TEMPORAL_STATUS } from "@/shared/constants/domain.constants";
import type { TourOutput } from "../../schemas/tour.schema";
import { useTourFilters } from "../useTourFilters";

// El listado de /tours pide todas las páginas (`fetchAllPages`) y filtra en el cliente. Los estados vienen de la API (`temporalStatus`, regla 9) y se comparan con
// TOUR_TEMPORAL_STATUS, nunca con el texto.

const tour = (overrides: Partial<TourOutput>): TourOutput =>
  ({
    id: crypto.randomUUID(),
    title: "Tour",
    currency: "MXN",
    destinationType: "NATIONAL",
    temporalStatus: TOUR_TEMPORAL_STATUS.UPCOMING,
    ...overrides,
  }) as TourOutput;

const TOURS = [
  tour({ title: "Huasteca Potosina" }),
  tour({ title: "Zacatlán de las Manzanas", temporalStatus: TOUR_TEMPORAL_STATUS.IN_PROGRESS }),
  tour({ title: "Cascadas de Cuetzalan", temporalStatus: TOUR_TEMPORAL_STATUS.FINISHED }),
  tour({ title: "Disney Orlando", currency: "USD", destinationType: "INTERNATIONAL" }),
  tour({ title: "Nueva York Express", currency: "USD" }), // USD sin destino internacional marcado
  tour({ title: "Sin estado", temporalStatus: undefined }),
  tour({ title: "Real de Catorce", temporalStatus: TOUR_TEMPORAL_STATUS.CANCELLED }),
];

const titles = (list: TourOutput[]) => list.map((t) => t.title);

describe("useTourFilters", () => {
  it("sin filtros devuelve todos los tours", () => {
    const { result } = renderHook(() => useTourFilters(TOURS));
    expect(result.current.filteredTours).toHaveLength(TOURS.length);
  });

  it("busca por título sin distinguir mayúsculas e ignora espacios", () => {
    const { result } = renderHook(() => useTourFilters(TOURS));
    act(() => result.current.setSearchTerm("  huasteca "));
    expect(titles(result.current.filteredTours)).toEqual(["Huasteca Potosina"]);
  });

  it("busca sin distinguir acentos", () => {
    const { result } = renderHook(() => useTourFilters(TOURS));
    act(() => result.current.setSearchTerm("zacatlan"));
    expect(titles(result.current.filteredTours)).toEqual(["Zacatlán de las Manzanas"]);
  });

  it("filtra por estado temporal; sin estado cuenta como próximo", () => {
    const { result } = renderHook(() => useTourFilters(TOURS));

    act(() => result.current.setStatusFilter("IN_PROGRESS"));
    expect(titles(result.current.filteredTours)).toEqual(["Zacatlán de las Manzanas"]);

    act(() => result.current.setStatusFilter("COMPLETED"));
    expect(titles(result.current.filteredTours)).toEqual(["Cascadas de Cuetzalan"]);

    act(() => result.current.setStatusFilter("UPCOMING"));
    expect(titles(result.current.filteredTours)).toEqual([
      "Huasteca Potosina",
      "Disney Orlando",
      "Nueva York Express",
      "Sin estado",
    ]);
  });

  it("internacional = destino internacional o tour en USD", () => {
    const { result } = renderHook(() => useTourFilters(TOURS));

    act(() => result.current.setDestinationFilter("INTERNATIONAL"));
    expect(titles(result.current.filteredTours)).toEqual(["Disney Orlando", "Nueva York Express"]);

    act(() => result.current.setDestinationFilter("NATIONAL"));
    expect(titles(result.current.filteredTours)).not.toContain("Nueva York Express");
  });

  it("combina los filtros (AND)", () => {
    const { result } = renderHook(() => useTourFilters(TOURS));
    act(() => {
      result.current.setDestinationFilter("INTERNATIONAL");
      result.current.setSearchTerm("york");
    });
    expect(titles(result.current.filteredTours)).toEqual(["Nueva York Express"]);

    act(() => result.current.setStatusFilter("COMPLETED"));
    expect(result.current.filteredTours).toEqual([]);
  });

  it("los contadores no dependen de los filtros activos", () => {
    const { result } = renderHook(() => useTourFilters(TOURS));
    act(() => result.current.setSearchTerm("huasteca"));
    expect(result.current.counts).toEqual({
      all: 7,
      upcoming: 4,
      inProgress: 1,
      completed: 1,
      cancelled: 1,
    });
  });

  it("los cancelados tienen su propio filtro y no entran en finalizados", () => {
    const { result } = renderHook(() => useTourFilters(TOURS));

    act(() => result.current.setStatusFilter("CANCELLED"));
    expect(titles(result.current.filteredTours)).toEqual(["Real de Catorce"]);

    act(() => result.current.setStatusFilter("COMPLETED"));
    expect(titles(result.current.filteredTours)).not.toContain("Real de Catorce");
  });

  it("con lista vacía no falla", () => {
    const { result } = renderHook(() => useTourFilters([]));
    expect(result.current.filteredTours).toEqual([]);
    expect(result.current.counts.all).toBe(0);
  });
});
