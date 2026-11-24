import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BoardingList } from "../components/BoardingList";
import type { BoardingListItem } from "../schemas/boarding.schema";

const items: BoardingListItem[] = [
  {
    id: "t-1",
    fullName: "Mariana Ruiz",
    holderName: "Mariana Ruiz",
    isTitular: true,
    passengerType: "ADULT",
    seatLabel: "4",
    boardingPointCode: "P1",
    rooms: [
      { hotelName: "Hotel Sierra", roomNumber: "102", roomType: "MATRIMONIAL", typeIndex: 1 },
    ],
    boardedAt: null,
  },
  {
    id: "t-2",
    fullName: "Diego Ruiz",
    holderName: "Mariana Ruiz",
    isTitular: false,
    passengerType: "CHILD",
    seatLabel: null,
    boardingPointCode: null,
    rooms: [],
    boardedAt: "2026-11-23T12:05:00.000Z",
  },
];
const points = [{ code: "P1", location: "Plaza Xalapa", time: "06:00" }];

describe("BoardingList", () => {
  it("contador en vivo, barra de progreso y datos del renglón", () => {
    render(
      <BoardingList
        items={items}
        boardingPoints={points}
        temporalStatus="PRÓXIMO"
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText(/Abordados:/)).toHaveTextContent("Abordados: 1 de 2 pasajeros");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
    const row = screen.getByText("Mariana Ruiz", { selector: "p" }).closest("li")!;
    expect(within(row).getByText("Titular de la reserva")).toBeInTheDocument();
    expect(within(row).getByText(/P1 · Plaza Xalapa · 06:00 AM/)).toBeInTheDocument();
    expect(within(row).getByText("Asiento 4")).toBeInTheDocument();
    expect(within(row).getByText("Hab. 102")).toBeInTheDocument();
    expect(screen.getByText("Titular: Mariana Ruiz")).toBeInTheDocument();
  });

  it("con el tour EN CURSO abre en 'Faltan'; los filtros cambian la lista", async () => {
    const user = userEvent.setup();
    render(
      <BoardingList
        items={items}
        boardingPoints={points}
        temporalStatus="EN CURSO"
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Faltan (1)" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByText("Diego Ruiz")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Abordados (1)" }));
    expect(screen.getByText("Diego Ruiz")).toBeInTheDocument();
    expect(screen.queryByText("Mariana Ruiz", { selector: "p" })).not.toBeInTheDocument();
  });

  it("el botón grande marca y desmarca", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <BoardingList
        items={items}
        boardingPoints={points}
        temporalStatus="PRÓXIMO"
        onToggle={onToggle}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Marcar a Mariana Ruiz como abordado" }));
    expect(onToggle).toHaveBeenCalledWith("t-1", true);
    await user.click(screen.getByRole("button", { name: "Quitar abordaje de Diego Ruiz" }));
    expect(onToggle).toHaveBeenCalledWith("t-2", false);
  });

  it("búsqueda por titular", async () => {
    const user = userEvent.setup();
    render(
      <BoardingList
        items={items}
        boardingPoints={points}
        temporalStatus="PRÓXIMO"
        onToggle={vi.fn()}
      />,
    );
    await user.type(screen.getByRole("searchbox", { name: /Buscar pasajero/ }), "diego");
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("modo consulta: botones deshabilitados y aviso", () => {
    render(
      <BoardingList
        items={items}
        boardingPoints={points}
        temporalStatus="FINALIZADO"
        readOnlyMessage="El tour ya finalizó: la lista es de solo consulta."
      />,
    );
    expect(screen.getByText(/solo consulta/)).toBeInTheDocument();
    for (const button of screen.getAllByRole("button", { name: /abordad|abordaje/ })) {
      expect(button).toBeDisabled();
    }
  });

  it("mensaje cuando ya abordaron todos", () => {
    render(
      <BoardingList
        items={items.map((i) => ({ ...i, boardedAt: "2026-11-23T12:00:00Z" }))}
        boardingPoints={points}
        temporalStatus="EN CURSO"
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText("¡Ya abordaron todos!")).toBeInTheDocument();
  });
});
