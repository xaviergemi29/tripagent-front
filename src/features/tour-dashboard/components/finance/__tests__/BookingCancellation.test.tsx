import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TravelerDetailDrawer } from "../TravelerDetailDrawer";

// Cancelación de la reserva completa desde el drawer del titular (2026-11-17). La baja de un
// acompañante se prueba en `passengers/__tests__/RemovePassengerDialog.test.tsx`. Las reglas de dinero las aplica la API (`test/financial-flows.test.ts`); aquí se
// revisa lo que la interfaz envía y lo que le explica al operador.

const cancelFullBooking = vi.fn();
vi.mock("@/features/tour-dashboard/hooks/useBookingActions", () => ({
  useCancelFullBooking: () => ({ mutate: cancelFullBooking, isPending: false }),
}));
vi.mock("@/features/tour-dashboard/hooks/usePayments", () => ({
  useCreatePayment: () => ({ mutate: vi.fn(), isPending: false }),
  useVoidPayment: () => ({ mutate: vi.fn(), isPending: false }),
}));

// Reserva de 3 lugares de $1,000 USD ($3,000) con $1,500 abonados.
const titular = (paidAmount = 1500) =>
  ({
    id: "trav-1",
    bookingId: "book-1",
    role: "TITULAR",
    fullName: "Ana Torres",
    whatsapp: "+522281234567",
    payments: [],
    balance: 3000 - paidAmount,
    paidAmount,
    totalPrice: 3000,
    unitPrice: 1000,
    companions: [],
  }) as never;

const openCancellation = async (user: ReturnType<typeof userEvent.setup>, paidAmount?: number) => {
  render(
    <TravelerDetailDrawer
      tourId="t1"
      tourCurrency="USD"
      traveler={titular(paidAmount)}
      isOpen
      onClose={vi.fn()}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Cancelar Reserva Completa (Todos)" }));
};

const confirmButton = () => screen.getByRole("button", { name: "Confirmar Baja" });

beforeEach(() => cancelFullBooking.mockClear());

describe("Cancelar la reserva completa", () => {
  it('"Sin Devolución" retiene TODO lo abonado del grupo (antes, el precio de un lugar)', async () => {
    const user = userEvent.setup();
    await openCancellation(user);
    expect(screen.getByText(/Se retendrá todo lo abonado \(\$1,500\.00 USD\)/)).toBeInTheDocument();

    await user.click(confirmButton());

    expect(cancelFullBooking).toHaveBeenCalledWith({ bookingId: "book-1", penaltyAmount: 1500 });
  });

  it('"Sin Devolución" sin abonos: se cancela sin retención', async () => {
    const user = userEvent.setup();
    await openCancellation(user, 0);
    expect(
      screen.getByText(/Sin abonos registrados: se cancela sin retención/),
    ).toBeInTheDocument();

    await user.click(confirmButton());

    expect(cancelFullBooking).toHaveBeenCalledWith({ bookingId: "book-1", penaltyAmount: 0 });
  });

  it("la retención manual parte de lo abonado, en la moneda del tour, y no puede ser menor", async () => {
    const user = userEvent.setup();
    await openCancellation(user);
    await user.click(screen.getByText('Aplicar política "Sin Devolución"'));

    // Antes decía "(MXN)" aunque el tour fuera en dólares, y partía de $0.
    const retention = screen.getByLabelText("Retención manual (USD)");
    expect(retention).toHaveValue(1500);

    await user.clear(retention);
    await user.type(retention, "1000");
    expect(
      screen.getByText(/No puede ser menor a lo ya abonado \(\$1,500\.00 USD\)/),
    ).toBeVisible();
    expect(confirmButton()).toBeDisabled();

    await user.clear(retention);
    await user.type(retention, "3500");
    expect(screen.getByText(/No puede superar el total de la reserva/)).toBeVisible();
    expect(confirmButton()).toBeDisabled();

    await user.clear(retention);
    await user.type(retention, "2000");
    await user.click(confirmButton());
    expect(cancelFullBooking).toHaveBeenCalledWith({ bookingId: "book-1", penaltyAmount: 2000 });
  });
});

describe("Estado de cuenta: retenciones por bajas y saldo a devolver (FLUJO-RES-004)", () => {
  // Tras una baja con $250 retenidos: total $2,250 con $3,000 abonados → $750 a devolver.
  const withSurplus = {
    id: "trav-1",
    bookingId: "book-1",
    role: "TITULAR",
    fullName: "Ana Torres",
    whatsapp: "+522281234567",
    payments: [],
    paidAmount: 3000,
    balance: 0,
    retainedPenaltyTotal: 250,
    refundableSurplus: 750,
    unitPrice: 1000,
    companions: [],
  } as never;

  it("muestra el total ajustado con la retención y el bloque a devolver con su botón", async () => {
    const user = userEvent.setup();
    render(
      <TravelerDetailDrawer
        tourId="t1"
        tourCurrency="MXN"
        traveler={withSurplus}
        isOpen
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("$2,250.00 MXN")).toBeInTheDocument();
    expect(screen.getByText(/Incluye \$250\.00 MXN de/)).toBeInTheDocument();
    const block = screen.getByRole("note");
    expect(block).toHaveTextContent("A devolver al titular");
    expect(block).toHaveTextContent("$750.00 MXN");

    await user.click(screen.getByRole("button", { name: "Registrar devolución" }));
    expect(await screen.findByText("Registrar Reembolso")).toBeInTheDocument();
  });

  it("en Modo Auditoría muestra el saldo, pero no ofrece registrar la devolución", () => {
    render(
      <TravelerDetailDrawer
        tourId="t1"
        tourCurrency="MXN"
        traveler={withSurplus}
        isOpen
        isAuditMode
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole("note")).toHaveTextContent("$750.00 MXN");
    expect(screen.queryByRole("button", { name: "Registrar devolución" })).not.toBeInTheDocument();
  });
});
