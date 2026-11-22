import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PASSENGER_ROLE } from "@/shared/constants/domain.constants";
import type { TitularRowOutput } from "../../../schemas/tour-dashboard.schema";
import { TravelerGroup } from "../TravelerGroup";

// Fila de un grupo en la tabla del Centro de Control (escritorio): titular, acompañantes, lugares
// pendientes y "Agregar lugar". Fija el comportamiento antes de dividir el componente.

const copy = vi.fn<(text: string) => Promise<boolean>>(async () => true);
vi.mock("@/shared/utils/clipboard", () => ({ copyToClipboard: (t: string) => copy(t) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const TITULAR_ID = "11111111-1111-4111-8111-111111111111";
const COMPANION_ID = "22222222-2222-4222-8222-222222222222";
const BOOKING_ID = "33333333-3333-4333-8333-333333333333";

const titular = (overrides: Partial<TitularRowOutput> = {}): TitularRowOutput =>
  ({
    id: TITULAR_ID,
    bookingId: BOOKING_ID,
    role: PASSENGER_ROLE.TITULAR,
    fullName: "Ana Torres",
    whatsapp: "2281234567",
    groupSize: 3,
    unitPrice: 1500,
    bookingStatus: "PENDING",
    requiredDeposit: 1500,
    hasSeatRight: true,
    bookedAt: new Date().toISOString(),
    formStatus: "COMPLETED",
    seatLabel: null,
    boardingPoint: "Plaza Xalapeña",
    boardingPointDetails: null,
    magicToken: "tok123",
    paymentStatus: "PARTIAL",
    paidAmount: 1500,
    balance: 3000,
    companions: [
      {
        id: COMPANION_ID,
        bookingId: BOOKING_ID,
        role: PASSENGER_ROLE.COMPANION,
        fullName: "Luis Torres",
        whatsapp: "2289998888",
        formStatus: "COMPLETED",
        seatLabel: "12",
        boardingPoint: "Coatepec",
        boardingPointDetails: null,
      },
    ],
    ...overrides,
  }) as TitularRowOutput;

const handlers = () => ({
  onRowClick: vi.fn(),
  onAssignSeatClick: vi.fn(),
  onAddPassengerClick: vi.fn(),
  onRemovePassengerClick: vi.fn(),
  onRemoveGhostSlotClick: vi.fn(),
  onTransferPassengerClick: vi.fn(),
  onDownloadReceiptClick: vi.fn(),
});

const renderGroup = (
  props: Partial<Parameters<typeof TravelerGroup>[0]> = {},
  data: TitularRowOutput = titular(),
) => {
  const h = handlers();
  render(
    <table>
      <tbody>
        <TravelerGroup titular={data} tourCurrency="MXN" requiresSeats {...h} {...props} />
      </tbody>
    </table>,
  );
  return h;
};

const expand = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByText("Ana Torres"));

beforeEach(() => vi.clearAllMocks());

describe("TravelerGroup: fila del titular", () => {
  it("muestra grupo, registro, estado de pago y saldo con la moneda del tour", () => {
    renderGroup();
    expect(screen.getByText("Grupo: 3 viajeros (2 registrados)")).toBeInTheDocument();
    expect(screen.getByText("Abono Parcial")).toBeInTheDocument();
    expect(screen.getByText("Debe: $3,000.00 MXN")).toBeInTheDocument();
    expect(screen.getByText("Plaza Xalapeña")).toBeInTheDocument();
  });

  it("el teléfono, el estado de pago, el saldo y el botón del Magic Link se ven completos y con borde", () => {
    renderGroup();
    // Sin cortes de línea ("ABONO / PARCIAL", "$3,000.00 / USD") en columnas angostas.
    expect(screen.getByText("Abono Parcial")).toHaveClass("whitespace-nowrap");
    expect(screen.getByText("Debe: $3,000.00 MXN")).toHaveClass("whitespace-nowrap");
    expect(screen.getByText("228 123 4567")).toHaveClass("whitespace-nowrap");
    // Cada acción con su color (antes el Magic Link no tenía borde y las demás eran grises).
    expect(screen.getByRole("button", { name: "Copiar Magic Link" })).toHaveClass(
      "border-indigo-200",
    );
    expect(screen.getByRole("button", { name: "Registrar abonos y pagos" })).toHaveClass(
      "border-emerald-200",
    );
  });

  it("con derecho a asiento y sin asiento: '[ Asignar Asiento ]' llama con el id del titular", async () => {
    const user = userEvent.setup();
    const h = renderGroup();
    await user.click(screen.getByText("[ Asignar Asiento ]"));
    expect(h.onAssignSeatClick).toHaveBeenCalledWith(TITULAR_ID);
  });

  it("sin derecho a asiento: 'Requiere anticipo'; con asiento ya asignado, la alerta", () => {
    renderGroup({}, titular({ hasSeatRight: false, companions: [] }));
    expect(screen.getByText("Requiere anticipo")).toBeInTheDocument();
  });

  it("sin derecho a asiento pero con asiento: conserva el asiento con la alerta", () => {
    renderGroup({}, titular({ hasSeatRight: false, seatLabel: "4", companions: [] }));
    expect(screen.getByText(/Asiento asignado sin anticipo cubierto/)).toBeInTheDocument();
  });

  it("sin pagos muestra la antigüedad del apartado; sin saldo, 'Sin adeudos'", () => {
    renderGroup({}, titular({ paidAmount: 0, paymentStatus: "PENDING" }));
    expect(screen.getByText(/Apartado hace/)).toBeInTheDocument();
    expect(screen.getByText("Sin Pago")).toBeInTheDocument();
  });

  it("liquidado: 'Sin adeudos' y botón de comprobante PDF", async () => {
    const user = userEvent.setup();
    const data = titular({ paymentStatus: "PAID", balance: 0, paidAmount: 4500 });
    const h = renderGroup({}, data);
    expect(screen.getByText("Sin adeudos")).toBeInTheDocument();
    expect(screen.getByText("Liquidado")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Descargar Comprobante PDF" }));
    expect(h.onDownloadReceiptClick).toHaveBeenCalledWith(data);
  });

  it("acciones: copiar Magic Link, abrir pagos y transferir titularidad", async () => {
    const user = userEvent.setup();
    const h = renderGroup();

    await user.click(screen.getByRole("button", { name: "Copiar Magic Link" }));
    expect(copy).toHaveBeenCalledWith(`${window.location.origin}/register?token=tok123`);

    await user.click(screen.getByRole("button", { name: "Registrar abonos y pagos" }));
    expect(h.onRowClick).toHaveBeenCalledWith(TITULAR_ID);

    const row = screen.getByText("Ana Torres").closest("tr")!;
    const buttons = within(row).getAllByRole("button");
    await user.click(buttons[buttons.length - 1]!); // menú ⋮
    await user.click(await screen.findByRole("menuitem", { name: "Transferir titularidad" }));
    expect(h.onTransferPassengerClick).toHaveBeenCalledWith(
      BOOKING_ID,
      TITULAR_ID,
      PASSENGER_ROLE.TITULAR,
      "Ana Torres",
      "2281234567",
    );
  });
});

describe("TravelerGroup: grupo expandido", () => {
  it("al expandir muestra acompañantes y lugares pendientes con su número", async () => {
    const user = userEvent.setup();
    renderGroup();
    expect(screen.queryByText("Luis Torres")).not.toBeInTheDocument();

    await expand(user);
    expect(screen.getByText("Luis Torres")).toBeInTheDocument();
    expect(screen.getByText("Acompañante de Ana")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Acompañante pendiente de registro")).toBeInTheDocument();
    expect(screen.getByText("Lugar reservado #3")).toBeInTheDocument();
  });

  it("acompañante: dar de baja y transferir lugar", async () => {
    const user = userEvent.setup();
    const h = renderGroup();
    await expand(user);

    await user.click(screen.getByTitle("Dar de baja pasajero"));
    expect(h.onRemovePassengerClick).toHaveBeenCalledWith(BOOKING_ID, COMPANION_ID, "Luis Torres");

    await user.click(screen.getByRole("button", { name: "Más acciones del acompañante" }));
    await user.click(await screen.findByRole("menuitem", { name: "Transferir lugar" }));
    expect(h.onTransferPassengerClick).toHaveBeenCalledWith(
      BOOKING_ID,
      COMPANION_ID,
      PASSENGER_ROLE.COMPANION,
      "Luis Torres",
      "2289998888",
    );
  });

  it("lugar pendiente: liberar lugar y asignar asiento al titular (sin «Enviar Link»)", async () => {
    const user = userEvent.setup();
    const h = renderGroup();
    await expand(user);

    await user.click(screen.getByTitle("Liberar lugar apartado"));
    expect(h.onRemoveGhostSlotClick).toHaveBeenCalledWith(BOOKING_ID);

    // El Magic Link se copia desde la fila del titular, no desde el lugar pendiente.
    expect(screen.queryByRole("button", { name: "Enviar Link" })).not.toBeInTheDocument();

    const ghostRow = screen.getByText("Acompañante pendiente de registro").closest("tr")!;
    await user.click(within(ghostRow).getByText("[ Asignar Asiento ]"));
    expect(h.onAssignSeatClick).toHaveBeenCalledWith(TITULAR_ID);
  });

  it("'Agregar lugar' solo con formulario pendiente y se deshabilita sin lugares libres", async () => {
    const user = userEvent.setup();
    const data = titular({ formStatus: "PENDING" });
    const h = renderGroup({ freeSeatsCount: 0 }, data);
    await expand(user);

    const add = screen.getByRole("button", { name: /Agregar lugar al grupo/ });
    expect(add).toBeDisabled();
    expect(screen.getByText("0 libres en tour")).toBeInTheDocument();
    expect(h.onAddPassengerClick).not.toHaveBeenCalled();
  });

  it("'Agregar lugar' llama con el titular cuando hay lugares", async () => {
    const user = userEvent.setup();
    const data = titular({ formStatus: "PENDING" });
    const h = renderGroup({ freeSeatsCount: 4 }, data);
    await expand(user);

    await user.click(screen.getByRole("button", { name: /Agregar lugar al grupo/ }));
    expect(h.onAddPassengerClick).toHaveBeenCalledWith(data);
  });
});

describe("TravelerGroup: Modo Auditoría (solo lectura)", () => {
  it("sin menú, sin bajas, sin liberar lugares, sin agregar; 'Sin asiento' en lugar de asignar", async () => {
    const user = userEvent.setup();
    renderGroup({ isAuditMode: true }, titular({ formStatus: "PENDING" }));
    await expand(user);

    expect(screen.queryByText("[ Asignar Asiento ]")).not.toBeInTheDocument();
    expect(screen.getAllByText("Sin asiento").length).toBeGreaterThan(0);
    expect(screen.queryByTitle("Dar de baja pasajero")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Liberar lugar apartado")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enviar Link" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Agregar lugar al grupo/ }),
    ).not.toBeInTheDocument();
    // Consultar pagos sí se permite.
    expect(screen.getByRole("button", { name: "Registrar abonos y pagos" })).toBeInTheDocument();
  });
});

describe("TravelerGroup: Enviar por WhatsApp", () => {
  const getLink = () => screen.getByRole("link", { name: "Enviar por WhatsApp" });

  it.each(["AWAITING_REGISTRATION", "PENDING"] as const)(
    "aparece con %s y abre wa.me con el Magic Link",
    (bookingStatus) => {
      renderGroup(
        { tourTitle: "Zacatlán", bankDetails: { clabeNumber: "012345678901234567" } },
        titular({ bookingStatus, requiredDeposit: 3000, paidAmount: 1000 }),
      );
      const href = getLink().getAttribute("href") ?? "";
      expect(href.startsWith("https://wa.me/522281234567?text=")).toBe(true);
      const text = decodeURIComponent(href.split("?text=")[1] ?? "");
      expect(text).toContain("/register?token=tok123");
      expect(text).toContain("$2,000.00 MXN");
      expect(text).toContain("CLABE:");
      // Registrada (PENDING) → recordatorio de pago; si no, invitación a registrarse.
      expect(text).toContain(
        bookingStatus === "PENDING"
          ? "Gracias por completar tu registro"
          : "registrar los datos de tus acompañantes",
      );
      expect(getLink()).toHaveAttribute("target", "_blank");
      expect(getLink()).toHaveAttribute("rel", "noopener noreferrer");
    },
  );

  it("sin WhatsApp válido queda deshabilitado", () => {
    renderGroup({}, titular({ whatsapp: "Sin teléfono" }));
    expect(screen.queryByRole("link", { name: "Enviar por WhatsApp" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Enviar por WhatsApp (no disponible)")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("no se ofrece con la reserva confirmada", () => {
    renderGroup({}, titular({ bookingStatus: "CONFIRMED" }));
    expect(screen.queryByLabelText(/Enviar por WhatsApp/)).not.toBeInTheDocument();
  });

  it("no se ofrece en Modo Auditoría", () => {
    renderGroup({ isAuditMode: true });
    expect(screen.queryByLabelText(/Enviar por WhatsApp/)).not.toBeInTheDocument();
  });
});
