import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mutate = vi.fn();
let isPending = false;
vi.mock("../../../hooks/useLodging", () => ({
  useRegisterLodgingRooms: () => ({ mutate, isPending }),
}));

import { RoomRegistrationModal } from "../RoomRegistrationModal";

function setup(onClose = vi.fn()) {
  render(<RoomRegistrationModal isOpen onClose={onClose} tourId="t1" />);
  return { user: userEvent.setup(), onClose };
}

const submit = () => screen.getByRole("button", { name: /Agregar al tablero|Agregando/ });

describe("RoomRegistrationModal", () => {
  beforeEach(() => {
    mutate.mockReset();
    isPending = false;
  });

  it("abre limpio: sin nombre, contadores en 0 y botón deshabilitado", () => {
    setup();
    expect(screen.getByLabelText(/Nombre del hotel/)).toHaveValue("");
    expect(screen.getByLabelText("Habitaciones Matrimonial")).toHaveTextContent("0");
    expect(screen.getByLabelText("Habitaciones Doble Individual")).toHaveTextContent("0");
    expect(screen.getByText(/Se crearán/)).toHaveTextContent("0 habitaciones (0 lugares)");
    expect(submit()).toBeDisabled();
  });

  it("requiere nombre y al menos una habitación; el resumen se recalcula", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Agregar una habitación Matrimonial" }));
    expect(submit()).toBeDisabled();
    await user.type(screen.getByLabelText(/Nombre del hotel/), "  ");
    expect(submit()).toBeDisabled();
    await user.type(screen.getByLabelText(/Nombre del hotel/), "Hotel Sierra");
    expect(submit()).toBeEnabled();
    await user.click(
      screen.getByRole("button", { name: "Agregar una habitación Doble Individual" }),
    );
    expect(screen.getByText(/Se crearán/)).toHaveTextContent("2 habitaciones (4 lugares)");
    await user.click(screen.getByRole("button", { name: "Quitar una habitación Matrimonial" }));
    expect(screen.getByText(/Se crearán/)).toHaveTextContent("1 habitación (2 lugares)");
  });

  it("agrega y quita tipos extra", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Agregar otro tipo de habitación" }));
    await user.click(screen.getByRole("button", { name: /Cuádruple \(4 pers\.\)/ }));
    expect(screen.getByLabelText("Habitaciones Cuádruple")).toHaveTextContent("1");
    expect(screen.getByText(/Se crearán/)).toHaveTextContent("1 habitación (4 lugares)");
    await user.click(screen.getByRole("button", { name: "Quitar el tipo Cuádruple" }));
    expect(screen.queryByLabelText("Habitaciones Cuádruple")).not.toBeInTheDocument();
    expect(screen.getByText(/Se crearán/)).toHaveTextContent("0 habitaciones (0 lugares)");
  });

  it("ofrece Individual como tipo extra y lo envía", async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText(/Nombre del hotel/), "Hotel Sierra");
    await user.click(screen.getByRole("button", { name: "Agregar otro tipo de habitación" }));
    expect(screen.getByRole("button", { name: /Triple Familiar/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cuádruple/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Individual \(1 pers\.\)/ }));
    expect(screen.getByLabelText("Habitaciones Individual")).toHaveTextContent("1");
    expect(screen.getByText(/Se crearán/)).toHaveTextContent("1 habitación (1 lugar)");
    await user.click(screen.getByRole("button", { name: "Agregar una habitación Individual" }));
    await user.click(submit());
    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate.mock.calls[0]![0]).toEqual({
      hotelName: "Hotel Sierra",
      rooms: [{ roomType: "SINGLE", quantity: 2 }],
    });
  });

  it("con los cinco tipos registra cada uno una vez", async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText(/Nombre del hotel/), "Hotel Sierra");
    await user.click(screen.getByRole("button", { name: "Agregar una habitación Matrimonial" }));
    for (const name of [/Individual \(1 pers\.\)/, /Triple Familiar/, /Cuádruple/]) {
      await user.click(screen.getByRole("button", { name: "Agregar otro tipo de habitación" }));
      await user.click(screen.getByRole("button", { name }));
    }
    expect(screen.queryByRole("button", { name: "Agregar otro tipo de habitación" })).toBeNull();
    await user.click(submit());
    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate.mock.calls[0]![0].rooms).toHaveLength(4);
  });

  it("envía el nombre recortado y solo los tipos con cantidad", async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText(/Nombre del hotel/), "  Hotel Sierra  ");
    const plusDouble = screen.getByRole("button", {
      name: "Agregar una habitación Doble Individual",
    });
    await user.click(plusDouble);
    await user.click(plusDouble);
    await user.click(screen.getByRole("button", { name: "Agregar otro tipo de habitación" }));
    await user.click(screen.getByRole("button", { name: /Triple Familiar/ }));
    await user.click(submit());

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate.mock.calls[0]![0]).toEqual({
      hotelName: "Hotel Sierra",
      rooms: [
        { roomType: "DOUBLE_INDIVIDUAL", quantity: 2 },
        { roomType: "TRIPLE", quantity: 1 },
      ],
    });
  });

  it("mientras guarda muestra Agregando... y no permite cancelar", () => {
    isPending = true;
    setup();
    expect(submit()).toHaveTextContent("Agregando...");
    expect(submit()).toBeDisabled();
    expect(screen.getAllByRole("button", { name: "Cancelar" })[0]).toBeDisabled();
  });
});
