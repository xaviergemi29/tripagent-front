import { describe, expect, it } from "vitest";
import { buildBookingWhatsAppUrl, type BookingWhatsAppParams } from "../booking-whatsapp.util";

const base: BookingWhatsAppParams = {
  phone: "+522281234567",
  travelerName: "Ana Torres",
  tourName: "Zacatlán de las manzanas",
  magicLinkUrl: "https://app.test/register?token=abc",
  requiredDeposit: 1500,
  currency: "MXN",
};

/** Separa la URL y decodifica el parámetro `text`. */
const parse = (params: Partial<BookingWhatsAppParams> = {}) => {
  const url = buildBookingWhatsAppUrl({ ...base, ...params });
  expect(url).not.toBeNull();
  const [origin, query] = url!.split("?text=");
  return { origin, text: decodeURIComponent(query ?? "") };
};

describe("buildBookingWhatsAppUrl", () => {
  it("E.164 mexicano → wa.me/52…", () => {
    expect(parse().origin).toBe("https://wa.me/522281234567");
  });

  it("registro anterior de 10 dígitos → antepone 52", () => {
    expect(parse({ phone: "2281234567" }).origin).toBe("https://wa.me/522281234567");
  });

  it("número de otro país conserva su lada", () => {
    expect(parse({ phone: "+12125551234" }).origin).toBe("https://wa.me/12125551234");
  });

  it("teléfono vacío o sin dígitos → null", () => {
    expect(buildBookingWhatsAppUrl({ ...base, phone: "" })).toBeNull();
    expect(buildBookingWhatsAppUrl({ ...base, phone: null })).toBeNull();
    expect(buildBookingWhatsAppUrl({ ...base, phone: "Sin teléfono" })).toBeNull();
  });

  it("incluye saludo, tour, Magic Link y anticipo en MXN y USD", () => {
    const mxn = parse().text;
    expect(mxn).toContain("¡Hola Ana Torres!");
    expect(mxn).toContain("Zacatlán de las manzanas");
    expect(mxn).toContain("https://app.test/register?token=abc");
    expect(mxn).toContain("el anticipo es de $1,500.00 MXN");
    expect(parse({ currency: "USD", requiredDeposit: 300 }).text).toContain("$300.00 USD");
  });

  it("con banco completo agrega Banco, Titular y CLABE agrupada, sin tarjeta", () => {
    const { text } = parse({
      bankDetails: {
        bankName: "BBVA",
        bankAccountHolder: "Brújula Tours",
        clabeNumber: "012345678901234567",
      },
    });
    expect(text).toContain("Datos para transferencia:");
    expect(text).toContain("Banco: BBVA");
    expect(text).toContain("Titular: Brújula Tours");
    expect(text).toContain("CLABE: 012 345 67890123456 7");
  });

  it("sin CLABE no hay bloque de transferencia ni 'undefined'", () => {
    const { text } = parse({ bankDetails: { bankName: "BBVA", bankAccountHolder: null } });
    expect(text).not.toContain("transferencia");
    expect(text).not.toContain("BBVA");
    expect(text).not.toMatch(/undefined|null/);
  });

  it("omite las líneas bancarias que faltan", () => {
    const { text } = parse({ bankDetails: { clabeNumber: "012345678901234567" } });
    expect(text).toContain("CLABE:");
    expect(text).not.toContain("Banco:");
    expect(text).not.toContain("Titular:");
  });

  it("registro pendiente (por defecto): pide registrar acompañantes y punto de abordaje", () => {
    const { text } = parse();
    expect(text).toContain("Ya apartamos tus lugares");
    expect(text).toContain("registrar los datos de tus acompañantes");
    expect(text).not.toContain("comprobante");
  });

  it("reserva PENDING (isRegistered): se enfoca en el pago, sin pedir el registro", () => {
    const { text } = parse({
      isRegistered: true,
      bankDetails: { bankName: "BBVA", clabeNumber: "012345678901234567" },
    });
    expect(text).toContain("Gracias por completar tu registro");
    expect(text).toContain("solo falta tu anticipo de $1,500.00 MXN");
    expect(text).toContain("estado de cuenta");
    expect(text).toContain("https://app.test/register?token=abc");
    expect(text).toContain("Banco: BBVA");
    expect(text).toContain("envíanos tu comprobante");
    expect(text).not.toContain("registrar los datos");
  });

  it("reserva PENDING sin anticipo por cubrir no muestra $0.00", () => {
    const { text } = parse({ isRegistered: true, requiredDeposit: 0 });
    expect(text).toContain("solo falta tu pago");
    expect(text).not.toContain("$0.00");
  });

  it("anticipo 0 o negativo se omite", () => {
    expect(parse({ requiredDeposit: 0 }).text).not.toMatch(/anticipo|\$0\.00/);
    expect(parse({ requiredDeposit: -5 }).text).not.toContain("anticipo");
  });
});
