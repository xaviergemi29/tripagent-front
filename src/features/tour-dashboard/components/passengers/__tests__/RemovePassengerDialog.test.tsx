import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { useQuickRemovePassenger } from "../../../hooks/useTourDashboard";
import { RemovePassengerDialog } from "../RemovePassengerDialog";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock("@/lib/api-client", () => ({ apiClient: { patch: vi.fn() } }));

beforeEach(() => vi.clearAllMocks());

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
  passengersCount?: number;
  isSubmitting?: boolean;
  onClose?: () => void;
}) =>
  render(
    <RemovePassengerDialog
      isOpen
      onClose={props.onClose ?? vi.fn()}
      onConfirm={props.onConfirm ?? vi.fn()}
      passengerName="Eva Ruiz"
      seatLabel={props.seatLabel ?? null}
      unitPrice={props.unitPrice}
      currentTotal={props.currentTotal}
      paidAmount={props.paidAmount}
      passengersCount={props.passengersCount}
      isSubmitting={props.isSubmitting}
      tourCurrency="MXN"
    />,
  );

// `fireEvent.change` (no `user.type`): en jsdom el campo numérico controlado se revisa por su texto.
const setPenalty = (value: string) =>
  fireEvent.change(screen.getByLabelText("Retención para la agencia"), {
    target: { value },
  });

const row = (label: string) => {
  const breakdown = screen.getByLabelText("Desglose de la baja");
  const term = within(breakdown).getByText(label, { exact: false }).closest("div") as HTMLElement;
  return term.textContent ?? "";
};

describe("RemovePassengerDialog: retención para la agencia", () => {
  it("contexto: nombre, asiento, costo del lugar y abonado; retención inicial vacía", () => {
    renderDialog({ unitPrice: 1000, currentTotal: 3000, paidAmount: 1500, seatLabel: "12" });
    expect(screen.getByText("¿Dar de baja a Eva Ruiz?")).toBeVisible();
    expect(screen.getByText("• Asiento #12")).toBeVisible();
    expect(screen.getByText(/asiento #12/).parentElement).toHaveTextContent("quedará libre");
    expect(screen.getByLabelText("Retención para la agencia")).toHaveValue(null);
  });

  it("pasajero sin asiento: badge y banner sin etiqueta de asiento", () => {
    renderDialog({ unitPrice: 1000, currentTotal: 3000, paidAmount: 0 });
    expect(screen.getByText("Sin asiento asignado")).toBeVisible();
    expect(screen.getByText(/^Se habilitará 1 lugar disponible/)).toBeVisible();
  });

  it("Escenario 1: retención de $250 con saldo pendiente → total $2,250 y por cobrar $750", () => {
    renderDialog({ unitPrice: 1000, currentTotal: 3000, paidAmount: 1500 });
    setPenalty("250");
    expect(row("Costo del lugar dado de baja")).toContain("-$1,000.00 MXN");
    expect(row("Retención para la agencia")).toContain("+$250.00 MXN");
    expect(row("Monto descontado")).toContain("-$750.00 MXN");
    expect(screen.getByText("Nuevo saldo por cobrar:")).toBeVisible();
    expect(screen.getByText("$750.00 MXN")).toBeVisible();
    expect(screen.getByText("$2,250.00 MXN")).toBeVisible();
  });

  it("Escenario 2: retención del 100 % en una reserva liquidada → total $6,000, saldo $0", () => {
    renderDialog({ unitPrice: 2000, currentTotal: 6000, paidAmount: 6000 });
    setPenalty("2000");
    expect(row("Monto descontado")).toContain("-$0.00 MXN");
    expect(screen.getByText("$0.00 MXN · Liquidado")).toBeVisible();
  });

  it("Escenario 3: sin retención → total $2,000 y por cobrar $1,000", () => {
    renderDialog({ unitPrice: 1000, currentTotal: 3000, paidAmount: 1000 });
    expect(row("Retención para la agencia")).toContain("+$0.00 MXN");
    expect(screen.getByText("$2,000.00 MXN")).toBeVisible();
    expect(screen.getByText("Nuevo saldo por cobrar:").parentElement).toHaveTextContent(
      "$1,000.00 MXN",
    );
  });

  it("Escenario 4: reserva liquidada y retención de $250 → $750 a devolver al titular", () => {
    renderDialog({ unitPrice: 1000, currentTotal: 3000, paidAmount: 3000 });
    setPenalty("250");
    expect(screen.getByText("Saldo a favor del cliente:")).toBeVisible();
    expect(screen.getByText("$750.00 MXN")).toBeVisible();
    expect(screen.getByText("$2,250.00 MXN")).toBeVisible();
  });

  it("no acepta una retención mayor al costo del lugar (botón deshabilitado)", () => {
    const onConfirm = vi.fn();
    renderDialog({ unitPrice: 1000, currentTotal: 3000, paidAmount: 0, onConfirm });
    setPenalty("1200");
    expect(
      screen.getByText("La retención no puede superar el costo del lugar ($1,000.00 MXN)."),
    ).toBeVisible();
    expect(row("Monto descontado")).toContain("--");
    expect(row("Retención para la agencia")).toContain("(Inválido)");
    expect(screen.getByText("Corrige el monto ingresado")).toBeVisible();
    expect(screen.getByRole("button", { name: /Confirmar baja/ })).toBeDisabled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("envía la retención capturada al confirmar", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderDialog({ unitPrice: 1000, currentTotal: 3000, paidAmount: 1500, onConfirm });
    setPenalty("250");
    await user.click(screen.getByRole("button", { name: /Confirmar baja/ }));
    expect(onConfirm).toHaveBeenCalledWith(250, "MXN");
  });

  it("nuevo total con número de viajeros restantes", () => {
    renderDialog({ unitPrice: 1000, currentTotal: 3000, paidAmount: 0, passengersCount: 3 });
    expect(screen.getByText(/Nuevo total de la reserva \(2 viajeros\)/)).toBeVisible();
  });

  it("chips con centavos: 25 % de 1,333.33 = 333.33 y el chip activo se marca", async () => {
    const user = userEvent.setup();
    renderDialog({ unitPrice: 1333.33, currentTotal: 4000, paidAmount: 0 });
    const chip = screen.getByRole("button", { name: "$333.33 MXN (25%)" });
    expect(chip).toHaveAttribute("aria-pressed", "false");
    await user.click(chip);
    expect(screen.getByLabelText("Retención para la agencia")).toHaveValue(333.33);
    expect(chip).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "$666.67 MXN (50%)" }));
    expect(screen.getByLabelText("Retención para la agencia")).toHaveValue(666.67);
    await user.click(screen.getByRole("button", { name: "$1,333.33 MXN (Total)" }));
    expect(row("Retención para la agencia")).toContain("+$1,333.33 MXN");
  });

  it("con la petición en curso no se puede cerrar", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDialog({
      unitPrice: 1000,
      currentTotal: 3000,
      paidAmount: 0,
      isSubmitting: true,
      onClose,
    });
    expect(screen.getByRole("button", { name: "Cerrar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Volver sin cambios" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  describe("aviso tras confirmar (monto de la API)", () => {
    function Harness() {
      const { mutate } = useQuickRemovePassenger();
      return (
        <RemovePassengerDialog
          isOpen
          onClose={vi.fn()}
          onConfirm={(penaltyAmount, currency) =>
            mutate({ bookingId: "b1", passengerId: "p1", penaltyAmount, currency })
          }
          passengerName="Eva Ruiz"
          unitPrice={1000}
          currentTotal={3000}
          paidAmount={3000}
          tourCurrency="MXN"
        />
      );
    }
    const renderHarness = () =>
      render(
        <QueryClientProvider client={new QueryClient()}>
          <Harness />
        </QueryClientProvider>,
      );

    it("saldo a favor: toast con el monto del backend, no el local", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        financialSummary: { refundableSurplus: 123.45 },
      });
      renderHarness();
      setPenalty("250");
      await userEvent.setup().click(screen.getByRole("button", { name: /Confirmar baja/ }));
      await waitFor(() => expect(toast.info).toHaveBeenCalled());
      expect(toast.info).toHaveBeenCalledWith(
        "Baja confirmada. El grupo tiene un saldo a favor de $123.45 MXN. Puedes registrar la devolución o ajuste en el historial financiero.",
      );
      expect(toast.success).not.toHaveBeenCalled();
      // El payload no cambia: solo penaltyAmount.
      expect(apiClient.patch).toHaveBeenCalledWith("/bookingPassengers/b1/passengers/p1/cancel", {
        penaltyAmount: 250,
      });
    });

    it("sin saldo a favor: toast de éxito de siempre", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ financialSummary: { refundableSurplus: 0 } });
      renderHarness();
      await userEvent.setup().click(screen.getByRole("button", { name: /Confirmar baja/ }));
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith("Pasajero dado de baja", {
          description: "El asiento ha sido liberado.",
        }),
      );
      expect(toast.info).not.toHaveBeenCalled();
    });
  });
});
