import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaidBookingView } from "../PaidBookingView";
import { PartialPaymentView } from "../PartialPaymentView";
import type { StatementPDFData } from "@/features/statements/pdf/payment-receipt.pdf";

const generate = vi.fn<(data: StatementPDFData) => Promise<void>>();
vi.mock("@/features/statements/pdf/payment-receipt.pdf", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/statements/pdf/payment-receipt.pdf")>()),
  generatePartialPaymentReceiptPDF: (data: StatementPDFData) => generate(data),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

/** Payload compartido de PARTIAL_PAYMENT / PAID (`GET /magic-tokens/:token/validate`). */
const payload = (amountPaid: number) => ({
  bookingId: "booking-1",
  bookingStatus: "CONFIRMED",
  tourInfo: {
    title: "Zacatlán de las Manzanas",
    departureDateTime: "2026-11-14",
    returnDate: "2026-11-15",
    currency: "MXN" as const,
    postPaymentInstructions: "Llevar botas de montaña.",
  },
  groupSize: 3,
  financials: {
    totalAmount: 4000,
    amountPaid,
    remainingBalance: 4000 - amountPaid,
    status: amountPaid >= 4000 ? "PAID" : "PARTIAL",
  },
  paymentHistory: [
    { id: "p2", date: "2026-11-12T19:10:00Z", amount: 1000, method: "CASH", reference: null },
    {
      id: "p1",
      date: "2026-11-01T19:10:00Z",
      amount: amountPaid - 1000,
      method: "TRANSFER",
      reference: "SPEI",
    },
  ],
  passengers: [
    {
      name: "Luis Torres",
      type: "Acompañante",
      isTitular: false,
      status: "ACTIVE" as const,
      seatLabel: null,
      phone: null,
      boardingPoint: "bp-1",
      boardingPointDetails: { location: "Plaza Central", time: "06:00" },
    },
    {
      name: "Eva Torres",
      type: "Acompañante",
      isTitular: false,
      status: "CANCELLED" as const,
      seatLabel: null,
      phone: null,
      boardingPoint: null,
      boardingPointDetails: null,
    },
    {
      name: "Ana Torres",
      type: "Titular",
      isTitular: true,
      status: "ACTIVE" as const,
      seatLabel: "12",
      phone: "2281234567",
      boardingPoint: "bp-1",
      boardingPointDetails: { location: "Plaza Central", time: "06:00" },
    },
  ],
  agency: {
    name: "Bruji Tours",
    phone: "2288492011",
    email: "hola@brujitours.mx",
    address: null,
    bankName: "BBVA",
    accountHolder: "Bruji Tours SA",
    clabeNumber: "012180001234567891",
    cardNumber: "4152313412345678",
    logoPath: "/uploads/logos/agency-1.png",
    primaryColor: "#059669",
    secondaryColor: "#047857",
    accentColor: "#dc2626",
    policies: "El anticipo no es reembolsable.",
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  generate.mockResolvedValue();
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3001/api");
});

const downloadButton = () =>
  screen.getByRole("button", { name: /Descargar Estado de Cuenta en PDF/ });

describe("Descargar Estado de Cuenta en PDF (Magic Link)", () => {
  it("PaidBookingView (liquidado) muestra el botón y genera el estado de cuenta completo", async () => {
    const user = userEvent.setup();
    render(<PaidBookingView {...payload(4000)} />);

    await user.click(downloadButton());

    await waitFor(() => expect(generate).toHaveBeenCalledTimes(1));
    const data = generate.mock.calls[0]![0];
    expect(data.financials).toMatchObject({ totalAmount: 4000, paidAmount: 4000, balanceDue: 0 });
    // Pasajeros activos, titular primero; abonos en orden cronológico con concepto.
    expect(data.passengers.map((p) => p.fullName)).toEqual(["Ana Torres", "Luis Torres"]);
    expect(data.passengers[0]).toMatchObject({ seatNumber: "12", pickupTime: "06:00" });
    expect(data.financials.payments.map((p) => p.concept)).toEqual([
      "Anticipo Apartado de Lugares",
      "Abono a Cuenta",
    ]);
    expect(data.tour).toMatchObject({
      totalPassengers: 3,
      registeredPassengers: 2,
      returnDate: "2026-11-15",
    });
    expect(data.agency).toMatchObject({
      accentColor: "#dc2626",
      logoUrl: "http://localhost:3001/public/uploads/logos/agency-1.png",
    });
    // Logística del tour y reglas legales de la agencia viajan por separado.
    expect(data.tour.postPaymentInstructions).toBe("Llevar botas de montaña.");
    expect(data.agency.policies).toBe("El anticipo no es reembolsable.");
  });

  it("PartialPaymentView (abono parcial) usa el mismo mapeo", async () => {
    const user = userEvent.setup();
    render(<PartialPaymentView {...payload(2000)} />);

    await user.click(downloadButton());

    await waitFor(() => expect(generate).toHaveBeenCalledTimes(1));
    const data = generate.mock.calls[0]![0];
    expect(data.financials).toMatchObject({ paidAmount: 2000, balanceDue: 2000 });
    // Solo banco, titular y CLABE: el número de tarjeta nunca llega al PDF del cliente.
    expect(data.agency.bankInfo).toEqual({
      bankName: "BBVA",
      accountHolder: "Bruji Tours SA",
      clabe: "012180001234567891",
    });
    expect(data.agency.policies).toBe("El anticipo no es reembolsable.");
    expect(data.tour.postPaymentInstructions).toBe("Llevar botas de montaña.");
  });
});

describe("PartialPaymentView: Dónde hacer tus próximos pagos", () => {
  it("muestra la CLABE y el número de tarjeta de la agencia formateados", () => {
    render(<PartialPaymentView {...payload(2500)} />);

    expect(screen.getByText("012 180 00123456789 1")).toBeInTheDocument();
    expect(screen.getByText("4152 3134 1234 5678")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copiar Número de Tarjeta" })).toBeInTheDocument();
  });

  it("solo con tarjeta (sin CLABE) también muestra la sección", () => {
    const data = payload(2500);
    render(<PartialPaymentView {...data} agency={{ ...data.agency, clabeNumber: null }} />);

    expect(screen.getByText("Dónde hacer tus próximos pagos")).toBeInTheDocument();
    expect(screen.queryByText("CLABE Interbancaria")).not.toBeInTheDocument();
    expect(screen.getByText("4152 3134 1234 5678")).toBeInTheDocument();
  });
});
