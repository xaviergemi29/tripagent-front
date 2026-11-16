import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PASSENGER_ROLE } from "@/shared/constants/domain.constants";
import type { TitularRowOutput } from "../../../schemas/tour-dashboard.schema";
import { buildOperatorStatement } from "../../../utils/statement-agency.util";
import { BookingCard } from "../BookingCard";

// Tarjeta de reserva del Centro de Control en celular: hasta el 2026-11-16 los botones de PDF,
// Magic Link y ⋮ no tenían acción.

const copy = vi.fn<(text: string) => Promise<boolean>>(async () => true);
vi.mock("@/shared/utils/clipboard", () => ({ copyToClipboard: (t: string) => copy(t) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const titular = (overrides: Partial<TitularRowOutput> = {}): TitularRowOutput =>
  ({
    id: "11111111-1111-4111-8111-111111111111",
    bookingId: "33333333-3333-4333-8333-333333333333",
    role: PASSENGER_ROLE.TITULAR,
    fullName: "Ana Torres",
    whatsapp: "2281234567",
    groupSize: 1,
    unitPrice: 1500,
    bookingStatus: "PENDING",
    requiredDeposit: 500,
    hasSeatRight: true,
    bookedAt: new Date().toISOString(),
    formStatus: "COMPLETED",
    seatLabel: null,
    boardingPoint: "Plaza Xalapeña",
    boardingPointDetails: null,
    magicToken: "tok123",
    paymentStatus: "PARTIAL",
    paidAmount: 500,
    balance: 1000,
    companions: [],
    payments: [],
    ...overrides,
  }) as TitularRowOutput;

const renderCard = (
  props: Partial<Parameters<typeof BookingCard>[0]> = {},
  data: TitularRowOutput = titular(),
) => {
  const handlers = {
    onAssignSeatClick: vi.fn(),
    onRowClick: vi.fn(),
    onDownloadReceiptClick: vi.fn(),
    onTransferClick: vi.fn(),
  };
  render(<BookingCard titular={data} tourCurrency="MXN" {...handlers} {...props} />);
  return handlers;
};

beforeEach(() => vi.clearAllMocks());

describe("BookingCard (celular): acciones", () => {
  it("descarga el estado de cuenta de la reserva", async () => {
    const h = renderCard();
    await userEvent.click(screen.getByRole("button", { name: "Descargar Comprobante PDF" }));
    expect(h.onDownloadReceiptClick).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: "Ana Torres" }),
    );
  });

  it("sin abonos no ofrece el PDF (misma regla que escritorio)", () => {
    renderCard({}, titular({ paymentStatus: "PENDING", paidAmount: 0, balance: 1500 }));
    expect(screen.queryByRole("button", { name: "Descargar Comprobante PDF" })).toBeNull();
  });

  it("copia el Magic Link del titular", async () => {
    renderCard();
    await userEvent.click(screen.getByRole("button", { name: "Copiar Magic Link" }));
    expect(copy).toHaveBeenCalledWith(expect.stringContaining("/register?token=tok123"));
  });

  it("abre la transferencia de titularidad desde el ⋮", async () => {
    const h = renderCard();
    await userEvent.click(screen.getByRole("button", { name: "Más acciones del titular" }));
    await userEvent.click(await screen.findByText("Transferir titularidad"));
    expect(h.onTransferClick).toHaveBeenCalledTimes(1);
  });

  it("registrar abonos abre el detalle de la reserva", async () => {
    const h = renderCard();
    await userEvent.click(screen.getByRole("button", { name: "Registrar abonos y pagos" }));
    expect(h.onRowClick).toHaveBeenCalledWith("11111111-1111-4111-8111-111111111111");
  });

  it("Modo Auditoría: sin transferencia", () => {
    renderCard({ isAuditMode: true });
    expect(screen.queryByRole("button", { name: "Más acciones del titular" })).toBeNull();
  });

  it("un nombre largo hace salto de línea y el estado de pago no se recorta", () => {
    renderCard({}, titular({ fullName: "JOSE XAVIER RAMOS GONZALEZ DE LA SIERRA" }));
    expect(screen.getByText("JOSE XAVIER RAMOS GONZALEZ DE LA SIERRA")).toHaveClass(
      "break-words",
      "line-clamp-2",
    );
    expect(screen.getByText("ABONO PARCIAL")).toHaveClass("whitespace-nowrap");
    expect(screen.getByText(/^Debe:/)).toHaveClass("whitespace-nowrap");
  });
});

describe("buildOperatorStatement", () => {
  it("solo incluye abonos válidos: sin reembolsos ni el abono anulado", () => {
    const pdf = buildOperatorStatement(
      titular({
        payments: [
          {
            id: "p1",
            type: "PAYMENT",
            amount: 500,
            method: "CASH",
            createdAt: "2026-11-01T10:00:00Z",
            referenceInfo: null,
          },
          {
            id: "p2",
            type: "PAYMENT",
            amount: 300,
            method: "TRANSFER",
            createdAt: "2026-11-02T10:00:00Z",
            referenceInfo: "SPEI 1",
          },
          {
            id: "v1",
            type: "REFUND",
            amount: -300,
            method: "TRANSFER",
            createdAt: "2026-11-03T10:00:00Z",
            referenceInfo: "Anulación (Ref: p2)",
          },
        ] as TitularRowOutput["payments"],
      }),
      {
        agency: { name: "Brújula" } as never,
        tourTitle: "Zacatlán",
        tourDepartureDate: "2026-11-14",
        tourCurrency: "MXN",
      },
    );

    expect(pdf.financials.payments.map((p) => p.id)).toEqual(["p1"]);
    expect(pdf.passengers[0]).toMatchObject({ fullName: "Ana Torres", isMainPassenger: true });
    expect(pdf.tour).toMatchObject({ title: "Zacatlán", returnDate: null });
  });
});
