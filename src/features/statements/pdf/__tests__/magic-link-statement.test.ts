import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildMagicLinkStatement, type MagicLinkStatementSource } from "../magic-link-statement";

// Única conversión del payload del Magic Link (PARTIAL_PAYMENT / PAID) al contrato del PDF
// (regla 16 de ../CLAUDE.md).

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3001/api"));
afterEach(() => vi.unstubAllEnvs());

const source = (overrides: Partial<MagicLinkStatementSource> = {}): MagicLinkStatementSource => ({
  tourInfo: {
    title: "Zacatlán de las Manzanas",
    departureDateTime: "2026-11-14",
    returnDate: "2026-11-15",
    currency: "USD",
    postPaymentInstructions: "Llevar chamarra.",
  },
  groupSize: 3,
  financials: { totalAmount: 900, amountPaid: 300, remainingBalance: 600 },
  paymentHistory: [
    { id: "p2", date: "2026-11-10T10:00:00Z", amount: 100, method: "CASH", reference: null },
    {
      id: "p1",
      date: "2026-11-01T10:00:00Z",
      amount: 200,
      method: "TRANSFER",
      reference: "SPEI 1",
    },
  ],
  passengers: [
    { name: "Luis", isTitular: false, status: "ACTIVE", boardingPoint: "Gasolinera Las Trancas" },
    { name: "Eva", isTitular: false, status: "CANCELLED" },
    {
      name: "Ana",
      isTitular: true,
      status: "ACTIVE",
      seatLabel: "12",
      phone: "2281234567",
      boardingPointDetails: { location: "Plaza Xalapeña", time: "06:00" },
    },
  ],
  agency: {
    name: "Viajes Xalapa",
    phone: "2281112222",
    email: "hola@viajesxalapa.mx",
    bankName: "BBVA",
    accountHolder: "Viajes Xalapa SA",
    clabeNumber: "012180001234567891",
    logoPath: "/uploads/logos/agency-1.png",
    primaryColor: "#059669",
    secondaryColor: "#047857",
    accentColor: null,
    policies: "Anticipo no reembolsable.",
  },
  ...overrides,
});

describe("buildMagicLinkStatement", () => {
  it("solo pasajeros activos, titular primero, con su abordaje resuelto", () => {
    const { passengers, tour } = buildMagicLinkStatement(source());

    expect(passengers.map((p) => p.fullName)).toEqual(["Ana", "Luis"]);
    expect(passengers[0]).toMatchObject({
      isMainPassenger: true,
      pickupPointName: "Plaza Xalapeña",
      pickupTime: "06:00",
      seatNumber: "12",
      phone: "2281234567",
    });
    // Sin coincidencia con un punto del tour: el texto guardado, sin hora.
    expect(passengers[1]).toMatchObject({
      pickupPointName: "Gasolinera Las Trancas",
      pickupTime: null,
    });
    expect(tour).toMatchObject({ totalPassengers: 3, registeredPassengers: 2 });
  });

  it("abonos en orden cronológico con su concepto y la moneda del tour", () => {
    const { financials } = buildMagicLinkStatement(source());
    expect(financials).toMatchObject({
      currency: "USD",
      totalAmount: 900,
      paidAmount: 300,
      balanceDue: 600,
    });
    expect(financials.payments.map((p) => p.concept)).toEqual([
      "Anticipo Apartado de Lugares",
      "Abono a Cuenta",
    ]);
  });

  it("datos bancarios sin número de tarjeta; logo servido desde /public", () => {
    const { agency } = buildMagicLinkStatement(source());
    expect(agency.bankInfo).toEqual({
      bankName: "BBVA",
      accountHolder: "Viajes Xalapa SA",
      clabe: "012180001234567891",
    });
    expect(agency.logoUrl).toBe("http://localhost:3001/public/uploads/logos/agency-1.png");
    expect(agency.policies).toBe("Anticipo no reembolsable.");
  });

  it("sin banco ni CLABE no hay bloque bancario; sin logo, null", () => {
    const base = source();
    const { agency } = buildMagicLinkStatement(
      source({ agency: { ...base.agency, bankName: null, clabeNumber: null, logoPath: null } }),
    );
    expect(agency.bankInfo).toBeNull();
    expect(agency.logoUrl).toBeNull();
  });

  it("aplica respaldos: MXN, sin saldo negativo y grupo = pasajeros activos", () => {
    const base = source();
    const { financials, tour } = buildMagicLinkStatement(
      source({
        tourInfo: { ...base.tourInfo, currency: undefined },
        groupSize: undefined,
        financials: { totalAmount: 900, amountPaid: 950, remainingBalance: -50 },
        paymentHistory: undefined,
      }),
    );
    expect(financials).toMatchObject({ currency: "MXN", balanceDue: 0, payments: [] });
    expect(tour.totalPassengers).toBe(2);
  });
});
