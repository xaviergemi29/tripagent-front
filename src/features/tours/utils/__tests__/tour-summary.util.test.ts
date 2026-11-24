import { describe, expect, it } from "vitest";
import { getTourDuration } from "../tour-summary.util";

describe("getTourDuration", () => {
  it("varios días: N días / N-1 noches", () => {
    expect(getTourDuration("2026-02-14", "2026-02-16")).toEqual({
      days: 3,
      nights: 2,
      label: "3 días / 2 noches",
    });
  });

  it("usa singular en una noche", () => {
    expect(getTourDuration("2026-02-14", "2026-02-15")?.label).toBe("2 días / 1 noche");
  });

  it("sin regreso, mismo día o regreso anterior: 1 día", () => {
    const same = "1 día (regreso el mismo día)";
    expect(getTourDuration("2026-02-14")?.label).toBe(same);
    expect(getTourDuration("2026-02-14", "2026-02-14")?.label).toBe(same);
    expect(getTourDuration("2026-02-14", "2026-02-10")?.label).toBe(same);
  });

  it("cruza el cambio de horario sin perder un día", () => {
    expect(getTourDuration("2026-03-28", "2026-04-05")?.days).toBe(9);
  });

  it("sin salida: null", () => {
    expect(getTourDuration("", "2026-02-15")).toBeNull();
  });
});
