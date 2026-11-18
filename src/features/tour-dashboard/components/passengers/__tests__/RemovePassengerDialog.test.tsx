import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RemovePassengerDialog } from "../RemovePassengerDialog";

/**
 * Baja de un acompañante con retención para la agencia (FLUJO-RES-004 / PQ-C5, 2026-11-17). El
 * desglose es una vista previa; la API aplica la regla (`api:test/financial-flows.test.ts`).
 * nuevo total = total − costo del lugar + retención; lo abonado no cambia.
 */

const renderDialog = (props: {
  unitPrice: number;
  currentTotal: number;
  paidAmount: number;
  seatLabel?: string | null;
  onConfirm?: (penalty: number) => void;
}) =>
  render(
    <RemovePassengerDialog
      isOpen
      onClose={vi.fn()}
      onConfirm={props.onConfirm ?? vi.fn()}
      passengerName="Eva Ruiz"
      seatLabel={props.seatLabel ?? null}
      unitPrice={props.unitPrice}
      currentTotal={props.currentTotal}
      paidAmount={props.paidAmount}
      tourCurrency="MXN"
    />,
  );

// `fireEvent.change` (no `user.type`): en jsdom el campo numérico controlado se revisa por su texto.
const setPenalty = (value: string) =>
  fireEvent.change(screen.getByLabelText("Retención para la agencia (MXN)"), {
    target: { value },
  });

const row = (label: string) => {
  const breakdown = screen.getByLabelText("Desglose de la baja");
  const term = within(breakdown).getByText(label, { exact: false }).closest("div") as HTMLElement;
  return term.textContent ?? "";
};

describe("RemovePassengerDialog: retención para la agencia", () => {
  it("texto: nombre, asiento que se libera y costo del lugar; retención inicial $0", () => {
    renderDialog({ unitPrice: 1000, currentTotal: 3000, paidAmount: 1500, seatLabel: "12" });
    const description = screen.getByText(/deja el grupo/);
    expect(description).toHaveTextContent("Eva Ruiz deja el grupo y su lugar ($1,000.00 MXN)");
    expect(description).toHaveTextContent("El asiento 12 quedará libre.");
    expect(screen.getByLabelText("Retención para la agencia (MXN)")).toHaveValue(null);
  });

  it("Escenario 1: retención de $250 con saldo pendiente → total $2,250 y por cobrar $750", () => {
    renderDialog({ unitPrice: 1000, currentTotal: 3000, paidAmount: 1500 });
    setPenalty("250");
    expect(row("Costo del lugar dado de baja")).toContain("-$1,000.00 MXN");
    expect(row("Retención para la agencia")).toContain("+$250.00 MXN");
    expect(row("Monto no retenido")).toContain("$750.00 MXN");
    expect(row("Monto no retenido")).toContain("Se descuenta del saldo pendiente del grupo");
    expect(row("Nuevo total de la reserva")).toContain("$2,250.00 MXN");
    expect(row("Nuevo saldo por cobrar")).toContain("$750.00 MXN");
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("Escenario 2: retención del 100 % en una reserva liquidada → total $6,000, saldo $0", () => {
    renderDialog({ unitPrice: 2000, currentTotal: 6000, paidAmount: 6000 });
    setPenalty("2000");
    expect(row("Monto no retenido")).toContain("$0.00 MXN");
    expect(row("Monto no retenido")).toContain("La agencia retiene el lugar completo");
    expect(row("Nuevo total de la reserva")).toContain("$6,000.00 MXN");
    expect(row("Nuevo saldo por cobrar")).toContain("$0.00 MXN");
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("Escenario 3: sin retención → total $2,000 y por cobrar $1,000", () => {
    renderDialog({ unitPrice: 1000, currentTotal: 3000, paidAmount: 1000 });
    expect(row("Retención para la agencia")).toContain("+$0.00 MXN");
    expect(row("Nuevo total de la reserva")).toContain("$2,000.00 MXN");
    expect(row("Nuevo saldo por cobrar")).toContain("$1,000.00 MXN");
  });

  it("Escenario 4: reserva liquidada y retención de $250 → $750 a devolver al titular", () => {
    renderDialog({ unitPrice: 1000, currentTotal: 3000, paidAmount: 3000 });
    setPenalty("250");
    expect(row("Monto no retenido")).toContain("Genera $750.00 MXN a devolver al titular");
    expect(row("Nuevo total de la reserva")).toContain("$2,250.00 MXN");
    expect(row("Nuevo saldo por cobrar")).toContain("$0.00 MXN");
    expect(screen.getByRole("note")).toHaveTextContent(
      "Quedarán $750.00 MXN a devolver al titular",
    );
  });

  it("no acepta una retención mayor al costo del lugar (botón deshabilitado)", () => {
    const onConfirm = vi.fn();
    renderDialog({ unitPrice: 1000, currentTotal: 3000, paidAmount: 0, onConfirm });
    setPenalty("1200");
    expect(screen.getByText("No puede superar el costo del lugar ($1,000.00 MXN).")).toBeVisible();
    expect(screen.getByRole("button", { name: "Confirmar Baja" })).toBeDisabled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("envía la retención capturada al confirmar", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderDialog({ unitPrice: 1000, currentTotal: 3000, paidAmount: 1500, onConfirm });
    setPenalty("250");
    await user.click(screen.getByRole("button", { name: "Confirmar Baja" }));
    expect(onConfirm).toHaveBeenCalledWith(250);
  });
});
