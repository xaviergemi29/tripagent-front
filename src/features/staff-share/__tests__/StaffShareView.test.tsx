import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { StaffShareView } from "../components/StaffShareView";
import { staffShareOutputSchema } from "../schemas/staff-share.schema";
import { buildPayload } from "./staff-share.fixtures";

const renderView = (overrides: Record<string, unknown> = {}) =>
  render(<StaffShareView data={staffShareOutputSchema.parse(buildPayload(overrides))} />);

describe("StaffShareView", () => {
  it("dibuja el croquis con nombre corto, punto y estatus; sin teléfonos ni montos", () => {
    const { container } = renderView();

    expect(screen.getByText("Ana T.")).toBeInTheDocument();
    expect(screen.getByText("[P1]")).toBeInTheDocument();
    expect(container.querySelector('[data-seat-status="PENDING_DEPOSIT"]')).toBeInTheDocument();
    expect(container.querySelector('[data-seat-status="CONFIRMED"]')).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Leyenda del croquis" })).toHaveTextContent(
      "Pendiente de anticipo",
    );
    expect(container.textContent).not.toMatch(/2281234567|4321|\$/);
  });

  it("la lista muestra tipo, punto, hora, titular y 'Sin asiento asignado' al final", async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getByRole("tab", { name: "Lista" }));

    const items = screen
      .getAllByRole("listitem")
      .filter((el) => el.className.includes("rounded-2xl"));
    expect(items[0]).toHaveTextContent("Ana Torres Ruiz");
    expect(items[0]).toHaveTextContent("Titular");
    expect(items[0]).toHaveTextContent("Adulto");
    expect(items[0]).toHaveTextContent("06:00 AM");
    expect(items[0]).toHaveTextContent("Confirmado");
    expect(items[1]).toHaveTextContent("Niño");
    expect(items[1]).toHaveTextContent("Pendiente de anticipo");
    expect(screen.getByText(/Sin asiento asignado \(1\)/)).toBeInTheDocument();
    expect(screen.getByText("Marta Gómez")).toBeInTheDocument();
  });

  it("filtra por punto y por nombre", async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getByRole("tab", { name: "Lista" }));

    const filterGroup = screen.getByRole("group", { name: "Filtrar por punto de abordaje" });
    await user.click(within(filterGroup).getByRole("button", { name: "P2" }));
    expect(screen.getByText("Luis Pérez Soto")).toBeInTheDocument();
    expect(screen.queryByText("Ana Torres Ruiz")).not.toBeInTheDocument();

    await user.click(within(filterGroup).getByRole("button", { name: "Todos" }));
    await user.type(screen.getByLabelText("Buscar pasajero por nombre"), "marta");
    expect(screen.getByText("Marta Gómez")).toBeInTheDocument();
    expect(screen.queryByText("Luis Pérez Soto")).not.toBeInTheDocument();
  });

  it("sin vehículo avisa y muestra solo la lista", () => {
    renderView({ vehicle: null });
    expect(screen.getByRole("note")).toHaveTextContent(/sin vehículo|no tiene vehículo/i);
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.getByText("Ana Torres Ruiz")).toBeInTheDocument();
  });
});
