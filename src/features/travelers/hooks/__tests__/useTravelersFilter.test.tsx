import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TravelerTableRow } from "../../components/TravelersTable";
import { useTravelersFilter } from "../useTravelersFilter";

// El directorio de viajeros filtra en el cliente: búsqueda por nombre, WhatsApp o correo, y
// categoría por tipo de viaje (los flags los calcula la API).

const traveler = (overrides: Partial<TravelerTableRow>): TravelerTableRow =>
  ({
    id: crypto.randomUUID(),
    fullName: "Viajero",
    whatsappPhone: undefined,
    email: "viajero@correo.mx",
    hasNationalTrips: false,
    hasInternationalTrips: false,
    ...overrides,
  }) as TravelerTableRow;

const TRAVELERS = [
  traveler({
    fullName: "Ana Torres",
    whatsappPhone: "2281234567",
    email: "ana@correo.mx",
    hasNationalTrips: true,
  }),
  traveler({ fullName: "Luis Pérez", email: "LUIS@Agencia.mx", hasInternationalTrips: true }),
  traveler({
    fullName: "Eva Ruiz",
    whatsappPhone: "2289990000",
    hasNationalTrips: true,
    hasInternationalTrips: true,
  }),
  traveler({ fullName: "Menor Sin Datos", email: undefined }),
];

const names = (list: TravelerTableRow[]) => list.map((t) => t.fullName);

describe("useTravelersFilter", () => {
  it("busca por nombre, WhatsApp o correo (sin distinguir mayúsculas)", () => {
    const { result } = renderHook(() => useTravelersFilter(TRAVELERS));

    act(() => result.current.setSearchQuery("ana"));
    expect(names(result.current.filteredTravelers)).toEqual(["Ana Torres"]);

    act(() => result.current.setSearchQuery("999"));
    expect(names(result.current.filteredTravelers)).toEqual(["Eva Ruiz"]);

    act(() => result.current.setSearchQuery("luis@agencia"));
    expect(names(result.current.filteredTravelers)).toEqual(["Luis Pérez"]);
  });

  it("tolera viajeros sin WhatsApp ni correo (menores)", () => {
    const { result } = renderHook(() => useTravelersFilter(TRAVELERS));
    act(() => result.current.setSearchQuery("menor"));
    expect(names(result.current.filteredTravelers)).toEqual(["Menor Sin Datos"]);
  });

  it("filtra por viajes nacionales o internacionales", () => {
    const { result } = renderHook(() => useTravelersFilter(TRAVELERS));

    act(() => result.current.setActiveFilter("national"));
    expect(names(result.current.filteredTravelers)).toEqual(["Ana Torres", "Eva Ruiz"]);

    act(() => result.current.setActiveFilter("international"));
    expect(names(result.current.filteredTravelers)).toEqual(["Luis Pérez", "Eva Ruiz"]);
  });

  it("combina búsqueda y categoría, y los contadores no cambian", () => {
    const { result } = renderHook(() => useTravelersFilter(TRAVELERS));
    act(() => {
      result.current.setActiveFilter("international");
      result.current.setSearchQuery("eva");
    });
    expect(names(result.current.filteredTravelers)).toEqual(["Eva Ruiz"]);
    expect(result.current.counts).toEqual({ all: 4, national: 2, international: 2 });
  });

  it("sin datos devuelve listas vacías", () => {
    const { result } = renderHook(() => useTravelersFilter());
    expect(result.current.filteredTravelers).toEqual([]);
    expect(result.current.counts).toEqual({ all: 0, national: 0, international: 0 });
  });
});
