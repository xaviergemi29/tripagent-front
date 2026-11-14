import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CancelTourDialog } from "../CancelTourDialog";
import { RefundsPanel } from "../RefundsPanel";
import { CancelledBookingView } from "@/features/external-registration/components/CancelledBookingView";
import { TourDesktopTable } from "@/features/tours/components/TourDesktopTable";
import type { RefundRowOutput } from "../../schemas/tour-dashboard.schema";
import type { TourOutput } from "@/features/tours/schemas/tour.schema";

// Decisiones del PM (2026-11-14): "Pausado" no existe; cancelar un tour es definitivo, con motivo de
// una lista fija; en un tour cancelado solo se registran reembolsos; el viajero ve el motivo y el
// estado de su devolución.

const cancelTour = vi.fn();
const createPayment = vi.fn();
vi.mock("../../hooks/useTourDashboard", () => ({
  useCancelTour: () => ({ mutate: cancelTour, isPending: false }),
}));
vi.mock("../../hooks/usePayments", () => ({
  useCreatePayment: () => ({ mutate: createPayment, isPending: false }),
}));

beforeEach(() => vi.clearAllMocks());

describe("Cancelar tour", () => {
  it("exige un motivo de la lista y envía la nota interna", async () => {
    const user = userEvent.setup();
    render(
      <CancelTourDialog
        tourId="t1"
        tourTitle="Huasteca Potosina"
        activeBookings={3}
        collectedAmount={6000}
        currency="MXN"
        open
        onOpenChange={() => {}}
      />,
    );

    const confirm = screen.getByRole("button", { name: /Cancelar tour definitivamente/ });
    expect(confirm).toBeDisabled();
    expect(screen.getAllByRole("radio")).toHaveLength(4);

    await user.click(screen.getByRole("radio", { name: "Condiciones climatológicas adversas" }));
    await user.type(screen.getByLabelText(/Nota interna/), "Pronóstico de tormenta");
    await user.click(confirm);

    expect(cancelTour).toHaveBeenCalledWith(
      { tourId: "t1", reason: "WEATHER", note: "Pronóstico de tormenta" },
      expect.anything(),
    );
    expect(screen.getByText(/\$6,000\.00 MXN/)).toBeInTheDocument();
  });
});

const refundRow = (overrides: Partial<RefundRowOutput> = {}): RefundRowOutput => ({
  bookingId: "11111111-1111-4111-8111-111111111111",
  travelerId: "22222222-2222-4222-8222-222222222222",
  fullName: "Ana Torres",
  whatsapp: "2281234567",
  groupSize: 2,
  paidAmount: 2000,
  retainedAmount: 0,
  refundedAmount: 0,
  refundableAmount: 2000,
  refundStatus: "PENDING",
  payments: [],
  ...overrides,
});

describe("Reembolsos en el Centro de Control", () => {
  it("el Drawer abre en modo reembolso y registra un REFUND con referencia", async () => {
    const user = userEvent.setup();
    render(<RefundsPanel tourId="t1" currency="MXN" refunds={[refundRow()]} canRegisterRefunds />);

    expect(screen.getByText("Por reembolsar")).toBeInTheDocument();
    await user.click(screen.getByText("Ana Torres"));
    await user.click(screen.getByRole("button", { name: /Registrar reembolso/ }));

    expect(screen.getByText("Registrar Reembolso")).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Notas o Referencia/), "SPEI Ref: 98123");
    await user.click(screen.getByRole("button", { name: /Guardar Reembolso/ }));

    await waitFor(() => expect(createPayment).toHaveBeenCalledTimes(1));
    expect(createPayment.mock.calls[0]![0]).toMatchObject({
      bookingId: "11111111-1111-4111-8111-111111111111",
      payload: { amount: 2000, type: "REFUND", referenceInfo: "SPEI Ref: 98123" },
    });
  });

  it("no permite reembolsar más que el saldo", async () => {
    const user = userEvent.setup();
    render(<RefundsPanel tourId="t1" currency="MXN" refunds={[refundRow()]} canRegisterRefunds />);

    await user.click(screen.getByText("Ana Torres"));
    await user.click(screen.getByRole("button", { name: /Registrar reembolso/ }));
    const amount = screen.getByLabelText(/Monto reembolsado/);
    await user.clear(amount);
    await user.type(amount, "2500");
    await user.click(screen.getByRole("button", { name: /Guardar Reembolso/ }));

    expect(await screen.findByText(/no puede superar/)).toBeInTheDocument();
    expect(createPayment).not.toHaveBeenCalled();
  });

  it("reembolso completo: sin botón y con el aviso de neto $0.00", async () => {
    const user = userEvent.setup();
    render(
      <RefundsPanel
        tourId="t1"
        currency="MXN"
        refunds={[
          refundRow({ refundedAmount: 2000, refundableAmount: 0, refundStatus: "COMPLETED" }),
        ]}
        canRegisterRefunds
      />,
    );

    expect(screen.getByText("Reembolsado")).toBeInTheDocument();
    await user.click(screen.getByText("Ana Torres"));
    expect(screen.queryByRole("button", { name: /Registrar reembolso/ })).not.toBeInTheDocument();
    expect(screen.getByText(/neto de esta reserva es \$0\.00/)).toBeInTheDocument();
  });
});

describe("Magic Link de una reserva cancelada", () => {
  const agency = { name: "Viajes Xalapa", logoPath: null };

  it("cancelado por la agencia: aviso con el motivo y devolución en proceso", () => {
    render(
      <CancelledBookingView
        agency={agency}
        data={{
          tourInfo: {
            title: "Huasteca Potosina",
            departureDateTime: "2026-12-20",
            currency: "MXN",
          },
          cancellation: { byAgency: true, reason: "WEATHER", cancelledAt: "2026-11-14T10:00:00Z" },
          refund: {
            paidAmount: 2000,
            retainedAmount: 0,
            refundedAmount: 800,
            refundableAmount: 1200,
            refundStatus: "PENDING",
          },
        }}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Este viaje ha sido cancelado por la agencia. Motivo: Condiciones climatológicas adversas.",
    );
    expect(screen.getByText("$2,000.00 MXN")).toBeInTheDocument();
    expect(screen.getByText("En proceso de transferencia SPEI")).toBeInTheDocument();
    expect(screen.getByText(/Pendiente: \$1,200\.00 MXN/)).toBeInTheDocument();
  });

  it("devolución completa: 'Reembolsado con éxito'", () => {
    render(
      <CancelledBookingView
        agency={agency}
        data={{
          cancellation: { byAgency: true, reason: "SECURITY", cancelledAt: "2026-11-14T10:00:00Z" },
          refund: {
            paidAmount: 2000,
            retainedAmount: 0,
            refundedAmount: 2000,
            refundableAmount: 0,
            refundStatus: "COMPLETED",
          },
        }}
      />,
    );

    expect(screen.getByText(/Reembolsado con éxito/)).toBeInTheDocument();
  });

  it("cancelada por el cliente: penalización según políticas, sin montos ni promesa de devolución", () => {
    render(
      <CancelledBookingView
        agency={agency}
        data={{ cancellation: { byAgency: false, reason: null, cancelledAt: null }, refund: null }}
      />,
    );

    expect(screen.getByText("Reservación cancelada")).toBeInTheDocument();
    expect(
      screen.getByText(
        /se aplicó la penalización correspondiente según las políticas de Viajes Xalapa/,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/saldo|devoluci|reembols/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Total abonado")).not.toBeInTheDocument();
  });
});

describe("Catálogo de tours", () => {
  it("un tour cancelado se ve 'Cancelado' (ya no existe 'Pausado')", () => {
    const tour = {
      id: "t1",
      title: "Huasteca Potosina",
      temporalStatus: "CANCELADO",
      currency: "MXN",
      price: 1000,
      departureDateTime: "2026-12-20",
      destinationType: "NATIONAL",
      boardingPoints: [],
      maxCapacity: 20,
      sellableCapacity: 19,
      currentOccupancy: 0,
    } as unknown as TourOutput;

    render(<TourDesktopTable tours={[tour]} onDeleteRequest={() => {}} />);

    expect(screen.getByText("Cancelado")).toBeInTheDocument();
    expect(screen.queryByText("Pausado")).not.toBeInTheDocument();
  });
});
