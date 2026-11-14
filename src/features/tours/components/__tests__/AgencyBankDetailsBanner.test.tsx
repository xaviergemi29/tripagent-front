import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgencyBankDetailsBanner } from "../AgencyBankDetailsBanner";

const bank = { bankName: "BBVA", accountHolder: "Bruji Tours SA", clabe: "012180001234567891" };

describe("Datos bancarios de la agencia en el formulario de tour", () => {
  it("sin tarjeta (opcional): no muestra el recuadro ni 'No registrado'", () => {
    render(<AgencyBankDetailsBanner {...bank} cardNumber={null} />);

    expect(screen.getByText("012180001234567891")).toBeInTheDocument();
    expect(screen.queryByText("Número de Tarjeta")).not.toBeInTheDocument();
    expect(screen.queryByText("No registrado")).not.toBeInTheDocument();
  });

  it("con tarjeta: la muestra", () => {
    render(<AgencyBankDetailsBanner {...bank} cardNumber="4111111111111111" />);

    expect(screen.getByText("Número de Tarjeta")).toBeInTheDocument();
    expect(screen.getByText("4111111111111111")).toBeInTheDocument();
  });

  it("solo con tarjeta no cuenta como cuentas configuradas", () => {
    render(<AgencyBankDetailsBanner cardNumber="4111111111111111" />);

    expect(
      screen.getByText("Aún no has configurado las cuentas bancarias oficiales de tu agencia."),
    ).toBeInTheDocument();
  });
});
