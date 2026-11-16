import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PASSENGER_ROLE } from "@/shared/constants/domain.constants";
import type { TitularRowOutput } from "../../../schemas/tour-dashboard.schema";
import { buildOperatorStatement } from "../../../utils/statement-agency.util";
import { BookingCard } from "../BookingCard";

// Tarjeta de reserva del Centro de Control en celular: hasta el 2026-11-16 los botones de PDF,
// Magic Link y ⋮ no tenían acción.

const copy = vi.fn<(text: string) => Promise<boolean>>(async () => true);
vi.mock("@/shared/utils/clipboard", () => ({ copyToClipboard: (t: string) => copy(t) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const titular = (overrides: Partial<TitularRowOutput> = {}): TitularRowOutput =>
  ({
    id: "11111111-1111-4111-8111-111111111111",
    bookingId: "33333333-3333-4333-8333-333333333333",
    role: PASSENGER_ROLE.TITULAR,
    fullName: "Ana Torres",
    whatsapp: "2281234567",
    groupSize: 1,
    unitPrice: 1500,
    bookingStatus: "PENDING",
    requiredDeposit: 500,
    hasSeatRight: true,
    bookedAt: new Date().toISOString(),
    formStatus: "COMPLETED",
    seatLabel: null,
    boardingPoint: "Plaza Xalapeña",
    boardingPointDetails: null,
    magicToken: "tok123",
    paymentStatus: "PARTIAL",
    paidAmount: 500,
    balance: 1000,
    companions: [],
    payments: [],
    ...overrides,
  }) as TitularRowOutput;

const renderCard = (
  props: Partial<Parameters<typeof BookingCard>[0]> = {},
  data: TitularRowOutput = titular(),
) => {
  const handlers = {
    onAssignSeatClick: vi.fn(),
    onRowClick: vi.fn(),
    onDownloadReceiptClick: vi.fn(),
    onTransferPassengerClick: vi.fn(),
    onRemovePassengerClick: vi.fn(),
    onRemoveGhostSlotClick: vi.fn(),
    onAddPassengerClick: vi.fn(),
  };
  render(<BookingCard titular={data} tourCurrency="MXN" {...handlers} {...props} />);
  return handlers;
};

beforeEach(() => vi.clearAllMocks());

describe("BookingCard (celular): acciones", () => {
  it("descarga el estado de cuenta de la reserva", async () => {
    const h = renderCard();
    await userEvent.click(screen.getByRole("button", { name: "Descargar Comprobante PDF" }));
    expect(h.onDownloadReceiptClick).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: "Ana Torres" }),
    );
  });

  it("sin abonos no ofrece el PDF (misma regla que escritorio)", () => {
    renderCard({}, titular({ paymentStatus: "PENDING", paidAmount: 0, balance: 1500 }));
    expect(screen.queryByRole("button", { name: "Descargar Comprobante PDF" })).toBeNull();
  });

  it("copia el Magic Link del titular", async () => {
    renderCard();
    await userEvent.click(screen.getByRole("button", { name: "Copiar Magic Link" }));
    expect(copy).toHaveBeenCalledWith(expect.stringContaining("/register?token=tok123"));
  });

  it("abre la transferencia de titularidad desde el ⋮", async () => {
    const h = renderCard();
    await userEvent.click(screen.getByRole("button", { name: "Más acciones del titular" }));
    await userEvent.click(await screen.findByText("Transferir titularidad"));
    expect(h.onTransferPassengerClick).toHaveBeenCalledWith(
      "33333333-3333-4333-8333-333333333333",
      "11111111-1111-4111-8111-111111111111",
      PASSENGER_ROLE.TITULAR,
      "Ana Torres",
      "2281234567",
    );
  });

  it("registrar abonos abre el detalle de la reserva", async () => {
    const h = renderCard();
    await userEvent.click(screen.getByRole("button", { name: "Registrar abonos y pagos" }));
    expect(h.onRowClick).toHaveBeenCalledWith("11111111-1111-4111-8111-111111111111");
  });

  it("Modo Auditoría: sin transferencia ni acciones del grupo", () => {
    renderCard({ isAuditMode: true }, groupData());
    expect(screen.queryByRole("button", { name: "Más acciones del titular" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Dar de baja/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Liberar lugar apartado" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Agregar lugar/ })).toBeNull();
  });

  it("un nombre largo hace salto de línea y el estado de pago no se recorta", () => {
    renderCard({}, titular({ fullName: "JOSE XAVIER RAMOS GONZALEZ DE LA SIERRA" }));
    expect(screen.getByText("JOSE XAVIER RAMOS GONZALEZ DE LA SIERRA")).toHaveClass(
      "break-words",
      "line-clamp-2",
    );
    expect(screen.getByText("ABONO PARCIAL")).toHaveClass("whitespace-nowrap");
    expect(screen.getByText(/^Debe:/)).toHaveClass("whitespace-nowrap");
  });
});

// Grupo de 3 lugares: titular, un acompañante registrado y un lugar pendiente.
const COMPANION = {
  id: "22222222-2222-4222-8222-222222222222",
  bookingId: "33333333-3333-4333-8333-333333333333",
  role: PASSENGER_ROLE.COMPANION,
  fullName: "Luis Torres",
  whatsapp: "2289998888",
  formStatus: "COMPLETED",
  seatLabel: null,
  boardingPoint: null,
  boardingPointDetails: null,
};
const groupData = () =>
  titular({
    groupSize: 3,
    formStatus: "PENDING",
    companions: [COMPANION] as TitularRowOutput["companions"],
  });

describe("BookingCard (celular): acciones del grupo, como en escritorio", () => {
  it("da de baja y transfiere el lugar de un acompañante", async () => {
    const h = renderCard({}, groupData());

    await userEvent.click(screen.getByRole("button", { name: "Dar de baja a Luis Torres" }));
    expect(h.onRemovePassengerClick).toHaveBeenCalledWith(
      COMPANION.bookingId,
      COMPANION.id,
      "Luis Torres",
    );

    await userEvent.click(screen.getByRole("button", { name: "Más acciones de Luis Torres" }));
    await userEvent.click(await screen.findByText("Transferir lugar"));
    expect(h.onTransferPassengerClick).toHaveBeenCalledWith(
      COMPANION.bookingId,
      COMPANION.id,
      PASSENGER_ROLE.COMPANION,
      "Luis Torres",
      "2289998888",
    );
  });

  it("libera un lugar pendiente y agrega un lugar al grupo", async () => {
    const h = renderCard({ freeSeatsCount: 4 }, groupData());

    await userEvent.click(screen.getByRole("button", { name: "Liberar lugar apartado" }));
    expect(h.onRemoveGhostSlotClick).toHaveBeenCalledWith(COMPANION.bookingId);

    await userEvent.click(screen.getByRole("button", { name: /Agregar lugar al grupo/ }));
    expect(h.onAddPassengerClick).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: "Ana Torres" }),
    );
  });

  it("sin lugares libres o con el formulario completo no se agrega lugar", () => {
    const { unmount } = render(
      <BookingCard
        titular={groupData()}
        onAssignSeatClick={vi.fn()}
        onAddPassengerClick={vi.fn()}
        freeSeatsCount={0}
      />,
    );
    expect(screen.getByRole("button", { name: /Agregar lugar al grupo/ })).toBeDisabled();
    unmount();

    renderCard({}, titular({ formStatus: "COMPLETED" }));
    expect(screen.queryByRole("button", { name: /Agregar lugar al grupo/ })).toBeNull();
  });
});

describe("buildOperatorStatement", () => {
  it("solo incluye abonos válidos: sin reembolsos ni el abono anulado", () => {
    const pdf = buildOperatorStatement(
      titular({
        payments: [
          {
            id: "p1",
            type: "PAYMENT",
            amount: 500,
            method: "CASH",
            createdAt: "2026-11-01T10:00:00Z",
            referenceInfo: null,
          },
          {
            id: "p2",
            type: "PAYMENT",
            amount: 300,
            method: "TRANSFER",
            createdAt: "2026-11-02T10:00:00Z",
            referenceInfo: "SPEI 1",
          },
          {
            id: "v1",
            type: "REFUND",
            amount: -300,
            method: "TRANSFER",
            createdAt: "2026-11-03T10:00:00Z",
            referenceInfo: "Anulación (Ref: p2)",
          },
        ] as TitularRowOutput["payments"],
      }),
      {
        agency: { name: "Brújula" } as never,
        tourTitle: "Zacatlán",
        tourDepartureDate: "2026-11-14",
        tourCurrency: "MXN",
      },
    );

    expect(pdf.financials.payments.map((p) => p.id)).toEqual(["p1"]);
    expect(pdf.passengers[0]).toMatchObject({ fullName: "Ana Torres", isMainPassenger: true });
    expect(pdf.tour).toMatchObject({ title: "Zacatlán", returnDate: null });
  });
});
