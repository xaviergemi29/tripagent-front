import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "../tour-date.util";

// Tiempo transcurrido de las notificaciones in-app (2026-11-22).
const NOW = new Date("2026-11-22T18:00:00.000Z");
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe("formatRelativeTime", () => {
  it.each([
    [ago(5_000), "Justo ahora"],
    [ago(59_000), "Justo ahora"],
    [ago(MIN), "Hace 1 min"],
    [ago(59 * MIN), "Hace 59 min"],
    [ago(HOUR), "Hace 1 h"],
    [ago(23 * HOUR + 59 * MIN), "Hace 23 h"],
    [ago(DAY), "Ayer"],
    [ago(2 * DAY - MIN), "Ayer"],
    [ago(2 * DAY), "Hace 2 días"],
    [ago(6 * DAY), "Hace 6 días"],
    [ago(7 * DAY), "Hace 1 semana"],
    [ago(13 * DAY), "Hace 1 semana"],
    [ago(14 * DAY), "Hace 2 semanas"],
    [ago(40 * DAY), "Hace 5 semanas"],
  ])("%s → %s", (iso, expected) => {
    expect(formatRelativeTime(iso, NOW)).toBe(expected);
  });

  it("un instante futuro (reloj del servidor adelantado) cuenta como 'Justo ahora'", () => {
    expect(formatRelativeTime(new Date(NOW.getTime() + 5 * MIN).toISOString(), NOW)).toBe(
      "Justo ahora",
    );
  });
});
