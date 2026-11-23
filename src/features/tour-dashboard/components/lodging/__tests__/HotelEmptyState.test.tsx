import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HotelEmptyState } from "../HotelEmptyState";

describe("HotelEmptyState", () => {
  it("sin pasajeros: copy genérico y sin píldora", () => {
    render(<HotelEmptyState unassignedPassengersCount={0} onAddHotelClick={vi.fn()} />);
    expect(
      screen.getByRole("heading", { name: "Aún no hay hospedaje configurado para este tour" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/cuando se registren/)).toBeInTheDocument();
    expect(screen.queryByText(/sin cuarto/)).not.toBeInTheDocument();
  });

  it("con pasajeros: descripción, píldora y desglose sugerido", () => {
    render(<HotelEmptyState unassignedPassengersCount={5} onAddHotelClick={vi.fn()} />);
    expect(screen.getByText("5 pasajeros registrados")).toBeInTheDocument();
    expect(screen.getByText("5 pasajeros sin cuarto")).toBeInTheDocument();
    expect(
      screen.getByText(/Sugerido: 0 Matrimoniales y 3 Dobles Individuales/),
    ).toBeInTheDocument();
  });

  it("respeta un desglose recibido por props", () => {
    render(
      <HotelEmptyState
        unassignedPassengersCount={4}
        suggestedBreakdown={{ matrimoniales: 1, doblesIndividuales: 1 }}
        onAddHotelClick={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/Sugerido: 1 Matrimoniales y 1 Dobles Individuales/),
    ).toBeInTheDocument();
  });

  it("el botón dispara el callback", async () => {
    const onAdd = vi.fn();
    render(<HotelEmptyState unassignedPassengersCount={0} onAddHotelClick={onAdd} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Agregar primer hotel y habitaciones" }),
    );
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it("sin callback no hay botón", () => {
    render(<HotelEmptyState unassignedPassengersCount={2} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
