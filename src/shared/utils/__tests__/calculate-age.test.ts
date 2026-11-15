import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculateAge } from "../calculate-age";

describe("calculateAge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 14, 12, 0, 0)); // 14 nov 2026
  });
  afterEach(() => vi.useRealTimers());

  it("resta un año si el cumpleaños de este año aún no llega", () => {
    expect(calculateAge("1990-11-15T12:00:00")).toBe(35);
    expect(calculateAge("1990-11-14T12:00:00")).toBe(36);
    expect(calculateAge("1990-01-01T12:00:00")).toBe(36);
  });

  it("devuelve null con valores vacíos o inválidos", () => {
    expect(calculateAge(null)).toBeNull();
    expect(calculateAge("")).toBeNull();
    expect(calculateAge("31/02/1990")).toBeNull();
  });
});
