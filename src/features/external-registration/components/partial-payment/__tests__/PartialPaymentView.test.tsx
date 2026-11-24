import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PartialPaymentView } from "../../PartialPaymentView";
import type { PartialPaymentViewProps } from "../types";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

/** Payload de PARTIAL_PAYMENT (`GET /magic-tokens/:token/validate`) con ajustes por caso. */
const renderView = (overrides: Partial<PartialPaymentViewProps> = {}) =>
  render(
    <PartialPaymentView
      bookingId="booking-1"
      bookingStatus="CONFIRMED"
      tourInfo={{ title: "Zacatlán", departureDateTime: "2026-12-14", currency: "MXN" }}
      groupSize={1}
      financials={{
        totalAmount: 3000,
        amountPaid: 1000,
        remainingBalance: 2000,
        status: "PARTIAL",
      }}
      paymentHistory={[]}
      passengers={[
        {
          name: "Ana Torres",
          type: "Titular",
          isTitular: true,
          status: "ACTIVE",
          boardingPointDetails: { location: "Plaza Central", time: "06:00" },
        },
      ]}
      agency={{
        name: "Bruji Tours",
        phone: "+522288492011",
        bankName: "BBVA",
        accountHolder: "Bruji Tours SA",
        clabeNumber: "012180001234567891",
      }}
      {...overrides}
    />,
  );

describe("PartialPaymentView: insignia del grupo según el estado de la reserva", () => {
  it("CONFIRMED: 'Confirmados'", () => {
    renderView();
    expect(screen.getByText("Confirmados")).toBeInTheDocument();
    expect(screen.queryByText("Por confirmar")).not.toBeInTheDocument();
  });

  it("PENDING (anticipo sin cubrir): 'Por confirmar', nunca 'Confirmados'", () => {
    renderView({ bookingStatus: "PENDING" });
    expect(screen.getByText("Por confirmar")).toBeInTheDocument();
    expect(screen.queryByText("Confirmados")).not.toBeInTheDocument();
  });
});

describe("PartialPaymentView: porcentaje cubierto", () => {
  it("total $0 sin saldo: 100 % pagado y 100 % liquidado (no '0 % liquidado')", () => {
    renderView({
      financials: { totalAmount: 0, amountPaid: 0, remainingBalance: 0, status: "PAID" },
    });
    expect(screen.getByText("Viaje 100% pagado")).toBeInTheDocument();
    expect(screen.getByText("100% liquidado")).toBeInTheDocument();
  });

  it("con saldo nunca redondea a 100 %", () => {
    renderView({
      financials: { totalAmount: 1000, amountPaid: 996, remainingBalance: 4, status: "PARTIAL" },
    });
    expect(screen.getByText("99% liquidado")).toBeInTheDocument();
    expect(screen.queryByText("100% liquidado")).not.toBeInTheDocument();
  });
});

describe("PartialPaymentView: abonos en orden cronológico (como el PDF)", () => {
  it("numera 'Abono N' por fecha aunque la API los envíe en otro orden", () => {
    renderView({
      paymentHistory: [
        { id: "p2", date: "2026-11-12T19:10:00Z", amount: 300, method: "CASH", reference: null },
        {
          id: "p1",
          date: "2026-11-01T19:10:00Z",
          amount: 700,
          method: "TRANSFER",
          reference: null,
        },
      ],
    });
    const first = screen.getByText(/Abono 1 •/).closest("div.flex.items-center.justify-between");
    const second = screen.getByText(/Abono 2 •/).closest("div.flex.items-center.justify-between");
    expect(within(first as HTMLElement).getByText(/\+\$700\.00/)).toBeInTheDocument();
    expect(within(second as HTMLElement).getByText(/\+\$300\.00/)).toBeInTheDocument();
  });
});

describe("PartialPaymentView: enviar comprobante por WhatsApp", () => {
  it("con teléfono de la agencia muestra el botón", () => {
    renderView();
    expect(
      screen.getByRole("button", { name: /Enviar comprobante por WhatsApp/ }),
    ).toBeInTheDocument();
  });

  it("sin teléfono de la agencia no ofrece un enlace wa.me vacío", () => {
    renderView({
      agency: {
        name: "Bruji Tours",
        phone: "",
        bankName: "BBVA",
        accountHolder: "Bruji Tours SA",
        clabeNumber: "012180001234567891",
      },
    });
    expect(
      screen.queryByRole("button", { name: /Enviar comprobante por WhatsApp/ }),
    ).not.toBeInTheDocument();
  });
});
