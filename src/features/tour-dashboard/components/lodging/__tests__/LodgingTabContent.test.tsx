import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeLodging, makeRoom, PASSENGERS } from "../../../utils/__tests__/lodging.fixtures";

const lodgingQuery = vi.fn();
const assignMutate = vi.fn();
const deleteBedMutate = vi.fn();
const deleteRoomMutate = vi.fn();
vi.mock("../../../hooks/useLodging", () => ({
  useTourLodging: () => lodgingQuery(),
  useRegisterLodgingRooms: () => ({ mutate: vi.fn(), isPending: false }),
  useAssignLodgingRoom: () => ({ mutate: assignMutate }),
  useUnassignLodgingSlot: () => ({ mutate: vi.fn() }),
  useUpdateLodgingRoom: () => ({ mutate: vi.fn() }),
  useDeleteLodgingBed: () => ({ mutate: deleteBedMutate, isPending: false }),
  useDeleteLodgingRoom: () => ({ mutate: deleteRoomMutate, isPending: false }),
}));
const copy = vi.fn<(text: string) => Promise<boolean>>(async () => true);
vi.mock("@/shared/utils/clipboard", () => ({ copyToClipboard: (text: string) => copy(text) }));
const toastSuccess = vi.fn();
vi.mock("sonner", () => ({ toast: { success: (m: string) => toastSuccess(m), error: vi.fn() } }));

import { LodgingTabContent } from "../LodgingTabContent";

const LODGING = makeLodging([
  makeRoom("r1", { position: 1 }),
  makeRoom("r2", { roomType: "DOUBLE_INDIVIDUAL", position: 2, roomNumber: "102" }),
]);

const baseProps = {
  tourId: "t1",
  tourTitle: "Huasteca",
  departureDateTime: "2026-11-14T06:00:00.000Z",
  returnDate: "2026-11-16",
  unassignedPassengersCount: 3,
};

describe("LodgingTabContent", () => {
  beforeEach(() => {
    lodgingQuery.mockReset();
    assignMutate.mockReset();
    deleteBedMutate.mockReset();
    deleteRoomMutate.mockReset();
    copy.mockClear();
    toastSuccess.mockClear();
  });

  it("sin hoteles muestra el estado vacío y su botón abre el modal", async () => {
    lodgingQuery.mockReturnValue({
      data: { hotels: [], passengers: PASSENGERS, totalRooms: 0, totalCapacity: 0 },
    });
    render(<LodgingTabContent {...baseProps} />);
    expect(screen.getByText(/Aún no hay hospedaje/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Agregar primer hotel/ }));
    expect(screen.getByText("Registrar habitaciones y camas")).toBeInTheDocument();
  });

  it("con hoteles muestra el tablero: KPIs, sin cama, habitaciones y estancia", () => {
    lodgingQuery.mockReturnValue({ data: LODGING });
    render(<LodgingTabContent {...baseProps} />);
    expect(screen.getByText("Hospedaje y Rooming List")).toBeInTheDocument();
    expect(screen.getByText("0 / 3")).toBeInTheDocument();
    expect(screen.getByText("4 camas libres")).toBeInTheDocument();
    expect(screen.getByText("0 Conf. · 2 Consult.")).toBeInTheDocument();
    expect(screen.getByText("Pasajeros sin habitación")).toBeInTheDocument();
    expect(screen.getByText("Matrimonial #1")).toBeInTheDocument();
    expect(screen.getByText("Hab. 102")).toBeInTheDocument();
    expect(screen.getByText(/\(2 noches\)/)).toBeInTheDocument();
  });

  it("asigna a la pareja a la Matrimonial vacía con una sola llamada", async () => {
    lodgingQuery.mockReturnValue({ data: LODGING });
    render(<LodgingTabContent {...baseProps} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Asignar pareja juntos a Matrimonial" }),
    );
    expect(assignMutate).toHaveBeenCalledWith({
      roomId: "r1",
      assignments: [
        { slotIndex: 1, bookingPassengerId: "p1" },
        { slotIndex: 2, bookingPassengerId: "p2" },
      ],
    });
  });

  it("copia el Rooming List y avisa", async () => {
    lodgingQuery.mockReturnValue({ data: LODGING });
    render(<LodgingTabContent {...baseProps} />);
    await userEvent.click(screen.getByRole("button", { name: "Copiar Rooming List" }));
    expect(copy).toHaveBeenCalledWith(expect.stringContaining("ROOMING LIST - HUASTECA"));
    expect(toastSuccess).toHaveBeenCalledWith("Rooming List copiado al portapapeles");
  });

  it("'Registrar habitaciones' precarga el hotel activo y 'Agregar otro hotel' abre vacío", async () => {
    lodgingQuery.mockReturnValue({ data: LODGING });
    render(<LodgingTabContent {...baseProps} />);
    await userEvent.click(screen.getByRole("button", { name: /Registrar habitaciones/ }));
    expect(screen.getByLabelText(/Nombre del hotel/)).toHaveValue("Hotel Sierra");
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    await userEvent.click(screen.getByRole("button", { name: /Agregar otro hotel/ }));
    expect(screen.getByLabelText(/Nombre del hotel/)).toHaveValue("");
  });

  it("alterna entre hoteles y cada uno tiene sus camas", async () => {
    const lodging = {
      ...LODGING,
      hotels: [
        ...LODGING.hotels,
        {
          id: "h2",
          name: "Posada Río",
          createdAt: "x",
          rooms: [makeRoom("r9", { roomType: "TRIPLE", capacity: 3 })],
        },
      ],
    };
    lodgingQuery.mockReturnValue({ data: lodging });
    render(<LodgingTabContent {...baseProps} />);
    await userEvent.click(screen.getByRole("button", { name: "Posada Río" }));
    expect(screen.getByText("Triple Familiar #1")).toBeInTheDocument();
    expect(screen.getByText("3 camas libres")).toBeInTheDocument();
  });

  it("en solo consulta se ve y se copia, pero no se modifica nada", () => {
    lodgingQuery.mockReturnValue({ data: LODGING });
    render(<LodgingTabContent {...baseProps} readOnly />);
    expect(screen.getByText("Hab. 102")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copiar Rooming List" })).toBeInTheDocument();
    for (const name of [
      /Registrar habitaciones/,
      /Agregar otro hotel/,
      /^Asignar/,
      /Marcar como/,
    ]) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
  });

  it("en solo consulta sin hoteles informa pero no ofrece el botón", () => {
    lodgingQuery.mockReturnValue({
      data: { hotels: [], passengers: [], totalRooms: 0, totalCapacity: 0 },
    });
    render(<LodgingTabContent {...baseProps} readOnly />);
    expect(screen.getByText(/Aún no hay hospedaje/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("muestra el estado de carga y el error sin datos", () => {
    lodgingQuery.mockReturnValue({ isLoading: true });
    const { rerender } = render(<LodgingTabContent {...baseProps} />);
    expect(screen.getByRole("status", { name: "Cargando hospedaje" })).toBeInTheDocument();
    expect(screen.queryByText("Hospedaje y Rooming List")).not.toBeInTheDocument();
    lodgingQuery.mockReturnValue({ isError: true, refetch: vi.fn() });
    rerender(<LodgingTabContent {...baseProps} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByText(/Aún no hay hospedaje/)).not.toBeInTheDocument();
  });

  it("un hotel sin habitaciones muestra el tablero vacío con la acción de registrar", async () => {
    lodgingQuery.mockReturnValue({
      data: { ...LODGING, hotels: [{ ...LODGING.hotels[0], rooms: [] }] },
    });
    render(<LodgingTabContent {...baseProps} />);
    expect(screen.getByText("Hospedaje y Rooming List")).toBeInTheDocument();
    expect(screen.getByText("Este hotel no tiene habitaciones registradas.")).toBeInTheDocument();
    expect(screen.queryByText(/Aún no hay hospedaje/)).not.toBeInTheDocument();
    const buttons = screen.getAllByRole("button", { name: /Registrar habitaciones/ });
    await userEvent.click(buttons[buttons.length - 1]);
    expect(screen.getByLabelText(/Nombre del hotel/)).toHaveValue("Hotel Sierra");
  });

  it("hotel sin habitaciones en solo consulta no ofrece registrar", () => {
    lodgingQuery.mockReturnValue({
      data: { ...LODGING, hotels: [{ ...LODGING.hotels[0], rooms: [] }] },
    });
    render(<LodgingTabContent {...baseProps} readOnly />);
    expect(screen.getByText("Este hotel no tiene habitaciones registradas.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Registrar habitaciones/ }),
    ).not.toBeInTheDocument();
  });

  it("confirma la eliminación de una cama desde el diálogo", async () => {
    lodgingQuery.mockReturnValue({ data: LODGING });
    render(<LodgingTabContent {...baseProps} />);
    await userEvent.click(screen.getAllByRole("button", { name: "Eliminar Lugar 2" })[0]);
    expect(screen.getByText("¿Eliminar Lugar 2?")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Sí, eliminar cama" }));
    expect(deleteBedMutate).toHaveBeenCalledWith(
      { roomId: "r1", slotIndex: 2 },
      expect.objectContaining({ onSettled: expect.any(Function) }),
    );
  });

  it("confirma la eliminación de una habitación con su nombre y número", async () => {
    lodgingQuery.mockReturnValue({ data: LODGING });
    render(<LodgingTabContent {...baseProps} />);
    await userEvent.click(screen.getByRole("button", { name: "Eliminar Doble Individual #1" }));
    expect(screen.getByText("¿Eliminar Doble Individual #1 · Hab. 102?")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Sí, eliminar habitación" }));
    expect(deleteRoomMutate).toHaveBeenCalledWith(
      { roomId: "r2" },
      expect.objectContaining({ onSettled: expect.any(Function) }),
    );
  });
});
