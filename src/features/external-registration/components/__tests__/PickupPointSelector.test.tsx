import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PickupPointSelector } from "../PickupPointSelector";

// La hora de abordaje se muestra en AM/PM, igual que el folleto y el estado de cuenta (2026-11-16).

describe("PickupPointSelector", () => {
  it("muestra cada hora en formato de 12 horas", () => {
    render(
      <PickupPointSelector
        points={[
          { id: "a", name: "Plaza Américas", reference: "Punto de abordaje", time: "18:30" },
          { id: "b", name: "Centro", reference: "Punto de abordaje", time: "06:00" },
        ]}
        value=""
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("06:30 PM")).toBeInTheDocument();
    expect(screen.getByText("06:00 AM")).toBeInTheDocument();
    expect(screen.queryByText("18:30")).not.toBeInTheDocument();
  });
});
