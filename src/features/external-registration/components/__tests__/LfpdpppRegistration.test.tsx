import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TourRegistrationView } from "../TourRegistrationView";

// LFPDPPP 2025 (PM, 2026-11-22): el registro del Magic Link no recaba datos de salud (dato sensible,
// art. 2-VI; exigiría consentimiento expreso y por escrito, art. 8), pide una sola casilla con la
// declaración de mayoría de edad y autorización de los acompañantes, y muestra el aviso de
// privacidad simplificado con el domicilio de la agencia responsable (arts. 15-16).

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("../../hooks/useBookings", () => ({
  useCreateBooking: () => ({ mutateAsync: vi.fn(async () => ({})), isPending: false }),
}));
vi.mock("../../hooks/usePublicTravelerLookup", () => ({
  usePublicTravelerLookup: () => ({ lookupTraveler: vi.fn(async () => null) }),
}));

const renderView = (
  props: { agencyAddress?: string | null; agencyPrivacyNoticeUrl?: string | null } = {},
) =>
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
      agencyPrivacyNoticeUrl={props.agencyPrivacyNoticeUrl ?? null}
      agencyAddress={props.agencyAddress ?? null}
    />,
  );

describe("Registro del Magic Link conforme a la LFPDPPP", () => {
  it("no pide notas médicas ni alergias, tampoco al agregar un acompañante", async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getByRole("button", { name: /Viajo acompañado/ }));
    // El acompañante tiene su propio formulario (nombre, WhatsApp, emergencia…), sin salud.
    expect(await screen.findByText(/Acompañante 1/i)).toBeInTheDocument();

    expect(screen.queryByLabelText(/notas médicas/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/alergias/i)).not.toBeInTheDocument();
  });

  it("una sola casilla combina la declaración de mayoría de edad y la aceptación", () => {
    renderView();
    const checkboxes = screen.getAllByRole("checkbox", { name: /Declaro ser mayor de edad/ });
    expect(checkboxes).toHaveLength(1);
    expect(
      screen.getByText(/ejercer la\s+patria potestad o tutela de los menores/),
    ).toBeInTheDocument();
  });

  it("muestra el aviso simplificado con la agencia responsable, su domicilio y TripAgent como plataforma", () => {
    renderView({ agencyAddress: "Av. Xalapa 100, Xalapa, Ver." });
    const notice = screen.getByRole("complementary", { name: "Aviso de privacidad simplificado" });
    expect(notice).toHaveTextContent(
      "Viajes Xalapa, con domicilio en Av. Xalapa 100, Xalapa, Ver., es responsable de los datos de tu grupo",
    );
    expect(notice).toHaveTextContent("la gestión logística de este viaje");
    expect(notice).toHaveTextContent("utilizando la plataforma tecnológica TripAgent MX");
    expect(notice).toHaveTextContent("No pedimos datos de salud");
    expect(screen.getByRole("link", { name: "Aviso de Privacidad integral" })).toHaveAttribute(
      "href",
      "/privacidad#viajeros",
    );
  });

  it("si la agencia tiene su propio aviso integral, el enlace apunta a él", () => {
    renderView({ agencyPrivacyNoticeUrl: "https://viajesxalapa.mx/privacidad" });
    expect(screen.getByRole("link", { name: "Aviso de Privacidad integral" })).toHaveAttribute(
      "href",
      "https://viajesxalapa.mx/privacidad",
    );
  });
});
