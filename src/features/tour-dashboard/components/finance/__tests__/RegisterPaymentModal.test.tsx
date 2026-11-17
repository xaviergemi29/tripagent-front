import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterPaymentModal } from "../RegisterPaymentModal";

// El abono se registra por el monto capturado (no por el saldo que trae por defecto), y en tours
// USD con el tipo de cambio de lo recibido en pesos.

const createPayment = vi.fn();
vi.mock("@/features/tour-dashboard/hooks/usePayments", () => ({
  useCreatePayment: () => ({ mutate: createPayment, isPending: false }),
}));

const open = (tourCurrency: "MXN" | "USD") =>
  render(
    <RegisterPaymentModal
      isOpen
      onClose={vi.fn()}
      bookingId="b1"
      tourId="t1"
      tourCurrency={tourCurrency}
      balance={3000}
    />,
  );

beforeEach(() => createPayment.mockClear());

describe("RegisterPaymentModal", () => {
  it("MXN: envía el monto capturado, no el saldo", async () => {
    const user = userEvent.setup();
    open("MXN");
    const amount = await screen.findByLabelText(/Monto a abonar/);
    await user.clear(amount);
    await user.type(amount, "500");
    await user.click(screen.getByRole("button", { name: /Guardar Abono/ }));

    expect(createPayment.mock.calls[0]![0]).toMatchObject({
      bookingId: "b1",
      payload: { amount: 500, currency: "MXN", method: "TRANSFER", type: "PAYMENT" },
    });
  });

  it("USD: envía dólares, pesos recibidos y el tipo de cambio", async () => {
    const user = userEvent.setup();
    open("USD");
    const amount = await screen.findByLabelText(/Monto del abono en dólares/);
    await user.clear(amount);
    await user.type(amount, "500");
    await user.type(screen.getByLabelText(/Monto recibido en pesos/), "9000");
    await user.click(screen.getByRole("button", { name: /Guardar Abono/ }));

    expect(createPayment.mock.calls[0]![0].payload).toMatchObject({
      amount: 500,
      currency: "USD",
      collectedAmount: 9000,
      collectedCurrency: "MXN",
      exchangeRate: 18,
    });
  });

  it("al reabrir empieza de nuevo con el saldo, aunque se haya editado antes", async () => {
    const user = userEvent.setup();
    const props = {
      onClose: vi.fn(),
      bookingId: "b1",
      tourId: "t1",
      tourCurrency: "MXN" as const,
      balance: 3000,
    };
    const { rerender } = render(<RegisterPaymentModal isOpen {...props} />);
    const amount = await screen.findByLabelText(/Monto a abonar/);
    await user.clear(amount);
    await user.type(amount, "123");

    rerender(<RegisterPaymentModal isOpen={false} {...props} />);
    rerender(<RegisterPaymentModal isOpen {...props} balance={2500} />);

    expect(await screen.findByLabelText(/Monto a abonar/)).toHaveValue(2500);
  });

  it("una corrección precarga el monto y el método del abono anulado", async () => {
    render(
      <RegisterPaymentModal
        isOpen
        onClose={vi.fn()}
        bookingId="b1"
        tourId="t1"
        tourCurrency="MXN"
        balance={3000}
        correctionData={{ amount: 800, method: "CASH" }}
      />,
    );

    expect(await screen.findByLabelText(/Monto a abonar/)).toHaveValue(800);
    expect(screen.getByRole("radio", { name: /Efectivo/ })).toBeChecked();
  });

  it("USD: el tipo de cambio se actualiza mientras se escribe (useWatch)", async () => {
    const user = userEvent.setup();
    open("USD");
    const amount = await screen.findByLabelText(/Monto del abono en dólares/);
    await user.clear(amount);
    await user.type(amount, "100");
    await user.type(screen.getByLabelText(/Monto recibido en pesos/), "1750");
    expect(screen.getByText("$17.50 MXN / USD")).toBeInTheDocument();

    await user.clear(amount);
    await user.type(amount, "50");
    expect(screen.getByText("$35.00 MXN / USD")).toBeInTheDocument();
  });

  it("al borrar el monto el campo queda vacío (antes se reescribía un 0 y lo escrito se pegaba: 0500)", async () => {
    open("MXN");
    const amount = (await screen.findByLabelText(/Monto a abonar/)) as HTMLInputElement;
    fireEvent.change(amount, { target: { value: "" } });
    expect(amount.value).toBe("");
    fireEvent.change(amount, { target: { value: "5" } });
    expect(amount.value).toBe("5");
  });

  it("un abono mayor al saldo pendiente no se envía y explica el tope (2026-11-17)", async () => {
    const user = userEvent.setup();
    open("MXN"); // saldo pendiente $3,000
    const amount = await screen.findByLabelText(/Monto a abonar/);
    await user.clear(amount);
    await user.type(amount, "5000");
    await user.click(screen.getByRole("button", { name: /Guardar Abono/ }));

    expect(
      await screen.findByText("El abono no puede superar el saldo pendiente de $3,000.00 MXN"),
    ).toBeInTheDocument();
    expect(createPayment).not.toHaveBeenCalled();
  });

  it("corrección: admite hasta el monto anulado aunque el saldo aún no se haya recargado", async () => {
    const user = userEvent.setup();
    render(
      <RegisterPaymentModal
        isOpen
        onClose={vi.fn()}
        bookingId="b1"
        tourId="t1"
        tourCurrency="MXN"
        balance={0}
        correctionData={{ amount: 800, method: "CASH" }}
      />,
    );
    await screen.findByLabelText(/Monto a abonar/);
    await user.click(screen.getByRole("button", { name: /Guardar Abono/ }));

    expect(createPayment.mock.calls[0]![0].payload).toMatchObject({ amount: 800 });
  });
});
