import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeLodging, makeRoom, PASSENGERS } from "../../../utils/__tests__/lodging.fixtures";

const lodgingQuery = vi.fn();
const assignMutate = vi.fn();
const deleteBedMutate = vi.fn();
const deleteRoomMutate = vi.fn();
const activity = vi.fn();
vi.mock("../../../hooks/useLodging", () => ({
  useTourLodging: () => lodgingQuery(),
  useLodgingActivity: () => activity(),
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
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (m: string) => toastSuccess(m),
    error: (m: string, options?: unknown) => toastError(m, options),
  },
}));

import { LodgingTabContent } from "../LodgingTabContent";

const LODGING = makeLodging([
  makeRoom("r1", { position: 1 }),
  makeRoom("r2", { singleBeds: 2, position: 2, roomNumber: "102" }),
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
    activity.mockReset();
    activity.mockReturnValue({
      busyRoomIds: new Set<string>(),
      registeringRooms: [],
      isUpdating: false,
    });
    assignMutate.mockReset();
    deleteBedMutate.mockReset();
    deleteRoomMutate.mockReset();
    copy.mockClear();
    toastSuccess.mockClear();
    toastError.mockClear();
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
    expect(screen.getByText(/2 habitaciones · 4 lugares/)).toBeInTheDocument();
    expect(screen.getByText("Pasajeros sin habitación")).toBeInTheDocument();
    expect(screen.getByText("Matrimonial #1")).toBeInTheDocument();
    expect(screen.getByText("Hab. 102")).toBeInTheDocument();
    expect(screen.getByText(/\(2 noches\)/)).toBeInTheDocument();
  });

  it("asigna a la pareja a una cama matrimonial libre con una sola llamada", async () => {
    lodgingQuery.mockReturnValue({ data: LODGING });
    render(<LodgingTabContent {...baseProps} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Asignar pareja juntos a cama matrimonial" }),
    );
    expect(assignMutate).toHaveBeenCalledWith({
      roomId: "r1",
      assignments: [
        { slotIndex: 1, bookingPassengerId: "p1" },
        { slotIndex: 2, bookingPassengerId: "p2" },
      ],
    });
  });

  it("la pareja va a la segunda cama matrimonial de una habitación con la primera ocupada", async () => {
    lodgingQuery.mockReturnValue({
      data: makeLodging([
        makeRoom("r5", {
          matrimonialBeds: 2,
          slots: [{ slotIndex: 1, bookingPassengerId: "p3" }],
        }),
      ]),
    });
    render(<LodgingTabContent {...baseProps} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Asignar pareja juntos a cama matrimonial" }),
    );
    expect(assignMutate).toHaveBeenCalledWith({
      roomId: "r5",
      assignments: [
        { slotIndex: 3, bookingPassengerId: "p1" },
        { slotIndex: 4, bookingPassengerId: "p2" },
      ],
    });
  });

  it("sin cama matrimonial libre no ofrece la pareja (2 individuales no sirven)", () => {
    lodgingQuery.mockReturnValue({
      data: makeLodging([makeRoom("r6", { singleBeds: 2 })]),
    });
    render(<LodgingTabContent {...baseProps} />);
    expect(screen.queryByRole("button", { name: /Asignar pareja juntos/ })).not.toBeInTheDocument();
  });

  it("eliminar un lugar de una matrimonial confirma la cama completa y quién queda sin cama", async () => {
    lodgingQuery.mockReturnValue({
      data: makeLodging([
        makeRoom("r7", {
          matrimonialBeds: 1,
          singleBeds: 1,
          slots: [
            { slotIndex: 1, bookingPassengerId: "p1" },
            { slotIndex: 2, bookingPassengerId: "p2" },
          ],
        }),
      ]),
    });
    render(<LodgingTabContent {...baseProps} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Eliminar Cama matrimonial 1 · lado B" }),
    );
    expect(screen.getByText("¿Eliminar la cama matrimonial 1?")).toBeInTheDocument();
    expect(screen.getByText(/cama matrimonial 1 \(2 lugares\)/)).toBeInTheDocument();
    expect(screen.getByText("Ana Pérez y Luis Pérez")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Sí, eliminar cama" }));
    expect(deleteBedMutate).toHaveBeenCalledWith({ roomId: "r7", slotIndex: 2 });
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
          rooms: [makeRoom("r9", { matrimonialBeds: 1, singleBeds: 1 })],
        },
      ],
    };
    lodgingQuery.mockReturnValue({ data: lodging });
    render(<LodgingTabContent {...baseProps} />);
    await userEvent.click(screen.getByRole("button", { name: "Posada Río" }));
    expect(screen.getByText("Triple · 1 matrimonial + 1 individual #1")).toBeInTheDocument();
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
    await userEvent.click(screen.getByRole("button", { name: "Eliminar Cama individual 2" }));
    expect(screen.getByText("¿Eliminar la cama individual 2?")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Sí, eliminar cama" }));
    expect(deleteBedMutate).toHaveBeenCalledWith({ roomId: "r2", slotIndex: 2 });
    // Se cierra al confirmar: un segundo clic no puede repetir la baja.
    expect(screen.queryByText("¿Eliminar la cama individual 2?")).not.toBeInTheDocument();
    expect(deleteBedMutate).toHaveBeenCalledTimes(1);
  });

  it("confirma la eliminación de una habitación con su nombre y número", async () => {
    lodgingQuery.mockReturnValue({ data: LODGING });
    render(<LodgingTabContent {...baseProps} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Eliminar Doble · 2 individuales #1" }),
    );
    expect(screen.getByText("¿Eliminar Doble · 2 individuales #1 · Hab. 102?")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Sí, eliminar habitación" }));
    expect(deleteRoomMutate).toHaveBeenCalledWith({ roomId: "r2" });
    expect(screen.queryByText(/¿Eliminar Doble · 2 individuales/)).not.toBeInTheDocument();
  });

  it("si el tablero cambió mientras confirmaba, no elimina otra cama y avisa", async () => {
    lodgingQuery.mockReturnValue({ data: LODGING });
    const { rerender } = render(<LodgingTabContent {...baseProps} />);
    await userEvent.click(screen.getByRole("button", { name: "Eliminar Cama individual 2" }));
    // Otra operación eliminó una cama: la habitación ya solo tiene una.
    lodgingQuery.mockReturnValue({
      data: makeLodging([makeRoom("r2", { singleBeds: 1, position: 2 })]),
    });
    rerender(<LodgingTabContent {...baseProps} />);
    await userEvent.click(screen.getByRole("button", { name: "Sí, eliminar cama" }));
    expect(deleteBedMutate).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith("La cama cambió", expect.anything());
  });

  it("una habitación con mutación en curso bloquea sus acciones y se marca como actualizando", () => {
    lodgingQuery.mockReturnValue({ data: LODGING });
    activity.mockReturnValue({
      busyRoomIds: new Set(["r1"]),
      registeringRooms: [],
      isUpdating: true,
    });
    render(<LodgingTabContent {...baseProps} />);
    const busyCard = screen.getByRole("article", { name: "Matrimonial #1" });
    expect(busyCard).toHaveAttribute("aria-busy", "true");
    expect(within(busyCard).getByRole("status")).toHaveTextContent("Actualizando");
    expect(
      within(busyCard).getByRole("button", { name: "Eliminar Matrimonial #1" }),
    ).toBeDisabled();
    expect(within(busyCard).queryByRole("button", { name: /^Eliminar Cama/ })).toBeNull();
    const otherCard = screen.getByRole("article", { name: "Doble · 2 individuales #1" });
    expect(otherCard).toHaveAttribute("aria-busy", "false");
    expect(
      within(otherCard).getByRole("button", { name: "Eliminar Doble · 2 individuales #1" }),
    ).toBeEnabled();
    expect(
      within(otherCard).getByRole("button", { name: "Eliminar Cama individual 2" }),
    ).toBeEnabled();
    expect(screen.getByRole("region", { name: "Pasajeros sin habitación" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("no ofrece las camas ni la Matrimonial de una habitación ocupada en el panel de sin cama", async () => {
    lodgingQuery.mockReturnValue({ data: makeLodging([makeRoom("r1", { position: 1 })]) });
    activity.mockReturnValue({
      busyRoomIds: new Set(["r1"]),
      registeringRooms: [],
      isUpdating: true,
    });
    render(<LodgingTabContent {...baseProps} />);
    expect(screen.queryByRole("button", { name: /Asignar pareja juntos/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: /^Asignar a / })[0]);
    expect(screen.getByText("No hay camas libres en este hotel.")).toBeInTheDocument();
  });

  it("muestra marcadores mientras se registran habitaciones del hotel activo", () => {
    lodgingQuery.mockReturnValue({ data: LODGING });
    activity.mockReturnValue({
      busyRoomIds: new Set<string>(),
      registeringRooms: [{ hotelName: " hotel sierra ", count: 2 }],
      isUpdating: true,
    });
    render(<LodgingTabContent {...baseProps} />);
    expect(screen.getAllByRole("status", { name: "Registrando habitación" })).toHaveLength(2);
  });
});
