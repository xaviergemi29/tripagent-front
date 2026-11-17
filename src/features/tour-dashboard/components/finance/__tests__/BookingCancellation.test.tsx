import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TravelerDetailDrawer } from "../TravelerDetailDrawer";
import { RemovePassengerDialog } from "../../passengers/RemovePassengerDialog";

// Cancelación de la reserva completa desde el drawer del titular y baja de un acompañante
// (2026-11-17). Las reglas de dinero las aplica la API (`test/financial-flows.test.ts`); aquí se
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

describe("Dar de baja a un acompañante", () => {
  it("explica que se descuenta un lugar sin retención (sin prometer una penalización que no existe)", () => {
    render(
      <RemovePassengerDialog isOpen onClose={vi.fn()} onConfirm={vi.fn()} passengerName="Eva" />,
    );
    const text = screen.getByText(/se le descontará el precio de un/);
    expect(text).toHaveTextContent("lo ya abonado no cambia");
    expect(screen.queryByText(/abre su perfil completo/)).not.toBeInTheDocument();
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("si el grupo ya abonó más que el nuevo total, avisa cuánto se retiene y que queda liquidada", () => {
    // Decisión del usuario (2026-11-17): $2,500 abonados de $3,000 y baja de un lugar de $1,000.
    render(
      <RemovePassengerDialog
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        passengerName="Eva"
        paidAmount={2500}
        retainedAmount={500}
        tourCurrency="MXN"
      />,
    );
    expect(screen.getByRole("note")).toHaveTextContent(
      "El grupo ya abonó $2,500.00 MXN. Se retendrán $500.00 MXN por la baja y la reserva queda liquidada.",
    );
    expect(screen.queryByText(/sin retención/)).not.toBeInTheDocument();
  });
});
