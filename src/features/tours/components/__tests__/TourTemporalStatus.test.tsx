import { act, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TourDesktopTable } from "../TourDesktopTable";
import { useTourFilters } from "../../hooks/useTourFilters";
import type { TourOutput } from "../../schemas/tour.schema";

// La API manda "EN CURSO" con espacio (regla 9). Antes el front comparaba con "EN_CURSO" y un
// tour que salía hoy aparecía como "Próximo".
const tour = (id: string, title: string, temporalStatus: TourOutput["temporalStatus"]) =>
  ({
    id,
    title,
    temporalStatus,
    isActive: true,
    currency: "MXN",
    price: 1200,
    departureDateTime: "2026-11-14",
    destinationType: "NATIONAL",
    boardingPoints: [],
    maxCapacity: 20,
    sellableCapacity: 19,
    currentOccupancy: 7,
  }) as unknown as TourOutput;

const tours = [
  tour("t1", "Zacatlán de las manzanas", "EN CURSO"),
  tour("t2", "Cascadas de Cuetzalan", "PRÓXIMO"),
  tour("t3", "Huasteca Potosina", "FINALIZADO"),
];

describe("Estado temporal del tour en /tours", () => {
  it("la tabla muestra En Curso, Próximo y Finalizado según la API", () => {
    render(<TourDesktopTable tours={tours} onDeleteRequest={() => {}} />);

    expect(screen.getByText("En Curso")).toBeInTheDocument();
    expect(screen.getByText("Próximo")).toBeInTheDocument();
    expect(screen.getByText("Finalizado")).toBeInTheDocument();
  });

  it("los contadores y el filtro 'En curso' reconocen 'EN CURSO'", () => {
    const { result } = renderHook(() => useTourFilters(tours));

    expect(result.current.counts).toEqual({
      all: 3,
      upcoming: 1,
      inProgress: 1,
      completed: 1,
      cancelled: 0,
    });

    act(() => result.current.setStatusFilter("IN_PROGRESS"));
    expect(result.current.filteredTours.map((t) => t.title)).toEqual(["Zacatlán de las manzanas"]);
  });
});
