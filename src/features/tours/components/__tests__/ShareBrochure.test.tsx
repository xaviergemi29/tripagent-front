import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TourDesktopTable } from "../TourDesktopTable";
import { TourMobileCardList } from "../mobile/TourMobileCardList";
import type { TourOutput } from "../../schemas/tour.schema";

const tour = (id: string, temporalStatus: TourOutput["temporalStatus"]) =>
  ({
    id,
    title: `Tour ${id}`,
    temporalStatus,
    currency: "MXN",
    price: 1200,
    departureDateTime: "2026-11-20",
    destinationType: "NATIONAL",
    boardingPoints: [],
    maxCapacity: 20,
    sellableCapacity: 19,
    currentOccupancy: 7,
  }) as unknown as TourOutput;

const shareButtons = () => screen.queryAllByRole("button", { name: "Compartir folleto digital" });

describe("Compartir folleto", () => {
  it.each([
    ["escritorio", TourDesktopTable],
    ["celular", TourMobileCardList],
  ])("%s: aparece en próximos y en curso; desaparece en cancelados y finalizados", (_, List) => {
    const { unmount } = render(
      <List
        tours={[tour("proximo", "PRÓXIMO"), tour("en-curso", "EN CURSO")]}
        onDeleteRequest={() => {}}
      />,
    );
    expect(shareButtons()).toHaveLength(2);
    unmount();

    render(
      <List
        tours={[tour("cancelado", "CANCELADO"), tour("finalizado", "FINALIZADO")]}
        onDeleteRequest={() => {}}
      />,
    );
    expect(shareButtons()).toHaveLength(0);
  });
});
