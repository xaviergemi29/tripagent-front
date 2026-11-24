import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { TargetBedDeletion, TargetRoomDeletion } from "../../../schemas/lodging.schema";
import { DeleteBedModal } from "../DeleteBedModal";
import { DeleteRoomModal } from "../DeleteRoomModal";

const bed: TargetBedDeletion = {
  roomId: "r1",
  roomName: "Triple · 1 matrimonial + 1 individual #1 · Hab. 102",
  slotIndex: 2,
  bedName: "cama matrimonial 1",
  slotsCount: 2,
  assignedPassengers: [
    { id: "p1", fullName: "Ana Pérez" },
    { id: "p2", fullName: "Luis Pérez" },
  ],
};
const room: TargetRoomDeletion = {
  roomId: "r1",
  roomName: "Triple · 1 matrimonial + 1 individual #1 · Hab. 102",
  totalBeds: 2,
  assignedPassengersCount: 2,
};

describe("DeleteBedModal", () => {
  it("no se dibuja sin cama objetivo", () => {
    render(<DeleteBedModal targetBed={null} onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("con pasajero avisa que regresará a 'sin habitación' y confirma", async () => {
    const onConfirm = vi.fn();
    render(<DeleteBedModal targetBed={bed} onClose={vi.fn()} onConfirm={onConfirm} />);
    expect(screen.getByText("¿Eliminar la cama matrimonial 1?")).toBeInTheDocument();
    expect(
      screen.getByText("Triple · 1 matrimonial + 1 individual #1 · Hab. 102"),
    ).toBeInTheDocument();
    expect(screen.getByText(/cama matrimonial 1 \(2 lugares\)/)).toBeInTheDocument();
    expect(screen.getByText("Ana Pérez y Luis Pérez")).toBeInTheDocument();
    expect(screen.getByText(/quedarán sin cama asignada/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Sí, eliminar cama" }));
    expect(onConfirm).toHaveBeenCalledWith(bed);
  });

  it("con la cama libre dice que nadie se ve afectado", () => {
    render(
      <DeleteBedModal
        targetBed={{ ...bed, assignedPassengers: [], slotsCount: 1, bedName: "cama individual 1" }}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByText(/ningún pasajero se verá afectado/)).toBeInTheDocument();
    expect(screen.queryByText(/sin cama asignada/)).not.toBeInTheDocument();
  });

  it("cancela, y mientras elimina no se cierra ni se puede confirmar de nuevo", async () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <DeleteBedModal targetBed={bed} onClose={onClose} onConfirm={vi.fn()} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<DeleteBedModal targetBed={bed} onClose={onClose} onConfirm={vi.fn()} isDeleting />);
    expect(screen.getByRole("button", { name: "Eliminando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("DeleteRoomModal", () => {
  it("con pasajeros usa plural y avisa que regresan", async () => {
    const onConfirm = vi.fn();
    render(<DeleteRoomModal targetRoom={room} onClose={vi.fn()} onConfirm={onConfirm} />);
    expect(
      screen.getByText("¿Eliminar Triple · 1 matrimonial + 1 individual #1 · Hab. 102?"),
    ).toBeInTheDocument();
    expect(screen.getByText("2 lugares")).toBeInTheDocument();
    expect(screen.getByText("2 pasajeros asignados")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Sí, eliminar habitación" }));
    expect(onConfirm).toHaveBeenCalledWith(room);
  });

  it("singular con 1 lugar y 1 pasajero", () => {
    render(
      <DeleteRoomModal
        targetRoom={{ ...room, totalBeds: 1, assignedPassengersCount: 1 }}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByText("1 lugar")).toBeInTheDocument();
    expect(screen.getByText("1 pasajero asignado")).toBeInTheDocument();
  });

  it("sin pasajeros informa que no hay asignados", () => {
    render(
      <DeleteRoomModal
        targetRoom={{ ...room, assignedPassengersCount: 0 }}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByText(/no tiene pasajeros asignados/)).toBeInTheDocument();
  });

  it("no se cierra mientras elimina", async () => {
    const onClose = vi.fn();
    render(<DeleteRoomModal targetRoom={room} onClose={onClose} onConfirm={vi.fn()} isDeleting />);
    expect(screen.getByRole("button", { name: "Eliminando..." })).toBeDisabled();
    await userEvent.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
  });
});
