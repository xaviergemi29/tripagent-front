import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterPaymentModal } from "../RegisterPaymentModal";

// El abono se registra por el monto capturado (no por el saldo que trae por defecto). En tours USD
// (RB-PAG-004) se capturan los pesos y el tipo de cambio, y los dólares se calculan y se ajustan.

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

  describe("tours en USD (RB-PAG-004)", () => {
    const openUsd = (props: Partial<Parameters<typeof RegisterPaymentModal>[0]> = {}) =>
      render(
        <RegisterPaymentModal
          isOpen
          onClose={vi.fn()}
          bookingId="b1"
          tourId="t1"
          tourCurrency="USD"
          balance={2000}
          holderName="Ana Torres"
          {...props}
        />,
      );
    const fillUsd = async (mxn: string, rate: string, refund = false) => {
      const user = userEvent.setup();
      await user.type(
        await screen.findByLabelText(refund ? /Monto devuelto/ : /Monto recibido/),
        mxn,
      );
      await user.type(screen.getByLabelText(/Tipo de cambio aplicado/), rate);
      return user;
    };

    it("muestra al titular, el saldo y los campos en orden: pesos → tipo de cambio → tarjeta USD", async () => {
      openUsd();
      expect(await screen.findByText("Ana Torres")).toBeInTheDocument();
      expect(screen.getByText("Saldo pendiente actual:")).toBeInTheDocument();
      const mxn = screen.getByLabelText(/1\. Monto recibido/);
      const rate = screen.getByLabelText(/2\. Tipo de cambio aplicado/);
      const usd = screen.getByLabelText(/3\. Monto a acreditar/);
      expect(mxn.compareDocumentPosition(rate) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(rate.compareDocumentPosition(usd) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      // Campos vacíos (sin montos de ejemplo) y guardar deshabilitado.
      expect((mxn as HTMLInputElement).value).toBe("");
      expect((rate as HTMLInputElement).value).toBe("");
      expect(usd).toHaveTextContent("$0.00 USD");
      expect(screen.getByRole("button", { name: /Guardar Abono/ })).toBeDisabled();
    });

    it("calcula en vivo los USD y el desglose de saldos, y envía lo capturado", async () => {
      openUsd();
      const user = await fillUsd("20000", "18");
      expect(screen.getByLabelText(/3\. Monto a acreditar/)).toHaveTextContent("$1,111.11 USD");
      expect(screen.getByText("Cálculo en vivo")).toBeInTheDocument();
      expect(screen.getByTestId("usd-summary")).toHaveTextContent(
        "Recibes $20,000.00 MXN a T.C. $18.00 → Se abonan $1,111.11 USD.",
      );
      expect(screen.getByText("-$1,111.11 USD")).toBeInTheDocument();
      expect(screen.getByText("$888.89 USD")).toBeInTheDocument(); // nuevo saldo

      await user.click(screen.getByRole("button", { name: /Guardar Abono/ }));
      expect(createPayment.mock.calls[0]![0].payload).toEqual({
        amount: 1111.11,
        currency: "USD",
        method: "TRANSFER",
        type: "PAYMENT",
        referenceInfo: "",
        collectedAmount: 20000,
        collectedCurrency: "MXN",
        exchangeRate: 18,
      });
    });

    it("ajustar centavos: se conserva hasta cambiar los pesos o el tipo de cambio", async () => {
      openUsd();
      const user = await fillUsd("5000", "19.30");
      expect(screen.getByLabelText(/3\. Monto a acreditar/)).toHaveTextContent("$259.07 USD");

      await user.click(screen.getByRole("button", { name: /Ajustar centavos/ }));
      const usd = screen.getByLabelText(/3\. Monto a acreditar/) as HTMLInputElement;
      await user.clear(usd);
      await user.type(usd, "260");
      expect(screen.getByText("Ajustado a mano")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Volver al cálculo/ })).toHaveTextContent(
        "$259.07 USD",
      );

      await user.click(screen.getByRole("button", { name: /Guardar Abono/ }));
      expect(createPayment.mock.calls[0]![0].payload).toMatchObject({
        amount: 260,
        collectedAmount: 5000,
        exchangeRate: 19.3,
      });

      // Cambiar el tipo de cambio vuelve al cálculo: 5,000 / 19.5 = 256.41.
      const rate = screen.getByLabelText(/Tipo de cambio aplicado/);
      await user.clear(rate);
      await user.type(rate, "19.5");
      expect(screen.getByLabelText(/3\. Monto a acreditar/)).toHaveTextContent("$256.41 USD");
    });

    it("«Volver al cálculo» restaura los USD calculados", async () => {
      openUsd();
      const user = await fillUsd("5000", "19.30");
      await user.click(screen.getByRole("button", { name: /Ajustar centavos/ }));
      const usd = screen.getByLabelText(/3\. Monto a acreditar/);
      await user.clear(usd);
      await user.type(usd, "260");
      await user.click(screen.getByRole("button", { name: /Volver al cálculo/ }));
      expect(screen.getByLabelText(/3\. Monto a acreditar/)).toHaveTextContent("$259.07 USD");
    });

    it("acepta 4 decimales en el tipo de cambio y rechaza 5", async () => {
      openUsd();
      const user = await fillUsd("1000", "19.35401");
      await user.click(screen.getByRole("button", { name: /Guardar Abono/ }));
      expect(await screen.findByText("Máximo 4 decimales")).toBeInTheDocument();
      expect(createPayment).not.toHaveBeenCalled();
    });

    it("los USD finales no pueden superar el saldo pendiente en USD", async () => {
      openUsd();
      const user = await fillUsd("60000", "19");
      await user.click(screen.getByRole("button", { name: /Guardar Abono/ }));
      expect(
        await screen.findByText("El abono no puede superar el saldo pendiente de $2,000.00 USD"),
      ).toBeInTheDocument();
      expect(createPayment).not.toHaveBeenCalled();
    });

    it("reembolso: pesos devueltos → se descuentan dólares", async () => {
      openUsd({ balance: 500, mode: "REFUND" });
      const user = await fillUsd("1950", "19.5", true);
      expect(screen.getByText("Saldo a reembolsar:")).toBeInTheDocument();
      expect(screen.getByLabelText(/3\. Monto a descontar/)).toHaveTextContent("$100.00 USD");
      expect(screen.getByTestId("usd-summary")).toHaveTextContent(
        "Devuelves $1,950.00 MXN a T.C. $19.50 → Se descuentan $100.00 USD.",
      );
      await user.click(screen.getByRole("button", { name: /Guardar Reembolso/ }));
      expect(createPayment.mock.calls[0]![0].payload).toMatchObject({
        amount: 100,
        type: "REFUND",
        collectedAmount: 1950,
        exchangeRate: 19.5,
      });
    });

    it("MXN: sin pesos, tipo de cambio ni tarjeta USD", async () => {
      open("MXN");
      await screen.findByLabelText(/Monto a abonar/);
      expect(screen.queryByLabelText(/Tipo de cambio aplicado/)).not.toBeInTheDocument();
      expect(screen.queryByText("Saldo pendiente actual:")).not.toBeInTheDocument();
    });
  });
});
