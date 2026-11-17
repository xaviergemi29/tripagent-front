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

// Reserva de 3 lugares de $1,000 USD con $900 abonados.
const titular = {
  id: "trav-1",
  bookingId: "book-1",
  role: "TITULAR",
  fullName: "Ana Torres",
  whatsapp: "+522281234567",
  payments: [],
  balance: 2100,
  paidAmount: 900,
  totalPrice: 3000,
  unitPrice: 1000,
  companions: [],
} as never;

const openCancellation = async (user: ReturnType<typeof userEvent.setup>) => {
  render(
    <TravelerDetailDrawer
      tourId="t1"
      tourCurrency="USD"
      traveler={titular}
      isOpen
      onClose={vi.fn()}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Cancelar Reserva Completa (Todos)" }));
};

beforeEach(() => cancelFullBooking.mockClear());

describe("Cancelar la reserva completa", () => {
  it("la retención manual se captura en la moneda del tour y se envía tal cual", async () => {
    const user = userEvent.setup();
    await openCancellation(user);
    await user.click(screen.getByText('Aplicar política "Sin Devolución"'));

    // Antes decía "(MXN)" aunque el tour fuera en dólares.
    const retention = screen.getByLabelText("Retención manual (USD)");
    await user.clear(retention);
    await user.type(retention, "250");
    await user.click(screen.getByRole("button", { name: "Confirmar Baja" }));

    expect(cancelFullBooking).toHaveBeenCalledWith({ bookingId: "book-1", penaltyAmount: 250 });
  });

  it('[regla por validar] "Sin Devolución" retiene el precio de UN lugar, no el total de la reserva', async () => {
    const user = userEvent.setup();
    await openCancellation(user);
    await user.click(screen.getByRole("button", { name: "Confirmar Baja" }));

    expect(cancelFullBooking).toHaveBeenCalledWith({ bookingId: "book-1", penaltyAmount: 1000 });
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
  });
});
