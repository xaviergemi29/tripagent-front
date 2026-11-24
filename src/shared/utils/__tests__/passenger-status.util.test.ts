import { describe, expect, it } from "vitest";
import { getActivePassengersTitularFirst } from "../passenger-status.util";

describe("getActivePassengersTitularFirst", () => {
  it("excluye los pasajeros dados de baja y pone al titular primero", () => {
    const result = getActivePassengersTitularFirst([
      { name: "Luis", isTitular: false, status: "ACTIVE" },
      { name: "Eva", isTitular: false, status: "CANCELLED" },
      { name: "Ana", isTitular: true, status: "ACTIVE" },
    ]);

    expect(result.map((p) => p.name)).toEqual(["Ana", "Luis"]);
  });

  it("sin `status` conserva al pasajero (la API ya filtra)", () => {
    const result = getActivePassengersTitularFirst([
      { name: "Luis", isTitular: false },
      { name: "Ana", isTitular: true },
    ]);

    expect(result.map((p) => p.name)).toEqual(["Ana", "Luis"]);
  });

  it("no modifica el arreglo original", () => {
    const source = [
      { name: "Luis", isTitular: false, status: "ACTIVE" },
      { name: "Ana", isTitular: true, status: "ACTIVE" },
    ];
    getActivePassengersTitularFirst(source);
    expect(source.map((p) => p.name)).toEqual(["Luis", "Ana"]);
  });
});
