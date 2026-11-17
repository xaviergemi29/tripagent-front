import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrochureAvailability } from "../BrochureAvailability";

const availability = (occupiedSeats: number, sellableCapacity = 19, overrides = {}) => ({
  sellableCapacity,
  occupiedSeats,
  availableSeats: sellableCapacity - occupiedSeats,
  isBookable: sellableCapacity - occupiedSeats > 0,
  hasDeparted: false,
  ...overrides,
});

const level = () => screen.getByRole("region", { name: "Disponibilidad de lugares" }).dataset.level;
const barWidth = () =>
  (screen.getByRole("progressbar").firstElementChild as HTMLElement).style.width;

describe("Disponibilidad del folleto", () => {
  it("sin reservas: salida abierta, verde y barra en 0%", () => {
    render(<BrochureAvailability availability={availability(0)} />);

    expect(level()).toBe("ALL_AVAILABLE");
    expect(screen.getByText("19 lugares disponibles")).toBeInTheDocument();
    expect(screen.getByText("¡Salida abierta!")).toBeInTheDocument();
    expect(screen.getByText(/Sé de los primeros en apartar/)).toBeInTheDocument();
    expect(screen.getByText("100% disponible")).toBeInTheDocument();
    expect(barWidth()).toBe("0%");
  });

  it("a mitad de capacidad: índigo, mitad reservado y prueba social", () => {
    render(<BrochureAvailability availability={availability(9)} />);

    expect(level()).toBe("HALF_AVAILABLE");
    expect(screen.getByText("Quedan 10 lugares")).toBeInTheDocument();
    expect(screen.getByText("Mitad reservado")).toBeInTheDocument();
    expect(screen.getByText("9 personas ya apartaron su lugar en este viaje.")).toBeInTheDocument();
    expect(screen.getByText("9 de 19 lugares reservados")).toBeInTheDocument();
    expect(barWidth()).toBe("47%");
  });

  it("pocas reservas: no dice 'Mitad reservado' y usa singular", () => {
    render(<BrochureAvailability availability={availability(1)} />);

    expect(level()).toBe("HALF_AVAILABLE");
    expect(screen.getByText("Lugares disponibles")).toBeInTheDocument();
    expect(screen.getByText("1 persona ya apartó su lugar en este viaje.")).toBeInTheDocument();
  });

  it("pocos lugares: ámbar con urgencia amable", () => {
    render(<BrochureAvailability availability={availability(14)} />);

    expect(level()).toBe("LOW_AVAILABILITY");
    expect(screen.getByText("¡Solo quedan 5 lugares!")).toBeInTheDocument();
    expect(screen.getByText("Quedan pocos lugares")).toBeInTheDocument();
    expect(screen.getByText("26% disponible")).toBeInTheDocument();
    expect(barWidth()).toBe("74%");
  });

  it("un solo lugar: singular", () => {
    render(<BrochureAvailability availability={availability(18)} />);

    expect(screen.getByText("¡Solo queda 1 lugar!")).toBeInTheDocument();
  });

  it("sin lugares: cupo lleno", () => {
    render(<BrochureAvailability availability={availability(19)} />);

    expect(level()).toBe("SOLD_OUT");
    expect(screen.getByText("¡Lugares agotados!")).toBeInTheDocument();
    expect(screen.getByText("Cupo lleno")).toBeInTheDocument();
    expect(screen.getByText("0% disponible")).toBeInTheDocument();
    expect(barWidth()).toBe("100%");
  });

  it("sobreventa: no muestra porcentajes fuera de rango", () => {
    render(
      <BrochureAvailability
        availability={availability(21, 19, { availableSeats: -2, isBookable: false })}
      />,
    );

    expect(level()).toBe("SOLD_OUT");
    expect(screen.getByText("0% disponible")).toBeInTheDocument();
    expect(barWidth()).toBe("100%");
  });

  it("tour que ya salió: Viaje finalizado, sin urgencia de lugares", () => {
    render(
      <BrochureAvailability
        availability={availability(7, 18, { isBookable: false, hasDeparted: true })}
      />,
    );

    expect(screen.getByText("Viaje finalizado")).toBeInTheDocument();
    expect(screen.queryByText("Quedan 11 lugares")).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
