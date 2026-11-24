import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AgencyBankDetailsBanner } from "../AgencyBankDetailsBanner";

const bbva = {
  bankName: "BBVA",
  accountHolder: "Bruji Tours SA",
  clabeNumber: "012180001234567891",
  cardNumber: null,
};

describe("Cuentas bancarias de la agencia en el formulario de tour", () => {
  it("una cuenta sin tarjeta (opcional): banco, titular y CLABE, sin fila de tarjeta", () => {
    render(<AgencyBankDetailsBanner bankAccounts={[bbva]} />);

    expect(screen.getByText("BBVA")).toBeInTheDocument();
    expect(screen.getByText("Bruji Tours SA")).toBeInTheDocument();
    expect(screen.getByText("CLABE 012 180 00123456789 1")).toBeInTheDocument();
    expect(screen.queryByText(/Tarjeta/)).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("varias cuentas: todas en su orden, la tarjeta enmascarada y sin capturar como texto", () => {
    render(
      <AgencyBankDetailsBanner
        bankAccounts={[
          bbva,
          {
            bankName: "",
            accountHolder: "",
            clabeNumber: "002180700123456789",
            cardNumber: "4111111111111111",
          },
        ]}
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]!).getByText("BBVA")).toBeInTheDocument();
    expect(within(items[1]!).getByText("Banco sin capturar")).toBeInTheDocument();
    expect(within(items[1]!).getByText("Titular sin capturar")).toBeInTheDocument();
    expect(within(items[1]!).getByText("Tarjeta •••• 1111")).toBeInTheDocument();
  });

  it("sin cuentas avisa y, sin `onConfigure`, enlaza a Configuración", () => {
    render(<AgencyBankDetailsBanner bankAccounts={[]} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Aún no has configurado tu cuenta bancaria. Tus viajeros no verán a dónde transferir hasta que la agregues.",
    );
    expect(screen.getByRole("link", { name: "Configurar cuenta ahora" })).toHaveAttribute(
      "href",
      "/settings",
    );
  });

  it('"Configurar cuenta ahora" abre el modal cuando se le pasa `onConfigure`', async () => {
    const onConfigure = vi.fn();
    render(<AgencyBankDetailsBanner bankAccounts={[]} onConfigure={onConfigure} />);

    await userEvent.click(screen.getByRole("button", { name: "Configurar cuenta ahora" }));
    expect(onConfigure).toHaveBeenCalledTimes(1);
  });
});
