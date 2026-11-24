import { describe, expect, it } from "vitest";
import {
  canAddBed,
  describeBeds,
  exceedsRegisterLimits,
  getBedOfSlot,
  getBedsCapacity,
  getRegisterableCapacity,
  getRoomKindLabel,
  getRoomKindName,
  getSlotLabel,
  groupRoomsByBeds,
  isValidBeds,
  removeBedFromBeds,
} from "../lodging-beds.util";

const beds = (matrimonialBeds: number, singleBeds: number) => ({ matrimonialBeds, singleBeds });

describe("camas de la habitación", () => {
  it("capacidad = 2 por matrimonial + 1 por individual", () => {
    expect(getBedsCapacity(beds(0, 2))).toBe(2);
    expect(getBedsCapacity(beds(2, 2))).toBe(6);
  });

  it("valida límites: al menos una cama, 0..2 matrimoniales, 0..4 individuales, máx. 6 lugares", () => {
    expect(isValidBeds(beds(0, 0))).toBe(false);
    expect(isValidBeds(beds(3, 0))).toBe(false);
    expect(isValidBeds(beds(0, 5))).toBe(false);
    expect(isValidBeds(beds(2, 3))).toBe(false);
    expect(isValidBeds(beds(1, 4))).toBe(true);
    expect(isValidBeds(beds(2, 2))).toBe(true);
    expect(isValidBeds(beds(0, 3))).toBe(true);
    expect(isValidBeds(beds(0, 1.5))).toBe(false);
  });

  it("canAddBed respeta los topes por clase y de lugares", () => {
    expect(canAddBed(beds(2, 0), "MATRIMONIAL")).toBe(false);
    expect(canAddBed(beds(1, 4), "SINGLE")).toBe(false);
    expect(canAddBed(beds(1, 4), "MATRIMONIAL")).toBe(false);
    expect(canAddBed(beds(2, 1), "SINGLE")).toBe(true);
    expect(canAddBed(beds(2, 2), "SINGLE")).toBe(false);
  });
});

describe("nombre y descripción por camas", () => {
  it.each([
    [beds(0, 1), "Individual"],
    [beds(1, 0), "Matrimonial"],
    [beds(0, 2), "Doble · 2 individuales"],
    [beds(2, 0), "Doble · 2 matrimoniales"],
    [beds(1, 1), "Triple · 1 matrimonial + 1 individual"],
    [beds(0, 3), "Triple · 3 individuales"],
    [beds(1, 2), "Cuádruple · 1 matrimonial + 2 individuales"],
    [beds(0, 4), "Cuádruple · 4 individuales"],
    [beds(2, 1), "5 personas · 2 matrimoniales + 1 individual"],
    [beds(1, 4), "6 personas · 1 matrimonial + 4 individuales"],
  ])("%j → %s", (value, name) => {
    expect(getRoomKindName(value)).toBe(name);
  });

  it("la etiqueta añade las personas salvo en el nombre genérico, que ya las trae", () => {
    expect(getRoomKindLabel(beds(0, 2))).toBe("Doble · 2 individuales · 2 personas");
    expect(getRoomKindLabel(beds(2, 2))).toBe("6 personas · 2 matrimoniales + 2 individuales");
  });

  it("describe las camas y la capacidad", () => {
    expect(describeBeds(beds(0, 1))).toBe("1 cama individual · 1 persona");
    expect(describeBeds(beds(0, 2))).toBe("2 camas individuales · 2 personas");
    expect(describeBeds(beds(1, 2))).toBe("1 cama matrimonial + 2 camas individuales · 4 personas");
  });
});

describe("disposición de lugares", () => {
  it("matrimoniales primero (2 lugares c/u) y después las individuales", () => {
    const room = beds(2, 1);
    expect(getSlotLabel(room, 1)).toBe("Cama matrimonial 1 · lado A");
    expect(getSlotLabel(room, 2)).toBe("Cama matrimonial 1 · lado B");
    expect(getSlotLabel(room, 3)).toBe("Cama matrimonial 2 · lado A");
    expect(getSlotLabel(room, 4)).toBe("Cama matrimonial 2 · lado B");
    expect(getSlotLabel(room, 5)).toBe("Cama individual 1");
    expect(getBedOfSlot(room, 4)).toEqual({
      kind: "MATRIMONIAL",
      number: 2,
      firstSlot: 3,
      size: 2,
    });
    expect(getBedOfSlot(room, 6)).toBeNull();
  });

  it("2 individuales nunca se etiquetan como matrimonial", () => {
    expect(getSlotLabel(beds(0, 2), 1)).toBe("Cama individual 1");
    expect(getSlotLabel(beds(0, 2), 2)).toBe("Cama individual 2");
  });

  it("eliminar un lugar quita la cama completa de su clase", () => {
    expect(removeBedFromBeds(beds(1, 2), 2)).toEqual(beds(0, 2));
    expect(removeBedFromBeds(beds(1, 2), 4)).toEqual(beds(1, 1));
    expect(removeBedFromBeds(beds(1, 2), 9)).toEqual(beds(1, 2));
  });
});

describe("registro por lotes", () => {
  it("agrupa habitaciones idénticas en el orden de la primera aparición", () => {
    const rooms = [beds(0, 2), beds(1, 0), beds(0, 2), beds(1, 1), beds(0, 2)];
    expect(groupRoomsByBeds(rooms)).toEqual([
      { matrimonialBeds: 0, singleBeds: 2, quantity: 3 },
      { matrimonialBeds: 1, singleBeds: 0, quantity: 1 },
      { matrimonialBeds: 1, singleBeds: 1, quantity: 1 },
    ]);
    expect(getRegisterableCapacity(rooms)).toBe(2 + 2 + 2 + 3 + 2);
  });

  it("no agrupa ni suma las habitaciones sin camas", () => {
    expect(groupRoomsByBeds([beds(0, 0), beds(0, 1)])).toEqual([
      { matrimonialBeds: 0, singleBeds: 1, quantity: 1 },
    ]);
    expect(getRegisterableCapacity([beds(0, 0)])).toBe(0);
  });

  it("detecta el máximo de 50 iguales por envío y de 200 habitaciones", () => {
    expect(exceedsRegisterLimits(Array.from({ length: 50 }, () => beds(1, 0)))).toBe(false);
    expect(exceedsRegisterLimits(Array.from({ length: 51 }, () => beds(1, 0)))).toBe(true);
    expect(exceedsRegisterLimits(Array.from({ length: 201 }, () => beds(1, 0)))).toBe(true);
  });
});
