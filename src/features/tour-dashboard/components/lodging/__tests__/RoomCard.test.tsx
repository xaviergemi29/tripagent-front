import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TooltipProvider } from "@/components/ui/tooltip";
import { describe, expect, it, vi } from "vitest";
import { makePassenger, makeRoom, PASSENGERS } from "../../../utils/__tests__/lodging.fixtures";
import { RoomCard } from "../RoomCard";

const passengersById = Object.fromEntries(PASSENGERS.map((p) => [p.bookingPassengerId, p]));

function setup(
  room = makeRoom("r1", {
    singleBeds: 2,
    slots: [{ slotIndex: 1, bookingPassengerId: "p1" }],
  }),
  readOnly = false,
) {
  const handlers = {
    onAssign: vi.fn(),
    onUnassign: vi.fn(),
    onRoomNumberChange: vi.fn(),
  };
  render(
    <TooltipProvider>
      <RoomCard
        room={room}
        title="Doble · 2 individuales #1"
        passengersById={passengersById}
        availablePassengers={[PASSENGERS[2], makePassenger("p9", "Zoe Díaz")]}
        {...(readOnly ? {} : handlers)}
      />
    </TooltipProvider>,
  );
  return handlers;
}

describe("RoomCard", () => {
  it("muestra ocupante, etiquetas de cama y ocupación", () => {
    setup();
    expect(screen.getByText("Doble · 2 individuales #1")).toBeInTheDocument();
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("Asiento 4A")).toBeInTheDocument();
    expect(screen.getByText("Cama individual 1")).toBeInTheDocument();
    expect(screen.getByText("2 camas individuales · 2 personas")).toBeInTheDocument();
    expect(screen.getByText("1/2 ocupados (1 libre)")).toBeInTheDocument();
  });

  it("asigna desde la cama libre con el selector", async () => {
    const { onAssign } = setup();
    await userEvent.click(
      screen.getByRole("button", { name: "Asignar pasajero a Cama individual 2" }),
    );
    await userEvent.type(screen.getByLabelText("Buscar pasajero sin habitación"), "zoe");
    expect(screen.queryByText("Marta Ruiz")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Zoe Díaz/ }));
    expect(onAssign).toHaveBeenCalledWith(2, "p9");
  });

  it("desasigna con la X", async () => {
    const { onUnassign } = setup();
    await userEvent.click(
      screen.getByRole("button", { name: "Quitar a Ana Pérez de Cama individual 1" }),
    );
    expect(onUnassign).toHaveBeenCalledWith(1);
  });

  it("edita el número de cuarto: Enter guarda, Escape cancela, vacío lo quita", async () => {
    const { onRoomNumberChange } = setup();
    await userEvent.click(screen.getByRole("button", { name: "Editar número de cuarto" }));
    await userEvent.type(screen.getByLabelText("Número de cuarto"), "101{Enter}");
    expect(onRoomNumberChange).toHaveBeenCalledTimes(1);
    expect(onRoomNumberChange).toHaveBeenCalledWith("101");

    await userEvent.click(screen.getByRole("button", { name: "Editar número de cuarto" }));
    await userEvent.type(screen.getByLabelText("Número de cuarto"), "999{Escape}");
    expect(onRoomNumberChange).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText("Número de cuarto")).not.toBeInTheDocument();
  });

  it("guarda al salir del campo y envía null si queda vacío", async () => {
    const onRoomNumberChange = vi.fn();
    render(
      <RoomCard
        room={makeRoom("r1", { roomNumber: "102" })}
        title="Matrimonial #1"
        passengersById={passengersById}
        availablePassengers={[]}
        onRoomNumberChange={onRoomNumberChange}
      />,
    );
    expect(screen.getByText("Hab. 102")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Editar número de cuarto/ }));
    await userEvent.clear(screen.getByLabelText("Número de cuarto"));
    await userEvent.tab();
    expect(onRoomNumberChange).toHaveBeenCalledWith(null);
  });

  it("no muestra estado Consultada/Confirmada ni el botón para confirmar", () => {
    setup();
    expect(screen.queryByText("Consultada")).not.toBeInTheDocument();
    expect(screen.queryByText("Confirmada")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Marcar como Confirmada/ }),
    ).not.toBeInTheDocument();
  });

  it("en solo consulta no hay ninguna acción", () => {
    setup(
      makeRoom("r1", { roomNumber: "101", slots: [{ slotIndex: 1, bookingPassengerId: "p1" }] }),
      true,
    );
    expect(screen.getByText("Hab. 101")).toBeInTheDocument();
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  describe("eliminar", () => {
    function setupDelete(room: ReturnType<typeof makeRoom>, withHandlers = true) {
      const onDeleteRoom = vi.fn();
      const onDeleteBed = vi.fn();
      render(
        <TooltipProvider>
          <RoomCard
            room={room}
            title="Doble · 2 individuales #1"
            passengersById={passengersById}
            availablePassengers={[]}
            onUnassign={withHandlers ? vi.fn() : undefined}
            onDeleteRoom={withHandlers ? onDeleteRoom : undefined}
            onDeleteBed={withHandlers ? onDeleteBed : undefined}
          />
        </TooltipProvider>,
      );
      return { onDeleteRoom, onDeleteBed };
    }

    const occupied = makeRoom("r1", {
      singleBeds: 2,
      slots: [{ slotIndex: 1, bookingPassengerId: "p1" }],
    });

    it("ofrece eliminar la habitación y cada cama (libre u ocupada) con capacidad > 1", async () => {
      const { onDeleteRoom, onDeleteBed } = setupDelete(occupied);
      await userEvent.click(
        screen.getByRole("button", { name: "Eliminar Doble · 2 individuales #1" }),
      );
      expect(onDeleteRoom).toHaveBeenCalledTimes(1);
      await userEvent.click(screen.getByRole("button", { name: "Eliminar Cama individual 1" }));
      await userEvent.click(screen.getByRole("button", { name: "Eliminar Cama individual 2" }));
      expect(onDeleteBed).toHaveBeenNthCalledWith(1, 1);
      expect(onDeleteBed).toHaveBeenNthCalledWith(2, 2);
    });

    it("con una sola cama solo se puede eliminar la habitación", () => {
      setupDelete(makeRoom("r1", { singleBeds: 1 }));
      expect(
        screen.getByRole("button", { name: "Eliminar Doble · 2 individuales #1" }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^Eliminar Cama/ })).not.toBeInTheDocument();
      expect(screen.getByText("Cama individual 1")).toBeInTheDocument();
      expect(screen.getByText("1 cama individual · 1 persona")).toBeInTheDocument();
      expect(screen.getByText("0/1 ocupados (1 libre)")).toBeInTheDocument();
    });

    it("muestra los tooltips de quitar pasajero y eliminar cama", async () => {
      setupDelete(occupied);
      await userEvent.hover(
        screen.getByRole("button", { name: "Quitar a Ana Pérez de Cama individual 1" }),
      );
      expect((await screen.findAllByText("Quitar pasajero de esta cama")).length).toBeGreaterThan(
        0,
      );
      await userEvent.hover(screen.getByRole("button", { name: "Eliminar Cama individual 2" }));
      expect((await screen.findAllByText("Eliminar esta cama")).length).toBeGreaterThan(0);
    });

    it("una matrimonial muestra los dos lados y elimina la cama completa (2 lugares)", async () => {
      const { onDeleteBed } = setupDelete(
        makeRoom("r1", {
          matrimonialBeds: 1,
          singleBeds: 1,
          slots: [
            { slotIndex: 1, bookingPassengerId: "p1" },
            { slotIndex: 2, bookingPassengerId: "p2" },
          ],
        }),
      );
      expect(screen.getByText("Cama matrimonial 1 · lado A")).toBeInTheDocument();
      expect(screen.getByText("Cama matrimonial 1 · lado B")).toBeInTheDocument();
      expect(screen.getByText("Cama individual 1")).toBeInTheDocument();
      await userEvent.click(
        screen.getByRole("button", { name: "Eliminar Cama matrimonial 1 · lado B" }),
      );
      expect(onDeleteBed).toHaveBeenCalledWith(2);
      await userEvent.hover(
        screen.getByRole("button", { name: "Eliminar Cama matrimonial 1 · lado A" }),
      );
      expect(
        (await screen.findAllByText("Eliminar la cama matrimonial completa (2 lugares)")).length,
      ).toBeGreaterThan(0);
    });

    it("sin callbacks (solo consulta) no hay botones de eliminar", () => {
      setupDelete(occupied, false);
      expect(screen.queryByRole("button", { name: /Eliminar/ })).not.toBeInTheDocument();
    });
  });
});
