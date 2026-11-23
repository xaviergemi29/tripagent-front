import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PASSENGERS } from "../../../utils/__tests__/lodging.fixtures";
import { UnassignedSidebar } from "../UnassignedSidebar";

const FREE_BEDS = [{ roomId: "r2", slotIndex: 2, label: "Doble Individual #1 · Cama B" }];

function setup(overrides: Partial<React.ComponentProps<typeof UnassignedSidebar>> = {}) {
  const onAssign = vi.fn();
  const onAssignCouple = vi.fn();
  render(
    <UnassignedSidebar
      hotelName="Hotel Sierra"
      stayLabel="14 nov – 16 nov (2 noches)"
      passengers={PASSENGERS}
      freeBeds={FREE_BEDS}
      hasEmptyMatrimonial
      onAssign={onAssign}
      onAssignCouple={onAssignCouple}
      {...overrides}
    />,
  );
  return { onAssign, onAssignCouple };
}

describe("UnassignedSidebar", () => {
  it("agrupa a la familia y deja al resto como individuales", () => {
    setup();
    expect(screen.getByText("Grupo · Familia Pérez")).toBeInTheDocument();
    expect(screen.getByText("Viajeros individuales")).toBeInTheDocument();
    expect(screen.getByLabelText("3 sin habitación")).toBeInTheDocument();
    expect(screen.getByText("Asiento 4A")).toBeInTheDocument();
    expect(screen.getByText("Datos del Establecimiento")).toBeInTheDocument();
    expect(screen.getByText("14 nov – 16 nov (2 noches)")).toBeInTheDocument();
  });

  it("asigna a la pareja a la Matrimonial en una sola acción", async () => {
    const { onAssignCouple } = setup();
    await userEvent.click(
      screen.getByRole("button", { name: "Asignar pareja juntos a Matrimonial" }),
    );
    expect(onAssignCouple).toHaveBeenCalledWith(["p1", "p2"]);
  });

  it("sin Matrimonial vacía no ofrece la acción de pareja", () => {
    setup({ hasEmptyMatrimonial: false });
    expect(
      screen.queryByRole("button", { name: "Asignar pareja juntos a Matrimonial" }),
    ).not.toBeInTheDocument();
  });

  it("asigna desde la lista de camas libres", async () => {
    const { onAssign } = setup();
    await userEvent.click(screen.getByRole("button", { name: "Asignar a Marta Ruiz" }));
    await userEvent.click(screen.getByRole("button", { name: "Doble Individual #1 · Cama B" }));
    expect(onAssign).toHaveBeenCalledWith(FREE_BEDS[0], "p3");
  });

  it("busca por nombre o grupo sin acentos", async () => {
    setup();
    const input = screen.getByLabelText("Buscar pasajero o grupo");
    await userEvent.type(input, "perez");
    const list = screen.getByRole("region", { name: "Pasajeros sin habitación" });
    expect(within(list).getByText("Ana Pérez")).toBeInTheDocument();
    expect(within(list).queryByText("Marta Ruiz")).not.toBeInTheDocument();
    await userEvent.clear(input);
    await userEvent.type(input, "zzz");
    expect(screen.getByText("Sin coincidencias.")).toBeInTheDocument();
  });

  it("en solo consulta no muestra acciones de asignar", () => {
    setup({ onAssign: undefined, onAssignCouple: undefined });
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("sin pasajeros pendientes lo indica", () => {
    setup({ passengers: [] });
    expect(screen.getByText(/Todos los pasajeros tienen cama/)).toBeInTheDocument();
  });
});
