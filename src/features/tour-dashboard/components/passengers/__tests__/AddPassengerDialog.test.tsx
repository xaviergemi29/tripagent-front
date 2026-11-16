import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TitularRowOutput } from "../../../schemas/tour-dashboard.schema";
import { AddPassengerDialog } from "../AddPassengerDialog";

const titular = { fullName: "Ana Torres", unitPrice: 1500 } as TitularRowOutput;

const renderDialog = (currency: "MXN" | "USD") =>
  render(
    <AddPassengerDialog
      isOpen
      titular={titular}
      tourCurrency={currency}
      onClose={vi.fn()}
      onConfirm={vi.fn()}
    />,
  );

describe("AddPassengerDialog: costo del lugar adicional", () => {
  it.each(["USD", "MXN"] as const)("muestra la divisa %s una sola vez", (currency) => {
    renderDialog(currency);

    const price = screen.getAllByText(`$1,500.00 ${currency}`)[0];
    expect(price.parentElement?.textContent).not.toContain(`${currency} ${currency}`);
    expect(document.body.textContent).not.toContain(`${currency} ${currency}`);
  });
});
