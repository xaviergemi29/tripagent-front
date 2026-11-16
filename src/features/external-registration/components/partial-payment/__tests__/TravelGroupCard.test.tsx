import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TravelGroupCard } from "../TravelGroupCard";

describe("TravelGroupCard: hora de abordaje en 12 h", () => {
  it("muestra el punto configurado con AM o PM", () => {
    render(
      <TravelGroupCard
        passengers={[
          {
            name: "Ana Torres",
            type: "Titular",
            boardingPoint: "Autozone 1 Xalapa (06:00)",
            boardingPointDetails: { location: "Autozone 1 Xalapa", time: "06:00" },
          },
          {
            name: "Luis Torres",
            type: "Acompañante",
            boardingPoint: "Plaza Américas (15:30)",
            boardingPointDetails: { location: "Plaza Américas", time: "15:30" },
          },
        ]}
      />,
    );

    expect(screen.getByText("Autozone 1 Xalapa • Salida: 06:00 AM")).toBeInTheDocument();
    expect(screen.getByText("Plaza Américas • Salida: 03:30 PM")).toBeInTheDocument();
  });

  it("sin punto reconocible: por coordinar (nunca un identificador)", () => {
    render(
      <TravelGroupCard
        passengers={[
          {
            name: "Ana Torres",
            type: "Titular",
            boardingPoint: "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
            boardingPointDetails: null,
          },
        ]}
      />,
    );

    expect(screen.getByText("Punto de abordaje: Por coordinar")).toBeInTheDocument();
  });
});
