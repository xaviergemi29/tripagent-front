import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TourRegistrationView } from "../TourRegistrationView";

// Registro del grupo en el Magic Link: "Completar Registro" se habilita solo con el formulario
// válido (incluida la casilla de políticas) y envía lo capturado, también con acompañante.

const createBooking = vi.fn<(body: Record<string, unknown>) => Promise<object>>(async () => ({}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("../../hooks/useBookings", () => ({
  useCreateBooking: () => ({ mutateAsync: createBooking, isPending: false }),
}));
vi.mock("../../hooks/usePublicTravelerLookup", () => ({
  usePublicTravelerLookup: () => ({ lookupTraveler: vi.fn(async () => null) }),
}));

const renderView = (reservedSeats: number) =>
  render(
    <TourRegistrationView
      token="tok"
      boardingPoints={[{ id: "bp-1", location: "Plaza Xalapeña", time: "06:00" }]}
      tourInfo={{
        title: "Huasteca",
        departureDateTime: "2026-12-20",
        currency: "MXN",
        reservedSeats,
        priceTotalPerPassenger: 1500,
      }}
      agencyName="Viajes Xalapa"
      agencyPolicies={null}
      agencyPrivacyNoticeUrl={null}
    />,
  );

const fillTitular = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByPlaceholderText("Ej. 2281234567"), "2281234567");
  await user.type(screen.getByPlaceholderText("Nombre y Apellidos"), "Ana Torres");
  await user.type(screen.getAllByPlaceholderText("correo@ejemplo.com")[0]!, "ana@correo.mx");
  await user.type(screen.getAllByPlaceholderText("Nombre del familiar")[0]!, "Luis Torres");
  await user.type(screen.getAllByPlaceholderText("Teléfono 10 dígitos")[0]!, "2281112222");
  await user.click(screen.getAllByText("Plaza Xalapeña")[0]!);
  await user.click(screen.getByRole("checkbox", { name: /Acepto las políticas/, hidden: true }));
};

beforeEach(() => createBooking.mockClear());

describe("Registro del Magic Link", () => {
  it("titular: el botón se habilita al llenar y envía los datos", async () => {
    const user = userEvent.setup();
    renderView(1);
    const submit = screen.getByRole("button", { name: /Completar Registro/ });
    expect(submit).toBeDisabled();

    await fillTitular(user);
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(createBooking.mock.calls[0]![0]).toMatchObject({
      mainClient: {
        fullName: "Ana Torres",
        whatsappPhone: "2281234567",
        boardingPoint: "Plaza Xalapeña (06:00)",
      },
      privacyNoticeAccepted: true,
    });
  });

  it("un contacto de emergencia igual al propio WhatsApp muestra el error y bloquea el envío", async () => {
    const user = userEvent.setup();
    renderView(1);
    await fillTitular(user);

    const emergency = screen.getAllByPlaceholderText("Teléfono 10 dígitos")[0]!;
    await user.clear(emergency);
    await user.type(emergency, "2281234567");

    expect(
      await screen.findByText("El contacto de emergencia debe ser un número distinto al tuyo"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Completar Registro/ })).toBeDisabled();
  });

  it("con acompañante: envía al titular y al acompañante", async () => {
    const user = userEvent.setup();
    renderView(2);
    await fillTitular(user);
    await user.click(screen.getByText("Viajo acompañado"));

    await user.type(screen.getByPlaceholderText("Ej. Lizeth Colorado"), "Eva Torres");
    await user.type(screen.getAllByPlaceholderText("10 dígitos").at(-1)!, "2283334444");
    await user.type(screen.getAllByPlaceholderText("correo@ejemplo.com").at(-1)!, "eva@correo.mx");

    const submit = screen.getByRole("button", { name: /Completar Registro/ });
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(createBooking.mock.calls[0]![0]).toMatchObject({
      hasCompanions: true,
      companions: [
        expect.objectContaining({ fullName: "Eva Torres", whatsappPhone: "2283334444" }),
      ],
    });
  });
});
