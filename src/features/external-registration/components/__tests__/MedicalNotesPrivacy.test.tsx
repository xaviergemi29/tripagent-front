import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TourRegistrationView } from "../TourRegistrationView";

// Notas médicas en el Magic Link con un viajero que ya existía (2026-11-17). La búsqueda pública no
// devuelve las notas (LFPDPPP), así que el campo queda vacío: se avisa que las guardadas se conservan
// y el campo sigue editable. Además, la búsqueda del acompañante ya no borra lo que se escribió.

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("../../hooks/useBookings", () => ({
  useCreateBooking: () => ({ mutateAsync: vi.fn(async () => ({})), isPending: false }),
}));
const lookupTraveler = vi.fn<(phone: string) => Promise<object | null>>(async () => null);
vi.mock("../../hooks/usePublicTravelerLookup", () => ({
  usePublicTravelerLookup: () => ({ lookupTraveler }),
}));

const HINT = /no mostramos las notas médicas guardadas/;
const FOUND = {
  fullName: "Eva Torres",
  email: "eva@correo.mx",
  emergencyContactName: "Marta Ruiz",
  emergencyContactPhone: "+522285556666",
  birthDate: "1992-08-15",
};

const renderView = (prefillData: object | null = null) =>
  render(
    <TourRegistrationView
      token="tok"
      boardingPoints={[{ id: "bp-1", location: "Plaza Xalapeña", time: "06:00" }]}
      tourInfo={{
        title: "Huasteca",
        departureDateTime: "2026-12-20",
        currency: "MXN",
        reservedSeats: 2,
        priceTotalPerPassenger: 1500,
      }}
      agencyName="Viajes Xalapa"
      agencyPolicies={null}
      agencyPrivacyNoticeUrl={null}
      prefillData={prefillData}
    />,
  );

const titularNotes = () => screen.getAllByLabelText(/Notas Médicas/)[0]!;

beforeEach(() => {
  lookupTraveler.mockReset();
  lookupTraveler.mockResolvedValue(null);
});

describe("Notas médicas de un viajero que ya existía", () => {
  it("titular nuevo: sin aviso", async () => {
    const user = userEvent.setup();
    renderView();
    await user.type(screen.getByPlaceholderText("Ej. 2281234567"), "2281234567");
    await user.tab();

    await waitFor(() => expect(lookupTraveler).toHaveBeenCalled());
    expect(screen.queryByText(HINT)).not.toBeInTheDocument();
  });

  it("titular encontrado por WhatsApp: aviso con la agencia y campo editable (no gris)", async () => {
    const user = userEvent.setup();
    lookupTraveler.mockResolvedValue(FOUND);
    renderView();
    await user.type(screen.getByPlaceholderText("Ej. 2281234567"), "2281234567");
    await user.tab();

    const hint = await screen.findByText(HINT);
    expect(hint).toHaveTextContent("contacta a Viajes Xalapa");
    expect(titularNotes()).toHaveValue("");
    expect(titularNotes()).toBeEnabled();
    expect(titularNotes()).not.toHaveClass("cursor-not-allowed");
    expect(titularNotes()).toHaveAccessibleDescription(HINT);

    await user.type(titularNotes(), "Alergia a la penicilina");
    expect(titularNotes()).toHaveValue("Alergia a la penicilina");
  });

  it("titular precargado desde el apartado: aviso desde que abre", () => {
    renderView({ fullName: "Eva Torres", whatsappPhone: "+522281234567", medicalNotes: "" });

    expect(screen.getByText(HINT)).toBeInTheDocument();
  });

  it("acompañante nuevo: sin aviso", async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getByText("Viajo acompañado"));
    await user.type(screen.getAllByPlaceholderText("Número").at(-1)!, "2281422143");
    await user.tab();

    await waitFor(() => expect(lookupTraveler).toHaveBeenCalled());
    expect(screen.queryByText(HINT)).not.toBeInTheDocument();
  });

  it("acompañante encontrado: aviso y conserva las notas que ya había escrito", async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getByText("Viajo acompañado"));
    const companionNotes = screen.getAllByLabelText(/Notas Médicas/).at(-1)!;
    await user.type(companionNotes, "Se marea en carretera");

    lookupTraveler.mockResolvedValue(FOUND);
    await user.type(screen.getAllByPlaceholderText("Número").at(-1)!, "2281422143");
    await user.tab();

    await screen.findByText("Verificado");
    expect(screen.getByText(HINT)).toBeInTheDocument();
    expect(companionNotes).toHaveValue("Se marea en carretera");
  });
});
