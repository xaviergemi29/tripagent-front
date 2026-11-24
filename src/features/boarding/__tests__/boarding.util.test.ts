import { describe, expect, it } from "vitest";
import type { BoardingListItem } from "../schemas/boarding.schema";
import {
  applyBoardingChange,
  countBoarded,
  filterBoardingItems,
  formatBoardingRoom,
  getDefaultBoardingFilter,
  hasMultipleHotels,
} from "../utils/boarding.util";

const item = (overrides: Partial<BoardingListItem>): BoardingListItem => ({
  id: "1",
  fullName: "Ana Torres",
  holderName: "Ana Torres",
  isTitular: true,
  passengerType: "ADULT",
  seatLabel: null,
  boardingPointCode: null,
  rooms: [],
  boardedAt: null,
  isMinor: false,
  ...overrides,
});

const items = [
  item({ id: "1" }),
  item({
    id: "2",
    fullName: "Diego Ruiz",
    holderName: "Mariana Ruiz",
    isTitular: false,
    boardedAt: "2026-11-23T12:00:00Z",
  }),
  item({ id: "3", fullName: "Mariana Ruiz", holderName: "Mariana Ruiz" }),
];

describe("boarding.util (RB-MAN-002)", () => {
  it("'Faltan' por defecto con el tour EN CURSO; 'Todos' en otro estado", () => {
    expect(getDefaultBoardingFilter("EN CURSO")).toBe("missing");
    expect(getDefaultBoardingFilter("PRÓXIMO")).toBe("all");
    expect(getDefaultBoardingFilter("FINALIZADO")).toBe("all");
  });

  it("cuenta abordados y filtra por estado", () => {
    expect(countBoarded(items)).toBe(1);
    expect(filterBoardingItems(items, "missing", "").map((i) => i.id)).toEqual(["1", "3"]);
    expect(filterBoardingItems(items, "boarded", "").map((i) => i.id)).toEqual(["2"]);
    expect(filterBoardingItems(items, "all", "")).toHaveLength(3);
  });

  it("busca por pasajero o por titular, sin acentos ni mayúsculas", () => {
    expect(filterBoardingItems(items, "all", "mariana").map((i) => i.id)).toEqual(["2", "3"]);
    expect(filterBoardingItems(items, "all", "DIEGO").map((i) => i.id)).toEqual(["2"]);
  });

  it("habitación: número o título por tipo, y hotel solo con varios hoteles", () => {
    const room = {
      hotelName: "Hotel Sierra",
      roomNumber: null,
      roomType: "MATRIMONIAL",
      typeIndex: 2,
    };
    expect(formatBoardingRoom(room, false)).toBe("Matrimonial #2");
    expect(formatBoardingRoom({ ...room, roomNumber: "102" }, true)).toBe(
      "Hab. 102 · Hotel Sierra",
    );
    expect(
      hasMultipleHotels([
        item({ rooms: [room] }),
        item({ rooms: [{ ...room, hotelName: "Otro" }] }),
      ]),
    ).toBe(true);
    expect(hasMultipleHotels([item({ rooms: [room] })])).toBe(false);
  });

  it("cambio optimista: marca o desmarca solo el renglón indicado", () => {
    const now = new Date("2026-11-23T18:00:00Z");
    const marked = applyBoardingChange(items, (i) => i.id === "1", true, now);
    expect(marked[0]!.boardedAt).toBe("2026-11-23T18:00:00.000Z");
    expect(marked[1]).toBe(items[1]);
    expect(applyBoardingChange(items, (i) => i.id === "2", false)[1]!.boardedAt).toBeNull();
  });
});
