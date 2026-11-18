import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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

  it("solo con tarjeta no cuenta como cuenta configurada", () => {
    render(<AgencyBankDetailsBanner cardNumber="4111111111111111" />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Aún no has configurado tu cuenta bancaria. Tus viajeros no verán a dónde transferir hasta que la agregues.",
    );
  });

  it("con banco y titular pero sin CLABE también avisa (OBS-038)", () => {
    render(<AgencyBankDetailsBanner bankName="BBVA" accountHolder="Bruji Tours SA" clabe={null} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Aún no has configurado tu cuenta bancaria",
    );
    // Sin `onConfigure`, el botón es un enlace a Configuración.
    expect(screen.getByRole("link", { name: "Configurar cuenta ahora" })).toHaveAttribute(
      "href",
      "/settings",
    );
  });

  it('"Configurar cuenta ahora" abre el modal cuando se le pasa `onConfigure`', async () => {
    const onConfigure = vi.fn();
    render(<AgencyBankDetailsBanner clabe="" onConfigure={onConfigure} />);

    await userEvent.click(screen.getByRole("button", { name: "Configurar cuenta ahora" }));
    expect(onConfigure).toHaveBeenCalledTimes(1);
  });
});
