import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BookingSuccessView } from "../BookingSuccessView";

const copy = vi.fn<(text: string) => Promise<boolean>>(async () => true);
vi.mock("@/shared/utils/clipboard", () => ({ copyToClipboard: (t: string) => copy(t) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const BBVA = {
  bankName: "BBVA",
  accountHolder: "Viajes Xalapa SA",
  clabeNumber: "012345678901234567",
  cardNumber: "4152313412345678",
};
const SANTANDER = {
  bankName: "Santander",
  accountHolder: "Ana Torres",
  clabeNumber: "014180655012345678",
  cardNumber: null,
};

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
  bankAccounts: [BBVA],
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

  it("una cuenta sin tarjeta no muestra la fila de tarjeta", () => {
    renderView({ bankAccounts: [{ ...BBVA, cardNumber: null }] });
    expect(screen.getByText("CLABE Interbancaria")).toBeInTheDocument();
    expect(screen.queryByText("Número de Tarjeta")).not.toBeInTheDocument();
    expect(screen.queryByText(/cualquiera de estas cuentas/)).not.toBeInTheDocument();
  });

  it("dos cuentas: cada una en su bloque, en orden, con su propio botón de copiar", async () => {
    renderView({ bankAccounts: [BBVA, SANTANDER] });

    expect(
      screen.getByText("Puedes transferir a cualquiera de estas cuentas."),
    ).toBeInTheDocument();
    const first = screen.getByRole("listitem", { name: "Cuenta 1: BBVA" });
    const second = screen.getByRole("listitem", { name: "Cuenta 2: Santander" });
    expect(within(first).getByText("4152 3134 1234 5678")).toBeInTheDocument();
    expect(within(second).getByText("014 180 65501234567 8")).toBeInTheDocument();
    expect(within(second).queryByText("Número de Tarjeta")).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Copiar CLABE Interbancaria de la cuenta 2" }),
    );
    await waitFor(() => expect(copy).toHaveBeenCalledWith("014180655012345678"));
  });

  it("cuenta migrada sin banco ni titular: textos de respaldo, sin huecos", () => {
    renderView({ bankAccounts: [{ ...SANTANDER, bankName: "", accountHolder: "" }] });
    expect(screen.getByText("Banco sin capturar")).toBeInTheDocument();
    expect(screen.getByText("Titular sin capturar")).toBeInTheDocument();
  });

  it("con cuentas no muestra el botón de pedir datos", () => {
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

describe("BookingSuccessView: solo pasajeros vigentes", () => {
  it("no lista a un acompañante dado de baja y cuenta solo a los activos", () => {
    renderView({
      titularName: "Nuevo Titular",
      passengers: [
        { name: "Eva Torres", isTitular: false, boardingPoint: null, status: "CANCELLED" },
        { name: "Nuevo Titular", isTitular: true, boardingPoint: null, status: "ACTIVE" },
      ],
    });

    expect(screen.getByText("Nuevo Titular")).toBeInTheDocument();
    expect(screen.queryByText("Eva Torres")).not.toBeInTheDocument();
    expect(screen.getByText("Viajeros Registrados (1)")).toBeInTheDocument();
  });

  it("varios acompañantes con baja de uno: titular primero y conteo de activos", () => {
    renderView({
      passengers: [
        { name: "Luis Torres", isTitular: false, boardingPoint: null, status: "ACTIVE" },
        { name: "Eva Torres", isTitular: false, boardingPoint: null, status: "CANCELLED" },
        { name: "Ana Torres", isTitular: true, boardingPoint: null, status: "ACTIVE" },
      ],
    });

    expect(screen.queryByText("Eva Torres")).not.toBeInTheDocument();
    expect(screen.getByText("Viajeros Registrados (2)")).toBeInTheDocument();
    const names = screen.getAllByText(/^(Ana|Luis) Torres$/).map((el) => el.textContent);
    expect(names).toEqual(["Ana Torres", "Luis Torres"]);
  });
});
