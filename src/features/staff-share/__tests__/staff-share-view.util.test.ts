import { describe, expect, it } from "vitest";
import { buildStaffShareView, rowMatchesFilters } from "../utils/staff-share-view.util";
import { parsedPayload } from "./staff-share.fixtures";

describe("buildStaffShareView", () => {
  const view = buildStaffShareView(parsedPayload());

  it("resuelve asientos: staff del croquis y bloqueados, ocupados y libres", () => {
    expect(view.seatsByLabel.get("1")?.status).toBe("STAFF");
    expect(view.seatsByLabel.get("4")?.status).toBe("STAFF");
    expect(view.seatsByLabel.get("2")?.status).toBe("OCCUPIED");
    expect(view.seatsByLabel.get("3")?.status).toBe("FREE");
  });

  it("ordena por asiento en orden natural y deja sin asiento al final", () => {
    expect(view.seatedRows.map((row) => row.passenger.seatLabel)).toEqual(["2", "10"]);
    expect(view.unseatedRows.map((row) => row.passenger.fullName)).toEqual(["Marta Gómez"]);
    expect(view.seatedRows[0].shortName).toBe("Ana T.");
    expect(view.seatedRows[1].point?.code).toBe("P2");
  });

  it("filtra por punto y por nombre sin acentos", () => {
    const [ana, luis] = view.seatedRows;
    expect(rowMatchesFilters(ana, { pointCode: "P2", query: "" })).toBe(false);
    expect(rowMatchesFilters(luis, { pointCode: "P2", query: "perez" })).toBe(true);
    expect(rowMatchesFilters(luis, { pointCode: null, query: "ana" })).toBe(false);
  });
});
