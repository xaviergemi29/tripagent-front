import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BookingSuccessView } from "../BookingSuccessView";

const copy = vi.fn<(text: string) => Promise<boolean>>(async () => true);
vi.mock("@/shared/utils/clipboard", () => ({ copyToClipboard: (t: string) => copy(t) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

/** Payload de PENDING_PAYMENT (`GET /magic-tokens/:token/validate`). */
const booking = (over: Record<string, unknown> = {}) => ({
  bookingId: "booking-1",
  agencyName: "Viajes Xalapa",
  agencyPhone: "2281234567",
  titularName: "Ana Torres",
  passengers: [{ name: "Ana Torres", isTitular: true, boardingPoint: "Plaza (06:00)" }],
  totalAmount: 3000,
  depositAmount: 500,
  acceptsBankTransfer: true,
  bankName: "BBVA",
  accountHolder: "Viajes Xalapa SA",
  clabeNumber: "012345678901234567",
  cardNumber: "4152313412345678",
  acceptsCreditCard: false,
  acceptsCash: false,
  cashInstructions: null,
  ...over,
});

const renderView = (over?: Record<string, unknown>) =>
  render(
    <BookingSuccessView
      booking={booking(over)}
      tourInfo={{ title: "Cuetzalan", departureDateTime: "2026-12-20", currency: "MXN" }}
      titularName="Ana Torres"
    />,
  );

describe("BookingSuccessView: métodos y opciones de pago", () => {
  it("muestra la CLABE y el número de tarjeta formateados y copia los dígitos", async () => {
    renderView();

    expect(screen.getByText("012 345 67890123456 7")).toBeInTheDocument();
    expect(screen.getByText("4152 3134 1234 5678")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Copiar Número de Tarjeta" }));
    await waitFor(() => expect(copy).toHaveBeenCalledWith("4152313412345678"));
  });

  it("sin tarjeta no muestra la fila; solo con tarjeta sí muestra la transferencia", () => {
    const { unmount } = renderView({ cardNumber: null });
    expect(screen.getByText("CLABE Interbancaria")).toBeInTheDocument();
    expect(screen.queryByText("Número de Tarjeta")).not.toBeInTheDocument();
    unmount();

    renderView({ clabeNumber: null });
    expect(screen.queryByText("CLABE Interbancaria")).not.toBeInTheDocument();
    expect(screen.getByText("4152 3134 1234 5678")).toBeInTheDocument();
  });

  it("transferencia sin CLABE: botón para pedir los datos por WhatsApp en lugar de un bloque vacío (OBS-038)", () => {
    renderView({ clabeNumber: null, cardNumber: null });

    expect(screen.queryByText("CLABE Interbancaria")).not.toBeInTheDocument();
    const link = screen.getByRole("link", {
      name: "Contactar a la agencia por WhatsApp para pedir datos de transferencia",
    });
    expect(link.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/522281234567\?text=/);
    expect(decodeURIComponent(link.getAttribute("href") ?? "")).toContain("Cuetzalan");
    // Ya no cae en el aviso genérico de "sin métodos de pago".
    expect(
      screen.queryByText(/para recibir las instrucciones y opciones de pago/),
    ).not.toBeInTheDocument();
  });

  it("con CLABE no muestra el botón de pedir datos", () => {
    renderView();
    expect(
      screen.queryByRole("link", {
        name: "Contactar a la agencia por WhatsApp para pedir datos de transferencia",
      }),
    ).not.toBeInTheDocument();
  });

  it("tarjeta: sin enlace de pago, ofrece contactar a la agencia por WhatsApp (2026-11-22)", () => {
    // Solo tarjeta: el bloque de pagos no queda vacío.
    renderView({ acceptsBankTransfer: false, acceptsCreditCard: true });

    expect(screen.getByText("Pago con tarjeta")).toBeInTheDocument();
    const link = screen.getByRole("link", {
      name: "Contactar a la agencia por WhatsApp para pagar con tarjeta",
    });
    expect(link.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/522281234567\?text=/);
    expect(decodeURIComponent(link.getAttribute("href") ?? "")).toContain(
      'quiero pagar con tarjeta mi reservación para "Cuetzalan"',
    );
    expect(
      screen.queryByText(/para recibir las instrucciones y opciones de pago/),
    ).not.toBeInTheDocument();
  });

  it("sin tarjeta aceptada no muestra la opción de tarjeta", () => {
    renderView();
    expect(screen.queryByText("Pago con tarjeta")).not.toBeInTheDocument();
  });
});
