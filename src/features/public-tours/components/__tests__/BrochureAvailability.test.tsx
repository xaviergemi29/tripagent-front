import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrochureAvailability } from "../BrochureAvailability";

const availability = (overrides = {}) => ({
  sellableCapacity: 18,
  occupiedSeats: 7,
  availableSeats: 11,
  isBookable: true,
  hasDeparted: false,
  ...overrides,
});

describe("Disponibilidad del folleto", () => {
  it("tour próximo con lugares: muestra los lugares restantes", () => {
    render(<BrochureAvailability availability={availability()} />);

    expect(screen.getByText("Quedan 11 lugares")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("sin lugares: Cupo agotado", () => {
    render(
      <BrochureAvailability
        availability={availability({ occupiedSeats: 18, availableSeats: 0, isBookable: false })}
      />,
    );

    expect(screen.getByText("Cupo agotado")).toBeInTheDocument();
  });

  it("tour que ya salió: Viaje finalizado, sin urgencia de lugares", () => {
    render(
      <BrochureAvailability
        availability={availability({ isBookable: false, hasDeparted: true })}
      />,
    );

    expect(screen.getByText("Viaje finalizado")).toBeInTheDocument();
    expect(screen.queryByText("Quedan 11 lugares")).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
