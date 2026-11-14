import { describe, expect, it } from "vitest";
import {
  buildStatementPayments,
  createPaymentReceiptDocument,
  type StatementPDFData,
} from "../payment-receipt.pdf";

const statement = (overrides: Partial<StatementPDFData["financials"]> = {}): StatementPDFData => ({
  agency: {
    name: "Bruji Tours",
    email: "hola@brujitours.mx",
    whatsapp: "+522288492011",
    primaryColor: "#059669",
    secondaryColor: "#047857",
    bankInfo: {
      bankName: "BBVA México",
      accountHolder: "Bruji Tours SA",
      clabe: "012180001234567891",
    },
  },
  tour: {
    title: "Zacatlán de las Manzanas",
    departureDate: "2026-11-14",
    returnDate: "2026-11-15",
    totalPassengers: 2,
    registeredPassengers: 2,
  },
  passengers: [
    {
      fullName: "Ana Torres",
      isMainPassenger: true,
      pickupPointName: "Autozone 1 Xalapa",
      pickupTime: "06:00",
      seatNumber: "12",
      phone: "+522288492011",
    },
    {
      fullName: "Luis Torres",
      isMainPassenger: false,
      pickupPointName: "Autozone 1 Xalapa",
      pickupTime: "06:00",
      seatNumber: null,
      phone: "Sin teléfono",
    },
  ],
  financials: {
    currency: "MXN",
    totalAmount: 4000,
    paidAmount: 2000,
    balanceDue: 2000,
    payments: buildStatementPayments([
      { id: "p2", date: "2026-11-12T19:10:00Z", amount: 1000, method: "CASH", reference: "Caja 1" },
      {
        id: "p1",
        date: "2026-11-01T19:10:00Z",
        amount: 1000,
        method: "TRANSFER",
        reference: "SPEI 99812",
      },
    ]),
    ...overrides,
  },
  emissionDate: new Date(2026, 10, 12, 14, 45),
});

/** Texto del PDF (jsPDF no comprime los streams por defecto). */
const pdfText = (data: StatementPDFData) => createPaymentReceiptDocument(data).output();
/** ¿Algún texto impreso (operador Tj) contiene `fragment`? */
const printed = (text: string, fragment: string) =>
  text.split("\n").some((line) => line.endsWith("Tj") && line.includes(fragment));

describe("Estado de Cuenta del Viajero (PDF)", () => {
  it("parcial: insignias ámbar y rosa, resta %, límite sugerido y CLABE formateada, sin tarjeta", () => {
    const text = pdfText(statement());

    expect(text).toContain("Abono Parcial en Curso");
    expect(text).toContain("50% Cubierto");
    expect(text).toContain("Resta 50%");
    expect(text).toContain("24h antes del tour");
    expect(text).toContain("Saldo Pendiente por Liquidar");
    expect(text).toContain("Cuentas Bancarias Oficiales de la Agencia");
    expect(text).toContain("012 180 00123456789 1");
    // Decisión del PM: el PDF del cliente no imprime el número de tarjeta (solo banco, titular y CLABE).
    expect(text).not.toContain("Número de Tarjeta");
    expect(text).not.toContain("Viaje 100% Liquidado");
  });

  it("liquidado: insignias verdes, $0.00, sin límite ni banco y con mensaje cordial", () => {
    const text = pdfText(statement({ paidAmount: 4000, balanceDue: 0 }));

    expect(text).toContain("Viaje 100% Liquidado");
    expect(text).toContain("completamente pagado");
    expect(text).toContain("LIQUIDADO!");
    expect(text).toContain("garantizada");
    expect(text).not.toContain("24h antes del tour");
    expect(text).not.toContain("Cuentas Bancarias Oficiales");
    expect(text).not.toContain("012 180");
  });

  it("encabezado y viaje: operador oficial, emisión, fechas largas, pasajeros registrados y divisa", () => {
    const text = pdfText(statement());

    expect(text).toContain("Control Log");
    expect(text).toContain("12 de noviembre");
    expect(text).toContain("02:45 PM");
    expect(text).toContain("14 de noviembre");
    expect(text).toContain("15 de noviembre");
    expect(text).toContain("100% Registrados");
    expect(text).toContain("Importe \\(MXN\\)");
    expect(text).toContain("Tarifa total pactada \\(2 viajeros\\)");
    expect(text).toContain("2 abonos verificados en cuenta");
  });

  it("pasajeros: solo 'Hora:' en abordaje, asiento o [Pendiente], teléfono de 10 dígitos sin +52", () => {
    const text = pdfText(statement());

    expect(text).toContain("Hora: 06:00 AM");
    expect(text).not.toContain("Cita");
    expect(printed(text, "Salida")).toBe(false);
    expect(text).toContain("#12");
    expect(text).toContain("[Pendiente]");
    expect(text).toContain("228 849 2011");
    expect(text).not.toContain("+52");
    expect(text).toContain("2 Viajeros");
  });

  it("abonos: conceptos por orden, métodos normalizados, efectivo sin referencia, importes con +", () => {
    const text = pdfText(statement());

    expect(text).toContain("Anticipo Apartado de Lugares");
    expect(text).toContain("Abono a Cuenta");
    expect(text).toContain("Transferencia");
    expect(text).toContain("Efectivo");
    expect(text).toContain("SPEI 99812");
    expect(text).toContain("- Sin referencia -");
    expect(text).not.toContain("Caja 1"); // pago en efectivo: nunca muestra referencia
    expect(text).toContain("+$1,000.00");
  });

  it("no imprime Estado, moneda en el encabezado, concepto bancario ni políticas", () => {
    const text = pdfText(statement());

    expect(printed(text, "(Estado)")).toBe(false);
    expect(text).not.toContain("Moneda:");
    expect(text).not.toContain("Concepto bancario");
    expect(text).not.toContain("Pol\\355ticas");
    expect(text).not.toMatch(/\((?:[^)]*\b)?(null|undefined)\b[^)]*\)\s*Tj/);
  });

  it("multipágina: encabezado de tabla repetido y 'Página X de Y' con el total real", () => {
    const payments = buildStatementPayments(
      Array.from({ length: 40 }, (_, i) => ({
        id: `p${i}`,
        date: new Date(Date.UTC(2026, 8, 1 + i, 18)).toISOString(),
        amount: 100,
        method: "TRANSFER",
        reference: `REF-${i}`,
      })),
    );
    const doc = createPaymentReceiptDocument(
      statement({ payments, paidAmount: 4000, balanceDue: 0 }),
    );
    const total = doc.getNumberOfPages();
    const text = doc.output();

    expect(total).toBeGreaterThan(1);
    expect(text).toContain(`gina 1 de ${total}`);
    expect(text).toContain(`gina ${total} de ${total}`);
    expect(text.split("Fecha & Hora").length - 1).toBeGreaterThan(1);
  });

  it("USD, grupo con pendientes y sin datos bancarios ni colores válidos", () => {
    const data = statement({ currency: "USD" });
    data.tour.totalPassengers = 4;
    data.tour.returnDate = null;
    data.agency.bankInfo = null;
    data.agency.primaryColor = "no-es-color";

    const text = pdfText(data);
    expect(text).toContain("Importe \\(USD\\)");
    expect(text).toContain("2 Pendientes de registro");
    expect(text).toContain("Por confirmar");
    expect(text).toContain("medios de pago disponibles");
  });

  it("buildStatementPayments ordena cronológicamente y deriva el concepto", () => {
    const [first, second] = buildStatementPayments([
      { date: "2026-11-12T00:00:00Z", amount: 1, method: "CASH" },
      { date: "2026-11-01T00:00:00Z", amount: 2, method: "CARD" },
    ]);
    expect(first).toMatchObject({ amount: 2, concept: "Anticipo Apartado de Lugares" });
    expect(second).toMatchObject({ amount: 1, concept: "Abono a Cuenta" });
  });
});

/** Operador de relleno que jsPDF escribe para un color (2 decimales por canal). */
const fillOf = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => String(Number((v / 255).toFixed(2)));
  return `${ch((n >> 16) & 255)} ${ch((n >> 8) & 255)} ${ch(n & 255)} rg`;
};

describe("Estado de cuenta PDF: color de acento", () => {
  it("usa el acento de la agencia en las marcas de sección", () => {
    const data = statement();
    data.agency.accentColor = "#dc2626";
    const text = pdfText(data);

    expect(text).toContain(fillOf("#dc2626"));
  });

  it("sin acento usa el color secundario", () => {
    const data = statement();
    data.agency.accentColor = null;
    data.agency.secondaryColor = "#d97706";
    const text = pdfText(data);

    expect(text).not.toContain(fillOf("#dc2626"));
    expect(text).toContain(fillOf("#d97706"));
  });
});

describe("Estado de cuenta PDF: indicaciones del viaje y políticas de la agencia", () => {
  it("texto corto: tarjeta de indicaciones y después la de políticas, sin viñetas forzadas", () => {
    const data = statement();
    data.tour.postPaymentInstructions = "Llevar botas de montaña.\nIdentificación oficial.";
    data.agency.policies = "El anticipo no es reembolsable.\n\nPresentarse 15 minutos antes.";
    const text = pdfText(data);

    const instructionsAt = text.indexOf("INDICACIONES PARA TU VIAJE");
    const policiesAt = text.indexOf("POLÍTICAS DE LA AGENCIA");
    expect(instructionsAt).toBeGreaterThan(-1);
    expect(policiesAt).toBeGreaterThan(instructionsAt);
    expect(text).toContain("Términos y condiciones del servicio contratado");
    // Cada salto de línea del textarea es su propia línea, sin viñetas agregadas.
    expect(printed(text, "(Llevar botas de montaña.)")).toBe(true);
    expect(printed(text, "(Identificación oficial.)")).toBe(true);
    expect(printed(text, "(Presentarse 15 minutos antes.)")).toBe(true);
    expect(text).not.toContain("Guía del viajero");
    expect(text).not.toContain("POLÍTICAS Y CONDICIONES");
  });

  it("la barra lateral usa el acento para indicaciones y el color primario para políticas", () => {
    const data = statement();
    data.agency.primaryColor = "#0ea5e9";
    data.agency.accentColor = "#dc2626";
    data.tour.postPaymentInstructions = "Llevar gorra.";
    data.agency.policies = "Sin reembolsos.";
    const text = pdfText(data);

    const accentBar = text.lastIndexOf(
      fillOf("#dc2626"),
      text.indexOf("INDICACIONES PARA TU VIAJE"),
    );
    const primaryBar = text.lastIndexOf(fillOf("#0ea5e9"), text.indexOf("POLÍTICAS DE LA AGENCIA"));
    expect(accentBar).toBeGreaterThan(-1);
    expect(primaryBar).toBeGreaterThan(text.indexOf("INDICACIONES PARA TU VIAJE"));
  });

  it("sin texto (vacío, solo espacios o nulo) no dibuja las tarjetas", () => {
    const data = statement();
    data.tour.postPaymentInstructions = "   ";
    data.agency.policies = null;
    const text = pdfText(data);

    expect(text).not.toContain("INDICACIONES PARA TU VIAJE");
    expect(text).not.toContain("POLÍTICAS DE LA AGENCIA");
    expect(createPaymentReceiptDocument(data).getNumberOfPages()).toBe(
      createPaymentReceiptDocument(statement()).getNumberOfPages(),
    );
  });

  it("quita los caracteres que la fuente del PDF no puede imprimir (emojis)", () => {
    const data = statement();
    data.agency.policies = "Sin reembolsos 🚫 después del día 7 ✅";
    const text = pdfText(data);

    expect(text).toContain("(Sin reembolsos  después del día 7) Tj");
  });

  it("texto largo: la tarjeta continúa en páginas nuevas sin cortarse ni encimarse con el pie", () => {
    const short = createPaymentReceiptDocument(statement()).getNumberOfPages();
    const data = statement();
    data.agency.policies = Array.from(
      { length: 120 },
      (_, i) => `${i + 1}. Cláusula de prueba número ${i + 1}.`,
    ).join("\n");
    const doc = createPaymentReceiptDocument(data);
    const text = doc.output();

    expect(doc.getNumberOfPages()).toBeGreaterThan(short);
    expect(text).toContain("POLÍTICAS DE LA AGENCIA \\(CONTINUACIÓN\\)");
    expect(text).toContain("1. Cl");
    expect(text).toContain("120. Cl");
    expect(text).toContain(`gina ${doc.getNumberOfPages()} de ${doc.getNumberOfPages()}`);
  });
});
