import { describe, expect, it } from "vitest";
import { buildTourFormSchema, tourSchema, type TourInput } from "../tour.schema";
import { getTodayInMexico, PAST_DEPARTURE_ERROR } from "@/shared/utils/tour-date.util";

// `tourSchema` replica las reglas de `createTourBodySchema` de la API. Si una regla cambia aquí,
// debe cambiar también en tripagent-api/src/modules/tours/tours.schema.ts.

const validTour = (overrides: Partial<TourInput> = {}): TourInput => ({
  title: "Huasteca Potosina",
  description: "",
  transportModality: "TRANSPORT_INCLUDED",
  price: 3500,
  depositPerPerson: 1000,
  departureDateTime: "2026-12-20",
  returnDate: "2026-12-22",
  currency: "MXN",
  maxCapacity: 20,
  staffCapacity: 1,
  acceptsBankTransfer: true,
  acceptsCreditCard: false,
  paymentLink: "",
  postPaymentInstructions: null,
  acceptsCash: false,
  cashInstructions: null,
  boardingPoints: [
    { location: "Plaza Xalapeña", time: "06:00" },
    { location: "Coatepec", time: "06:30" },
  ],
  brochureUrl: null,
  destinationType: "NATIONAL",
  ...overrides,
});

/** Mensajes de error de un campo (ruta unida con puntos). */
const errorsAt = (input: TourInput, path: string): string[] => {
  const result = tourSchema.safeParse(input);
  if (result.success) return [];
  return result.error.issues.filter((i) => i.path.join(".") === path).map((i) => i.message);
};

describe("tourSchema", () => {
  it("acepta un tour válido y normaliza los valores de los inputs", () => {
    const result = tourSchema.parse(validTour({ price: "3500" as never, depositPerPerson: "" }));
    expect(result.price).toBe(3500);
    expect(result.depositPerPerson).toBe(0);
    expect(result.departureDateTime).toBe("2026-12-20");
    expect(result.returnDate).toBe("2026-12-22");
  });

  it("el anticipo no puede superar el precio (marca ambos campos)", () => {
    const input = validTour({ price: 1000, depositPerPerson: 1500 });
    expect(errorsAt(input, "depositPerPerson")).toContain(
      "El anticipo no puede ser mayor al precio total",
    );
    expect(errorsAt(input, "price")).toContain("El precio total no puede ser menor al anticipo");
    // Igual al precio sí se permite.
    expect(tourSchema.safeParse(validTour({ price: 1000, depositPerPerson: 1000 })).success).toBe(
      true,
    );
  });

  it("el precio debe ser mayor a 0 y la capacidad al menos 1", () => {
    expect(errorsAt(validTour({ price: 0 }), "price")).toContain("El precio debe ser mayor a 0");
    expect(errorsAt(validTour({ maxCapacity: 0 }), "maxCapacity")).toContain(
      "La capacidad debe ser de al menos 1 asiento",
    );
  });

  it("los lugares de staff deben ser menores a la capacidad total y no negativos", () => {
    expect(errorsAt(validTour({ maxCapacity: 20, staffCapacity: 20 }), "staffCapacity")).toContain(
      "Los lugares de staff deben ser menores a la capacidad total",
    );
    expect(errorsAt(validTour({ staffCapacity: -1 }), "staffCapacity")).toContain(
      "Los lugares de staff no pueden ser negativos",
    );
    expect(tourSchema.safeParse(validTour({ maxCapacity: 20, staffCapacity: 19 })).success).toBe(
      true,
    );
  });

  it("el regreso no puede ser anterior a la salida (el mismo día sí)", () => {
    const input = validTour({ departureDateTime: "2026-12-20", returnDate: "2026-12-19" });
    expect(errorsAt(input, "returnDate")).toContain(
      "La fecha de regreso no puede ser anterior a la salida",
    );
    expect(
      tourSchema.safeParse(validTour({ departureDateTime: "2026-12-20", returnDate: "2026-12-20" }))
        .success,
    ).toBe(true);
  });

  it("sin fecha de regreso es válido (null)", () => {
    expect(tourSchema.parse(validTour({ returnDate: "" })).returnDate).toBeNull();
  });

  it("tarjeta exige enlace de pago válido", () => {
    expect(
      errorsAt(validTour({ acceptsCreditCard: true, paymentLink: "" }), "paymentLink"),
    ).toContain("Debes proporcionar un enlace de pago si aceptas tarjeta");
    expect(
      errorsAt(validTour({ acceptsCreditCard: true, paymentLink: "mercadopago" }), "paymentLink"),
    ).toHaveLength(1);
    expect(
      tourSchema.safeParse(
        validTour({ acceptsCreditCard: true, paymentLink: "https://mpago.la/abc" }),
      ).success,
    ).toBe(true);
  });

  it("efectivo exige instrucciones de al menos 10 caracteres", () => {
    expect(
      errorsAt(validTour({ acceptsCash: true, cashInstructions: "  corto  " }), "cashInstructions"),
    ).toContain("Instrucciones claras son vitales para evitar fraude o confusión");
    expect(
      tourSchema.safeParse(
        validTour({ acceptsCash: true, cashInstructions: "Pago en oficina centro" }),
      ).success,
    ).toBe(true);
  });

  it("debe haber al menos un método de cobro", () => {
    const input = validTour({
      acceptsBankTransfer: false,
      acceptsCreditCard: false,
      acceptsCash: false,
    });
    expect(errorsAt(input, "root.paymentMethods")).toContain(
      "Debes habilitar al menos un método de cobro para tus viajeros",
    );
  });

  it("al menos un punto de abordaje, con hora HH:MM y en orden cronológico", () => {
    expect(errorsAt(validTour({ boardingPoints: [] }), "boardingPoints")).toContain(
      "Debes agregar al menos un punto de abordaje",
    );
    expect(
      errorsAt(
        validTour({ boardingPoints: [{ location: "Plaza", time: "25:00" }] }),
        "boardingPoints.0.time",
      ),
    ).toContain("Formato HH:MM");

    const unordered = validTour({
      boardingPoints: [
        { location: "Plaza Xalapeña", time: "07:00" },
        { location: "Coatepec", time: "06:30" },
      ],
    });
    expect(errorsAt(unordered, "boardingPoints.1.time")).toContain(
      "La hora debe ser posterior a la parada anterior",
    );
  });

  it("aplica los valores por defecto (staff 0, MXN, nacional, transporte incluido)", () => {
    const { staffCapacity, currency, destinationType, transportModality, ...rest } = validTour();
    void staffCapacity;
    void currency;
    void destinationType;
    void transportModality;
    const result = tourSchema.parse(rest);
    expect(result).toMatchObject({
      staffCapacity: 0,
      currency: "MXN",
      destinationType: "NATIONAL",
      transportModality: "TRANSPORT_INCLUDED",
    });
  });
});

describe("buildTourFormSchema: la salida no es anterior a hoy (2026-11-17)", () => {
  const shift = (days: number) => {
    const d = new Date(`${getTodayInMexico()}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  };
  const errorsAtDeparture = (schema: ReturnType<typeof buildTourFormSchema>, date: string) => {
    const result = schema.safeParse(validTour({ departureDateTime: date, returnDate: null }));
    return result.success
      ? []
      : result.error.issues.filter((i) => i.path[0] === "departureDateTime").map((i) => i.message);
  };

  it("crear: rechaza ayer, acepta hoy y después", () => {
    const schema = buildTourFormSchema(null);
    expect(errorsAtDeparture(schema, shift(-1))).toContain(PAST_DEPARTURE_ERROR);
    expect(errorsAtDeparture(schema, shift(0))).toEqual([]);
    expect(errorsAtDeparture(schema, shift(10))).toEqual([]);
  });

  it("editar: conserva la fecha guardada aunque ya pasó, pero no la mueve a otro día pasado", () => {
    const saved = shift(-5);
    const schema = buildTourFormSchema(saved);
    expect(errorsAtDeparture(schema, saved)).toEqual([]);
    expect(errorsAtDeparture(schema, shift(-2))).toContain(PAST_DEPARTURE_ERROR);
  });
});
