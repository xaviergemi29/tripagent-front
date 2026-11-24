import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mutate = vi.fn();
let isPending = false;
vi.mock("../../../hooks/useLodging", () => ({
  useRegisterLodgingRooms: () => ({ mutate, isPending }),
}));

import { RoomRegistrationModal } from "../RoomRegistrationModal";

function setup(props: { initialHotelName?: string } = {}) {
  render(<RoomRegistrationModal isOpen onClose={vi.fn()} tourId="t1" {...props} />);
  return { user: userEvent.setup() };
}

const submit = () => screen.getByRole("button", { name: /Agregar al tablero|Agregando/ });
const summary = () => screen.getByText(/Se crearán/);
const plus = (kind: "matrimonial" | "individual", n: number) =>
  screen.getByRole("button", { name: `Agregar una cama ${kind} a la Habitación ${n}` });
const minus = (kind: "matrimonial" | "individual", n: number) =>
  screen.getByRole("button", { name: `Quitar una cama ${kind} de la Habitación ${n}` });
const matrimonial = (n: number) =>
  screen.getByLabelText(`Camas matrimoniales de la Habitación ${n}`);
const single = (n: number) => screen.getByLabelText(`Camas individuales de la Habitación ${n}`);

const registered = () => mutate.mock.calls[0]![0];

describe("RoomRegistrationModal", () => {
  beforeEach(() => {
    mutate.mockReset();
    isPending = false;
  });

  it("abre sin camas elegidas: nada se registra por omisión y exige hotel y camas", async () => {
    const { user } = setup();
    expect(screen.getByLabelText(/Nombre del hotel/)).toHaveValue("");
    expect(matrimonial(1)).toHaveTextContent("0");
    expect(single(1)).toHaveTextContent("0");
    expect(screen.getByText("Elige las camas")).toBeInTheDocument();
    expect(screen.getByText("Habitación 1:")).toBeInTheDocument();
    expect(screen.getByText(/sin camas todavía/)).toBeInTheDocument();
    expect(screen.getByText("Elige las camas de la Habitación 1")).toBeInTheDocument();
    expect(submit()).toBeDisabled();
    await user.type(screen.getByLabelText(/Nombre del hotel/), "   ");
    await user.click(plus("matrimonial", 1));
    expect(submit()).toBeDisabled();
    await user.type(screen.getByLabelText(/Nombre del hotel/), "Hotel Sierra");
    expect(submit()).toBeEnabled();
  });

  it("precarga initialHotelName pero sigue exigiendo elegir camas", async () => {
    const { user } = setup({ initialHotelName: "Hotel Sierra" });
    expect(screen.getByLabelText(/Nombre del hotel/)).toHaveValue("Hotel Sierra");
    expect(submit()).toBeDisabled();
    await user.click(plus("individual", 1));
    expect(submit()).toBeEnabled();
  });

  it("1 matrimonial se envía como 1 matrimonial", async () => {
    const { user } = setup({ initialHotelName: "H" });
    await user.click(plus("matrimonial", 1));
    expect(screen.getByText("Matrimonial · 2 personas")).toBeInTheDocument();
    expect(screen.getByText(/1 cama matrimonial · 2 personas/)).toBeInTheDocument();
    await user.click(submit());
    expect(registered()).toEqual({
      hotelName: "H",
      rooms: [{ matrimonialBeds: 1, singleBeds: 0, quantity: 1 }],
    });
  });

  it("2 individuales se muestran y se envían como 2 individuales, nunca como matrimonial", async () => {
    const { user } = setup({ initialHotelName: "H" });
    await user.click(plus("individual", 1));
    expect(screen.getByText("Individual · 1 persona")).toBeInTheDocument();
    await user.click(plus("individual", 1));
    expect(screen.getByText("Doble · 2 individuales · 2 personas")).toBeInTheDocument();
    expect(screen.getByText(/2 camas individuales · 2 personas/)).toBeInTheDocument();
    expect(screen.queryByText(/matrimonial/i, { selector: "span" })).toBeNull();
    await user.click(submit());
    expect(registered().rooms).toEqual([{ matrimonialBeds: 0, singleBeds: 2, quantity: 1 }]);
  });

  it("1 matrimonial + 1 individual (triple) y 3 individuales", async () => {
    const { user } = setup({ initialHotelName: "H" });
    await user.click(plus("matrimonial", 1));
    await user.click(plus("individual", 1));
    expect(
      screen.getByText("Triple · 1 matrimonial + 1 individual · 3 personas"),
    ).toBeInTheDocument();
    await user.click(minus("matrimonial", 1));
    await user.click(plus("individual", 1));
    await user.click(plus("individual", 1));
    expect(screen.getByText("Triple · 3 individuales · 3 personas")).toBeInTheDocument();
    await user.click(submit());
    expect(registered().rooms).toEqual([{ matrimonialBeds: 0, singleBeds: 3, quantity: 1 }]);
  });

  it("escenario reportado: la primera habitación ya no crea una matrimonial de más", async () => {
    const { user } = setup({ initialHotelName: "H" });
    // Antes arrancaba en 1 matrimonial y "otra habitación" para 2 individuales creaba ambas.
    await user.click(screen.getByRole("button", { name: "Agregar otra habitación" }));
    await user.click(plus("individual", 2));
    await user.click(plus("individual", 2));
    // La Habitación 1 sigue vacía: el operador la ve y no se puede enviar así.
    expect(screen.getByText("Elige las camas de la Habitación 1")).toBeInTheDocument();
    expect(submit()).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Eliminar Habitación 1" }));
    await user.click(submit());
    expect(registered().rooms).toEqual([{ matrimonialBeds: 0, singleBeds: 2, quantity: 1 }]);
  });

  it("el resumen lista cada habitación antes de agregar", async () => {
    const { user } = setup({ initialHotelName: "H" });
    await user.click(plus("individual", 1));
    await user.click(plus("individual", 1));
    await user.click(screen.getByRole("button", { name: "Agregar otra habitación" }));
    await user.click(plus("matrimonial", 2));
    const list = screen.getByRole("region", { name: "Resumen de habitaciones" });
    expect(list).toHaveTextContent("Habitación 1: 2 camas individuales · 2 personas");
    expect(list).toHaveTextContent("Habitación 2: 1 cama matrimonial · 2 personas");
    expect(summary()).toHaveTextContent("2 habitaciones (4 lugares)");
  });

  it("agrupa configuraciones idénticas y envía varias en un mismo envío", async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText(/Nombre del hotel/), "  Hotel Sierra  ");
    await user.click(plus("matrimonial", 1)); // H1: matrimonial
    await user.click(screen.getByRole("button", { name: "Agregar otra habitación" }));
    await user.click(plus("individual", 2));
    await user.click(plus("individual", 2)); // H2: 2 individuales
    await user.click(screen.getByRole("button", { name: "Duplicar última" })); // H3 igual a H2
    await user.click(screen.getByRole("button", { name: "Agregar otra habitación" }));
    await user.click(plus("matrimonial", 4));
    await user.click(plus("individual", 4)); // H4: triple
    await user.click(submit());

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(registered()).toEqual({
      hotelName: "Hotel Sierra",
      rooms: [
        { matrimonialBeds: 1, singleBeds: 0, quantity: 1 },
        { matrimonialBeds: 0, singleBeds: 2, quantity: 2 },
        { matrimonialBeds: 1, singleBeds: 1, quantity: 1 },
      ],
    });
  });

  it("respeta los límites: 2 matrimoniales, 4 individuales y 6 personas por habitación", async () => {
    const { user } = setup({ initialHotelName: "H" });
    expect(minus("matrimonial", 1)).toBeDisabled();
    await user.click(plus("matrimonial", 1));
    await user.click(plus("matrimonial", 1));
    expect(plus("matrimonial", 1)).toBeDisabled();
    expect(screen.getByText("Doble · 2 matrimoniales · 4 personas")).toBeInTheDocument();
    await user.click(plus("individual", 1));
    await user.click(plus("individual", 1));
    expect(plus("individual", 1)).toBeDisabled();
    expect(screen.getByText("Máximo 6 personas por habitación.")).toBeInTheDocument();
    expect(screen.getByText("6 personas · 2 matrimoniales + 2 individuales")).toBeInTheDocument();
    expect(submit()).toBeEnabled();
    await user.click(minus("matrimonial", 1));
    await user.click(minus("matrimonial", 1));
    await user.click(plus("individual", 1));
    await user.click(plus("individual", 1));
    expect(plus("individual", 1)).toBeDisabled(); // 4 individuales
    expect(screen.getByText("Cuádruple · 4 individuales · 4 personas")).toBeInTheDocument();
  });

  it("Duplicar última copia las camas con nuevo consecutivo", async () => {
    const { user } = setup({ initialHotelName: "H" });
    await user.click(plus("individual", 1));
    await user.click(screen.getByRole("button", { name: "Duplicar última" }));
    expect(matrimonial(2)).toHaveTextContent("0");
    expect(single(2)).toHaveTextContent("1");
    expect(summary()).toHaveTextContent("2 habitaciones (2 lugares)");
  });

  it("eliminar una intermedia renumera y descuenta; con una sola no hay eliminar", async () => {
    const { user } = setup({ initialHotelName: "H" });
    expect(screen.queryByRole("button", { name: /Eliminar Habitación/ })).toBeNull();
    await user.click(plus("individual", 1));
    await user.click(screen.getByRole("button", { name: "Duplicar última" }));
    await user.click(screen.getByRole("button", { name: "Duplicar última" }));
    await user.click(plus("matrimonial", 2)); // Habitación 2: matrimonial + individual (3 lugares)
    expect(summary()).toHaveTextContent("3 habitaciones (5 lugares)");
    await user.click(screen.getByRole("button", { name: "Eliminar Habitación 2" }));
    expect(screen.queryByText("Habitación 3")).toBeNull();
    expect(screen.getByText("Habitación 2")).toBeInTheDocument();
    expect(matrimonial(2)).toHaveTextContent("0");
    expect(summary()).toHaveTextContent("2 habitaciones (2 lugares)");
  });

  it("mientras guarda muestra Agregando... y no permite cancelar", () => {
    isPending = true;
    setup({ initialHotelName: "H" });
    expect(submit()).toHaveTextContent("Agregando...");
    expect(submit()).toBeDisabled();
    expect(screen.getAllByRole("button", { name: "Cancelar" })[0]).toBeDisabled();
  });
});
