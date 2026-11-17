import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatBirthdateAndAge,
  formatForDateInput,
  formatLocalDate,
  formatPickupTime,
  formatSpanishLongDate,
  formatTourDateTime,
  getEarliestBoardingTime,
  getTodayIsoString,
  parseDateOnly,
} from "../tour-date.util";

// Las fechas del tour son `date` (YYYY-MM-DD): se formatean sin pasar por la zona horaria local,
// para que "2026-11-14" nunca se muestre como el 13 en America/Mexico_City.

describe("formatForDateInput", () => {
  it("recorta un ISO a YYYY-MM-DD sin mover el día", () => {
    expect(formatForDateInput("2026-11-14")).toBe("2026-11-14");
    expect(formatForDateInput("2026-11-14T23:30:00.000Z")).toBe("2026-11-14");
  });

  it("acepta un Date y devuelve vacío con nulos o fechas inválidas", () => {
    expect(formatForDateInput(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(formatForDateInput(null)).toBe("");
    expect(formatForDateInput(undefined)).toBe("");
    expect(formatForDateInput("no es fecha")).toBe("");
  });
});

describe("formatSpanishLongDate", () => {
  it("formatea en español con mayúscula inicial y sin desfase de zona horaria", () => {
    expect(formatSpanishLongDate("2026-11-14")).toBe("Sábado, 14 de noviembre");
    expect(formatSpanishLongDate("2026-01-01")).toBe("Jueves, 1 de enero");
  });

  it("devuelve vacío sin fecha y el texto original si no es YYYY-MM-DD", () => {
    expect(formatSpanishLongDate(null)).toBe("");
    expect(formatSpanishLongDate("")).toBe("");
    expect(formatSpanishLongDate("pendiente")).toBe("pendiente");
  });
});

describe("formatLocalDate", () => {
  it("formato corto con mayúscula inicial y el día correcto", () => {
    const formatted = formatLocalDate("2026-11-14");
    expect(formatted).toMatch(/^Sáb/);
    expect(formatted).toContain("14");
    expect(formatted.toLowerCase()).toContain("nov");
  });

  it("tolera vacío y valores no válidos", () => {
    expect(formatLocalDate("")).toBe("");
    expect(formatLocalDate("abc")).toBe("abc");
  });
});

describe("formatPickupTime", () => {
  it.each([
    ["06:00", "06:00 AM"],
    ["15:30", "03:30 PM"],
    ["00:15", "12:15 AM"],
    ["12:00", "12:00 PM"],
    ["9", "09:00 AM"],
  ])("%s → %s", (input, expected) => {
    expect(formatPickupTime(input)).toBe(expected);
  });

  it("respeta una hora que ya trae AM/PM y usa --:-- sin hora", () => {
    expect(formatPickupTime("7:00 am")).toBe("7:00 AM");
    expect(formatPickupTime(null)).toBe("--:--");
    expect(formatPickupTime("")).toBe("--:--");
    expect(formatPickupTime("xx")).toBe("xx");
  });
});

describe("formatTourDateTime", () => {
  it("usa la hora más temprana aunque los puntos se hayan capturado en desorden", () => {
    const points = [{ time: "07:00" }, { time: "" }, { time: "06:00" }];
    expect(formatTourDateTime("2026-11-14", points)).toBe("Sábado, 14 de noviembre • 06:00 AM");
    expect(points.map((p) => p.time)).toEqual(["07:00", "", "06:00"]); // no reordena
    expect(getEarliestBoardingTime(points)).toBe("06:00");
    expect(getEarliestBoardingTime([])).toBeNull();
  });

  it("agrega la hora del primer punto de abordaje", () => {
    expect(formatTourDateTime("2026-11-14", [{ time: "06:30" }, { time: "08:00" }])).toBe(
      "Sábado, 14 de noviembre • 06:30 AM",
    );
  });

  it("sin puntos de abordaje (o sin hora) muestra solo la fecha", () => {
    expect(formatTourDateTime("2026-11-14", [])).toBe("Sábado, 14 de noviembre");
    expect(formatTourDateTime("2026-11-14", [{ time: null }])).toBe("Sábado, 14 de noviembre");
    expect(formatTourDateTime(null)).toBe("");
  });
});

describe("Fechas relativas a hoy", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 14, 12, 0, 0)); // 14 nov 2026, mediodía
  });
  afterEach(() => vi.useRealTimers());

  it("getTodayIsoString devuelve la fecha de hoy en YYYY-MM-DD", () => {
    expect(getTodayIsoString()).toBe("2026-11-14");
  });

  it("formatBirthdateAndAge calcula la edad y marca a los menores", () => {
    expect(formatBirthdateAndAge("1990-06-01")).toMatchObject({ age: 36, isMinor: false });
    // Cumple 18 mañana: todavía es menor.
    expect(formatBirthdateAndAge("2008-11-15T12:00:00")).toMatchObject({ age: 17, isMinor: true });
    expect(formatBirthdateAndAge("2008-11-14T12:00:00")).toMatchObject({ age: 18, isMinor: false });
  });

  it("formatBirthdateAndAge devuelve null con fechas vacías o inválidas", () => {
    expect(formatBirthdateAndAge(null)).toBeNull();
    expect(formatBirthdateAndAge("no es fecha")).toBeNull();
  });
});

// Fechas sin hora en CDMX (UTC-6): `new Date("YYYY-MM-DD")` las tomaba en UTC y las corría un día.
describe("fechas sin hora en la zona horaria de CDMX", () => {
  beforeEach(() => vi.stubEnv("TZ", "America/Mexico_City"));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("parseDateOnly conserva el día; con hora interpreta el instante", () => {
    const d = parseDateOnly("1990-05-29");
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([1990, 4, 29]);
    expect(parseDateOnly("2026-11-16T12:00:00Z").toISOString()).toBe("2026-11-16T12:00:00.000Z");
  });

  it("formatBirthdateAndAge muestra el día guardado y cumple años ese día, no el anterior", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 28, 20, 0)); // 28 de mayo, 20:00 en CDMX
    const eve = formatBirthdateAndAge("2008-05-29");
    expect(eve?.formattedDate).toMatch(/^29 may/);
    expect(eve).toMatchObject({ age: 17, isMinor: true });

    vi.setSystemTime(new Date(2026, 4, 29, 8, 0));
    expect(formatBirthdateAndAge("2008-05-29")).toMatchObject({ age: 18, isMinor: false });
  });

  it("getTodayIsoString usa la fecha local: a las 20:00 sigue siendo hoy, no mañana (UTC)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 16, 20, 0)); // 16 nov 20:00 CDMX = 17 nov 02:00 UTC
    expect(getTodayIsoString()).toBe("2026-11-16");
  });
});
