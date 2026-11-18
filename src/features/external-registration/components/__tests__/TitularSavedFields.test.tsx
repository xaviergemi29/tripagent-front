import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TourRegistrationView } from "../TourRegistrationView";

// Titular que ya existía en el Magic Link: solo se bloquean los datos que llegaron guardados.
// Antes la fecha se bloqueaba con lo que el cliente escribía (aunque fuera una fecha futura, que ya
// no podía corregir) y un correo vacío quedaba deshabilitado: el registro nunca se completaba.

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("../../hooks/useBookings", () => ({
  useCreateBooking: () => ({ mutateAsync: vi.fn(async () => ({})), isPending: false }),
}));
const lookupTraveler = vi.fn<(phone: string) => Promise<object | null>>(async () => null);
vi.mock("../../hooks/usePublicTravelerLookup", () => ({
  usePublicTravelerLookup: () => ({ lookupTraveler }),
}));

const renderView = (prefillData: object | null = null) =>
  render(
    <TourRegistrationView
      token="tok"
      boardingPoints={[{ id: "bp-1", location: "Plaza Xalapeña", time: "06:00" }]}
      tourInfo={{
        title: "Huasteca",
        departureDateTime: "2026-12-20",
        currency: "MXN",
        reservedSeats: 1,
        priceTotalPerPassenger: 1500,
      }}
      agencyName="Viajes Xalapa"
      agencyPolicies={null}
      agencyPrivacyNoticeUrl={null}
      prefillData={prefillData}
    />,
  );

const birthDate = () => screen.getByLabelText(/Fecha de Nacimiento/);
const email = () => screen.getByLabelText(/Correo Electrónico/);

beforeEach(() => {
  lookupTraveler.mockReset();
  lookupTraveler.mockResolvedValue(null);
});

describe("Titular que ya existía: campos bloqueados", () => {
  it("prellenado sin fecha: la fecha sigue editable aunque se escriba una inválida", async () => {
    renderView({ fullName: "Ana Torres", whatsappPhone: "+522281234567", email: "ana@correo.mx" });
    expect(email()).toBeDisabled();
    expect(birthDate()).toBeEnabled();

    fireEvent.change(birthDate(), { target: { value: "2099-01-01" } });
    // El error se pinta tras la validación (asíncrona): ese render es el que la bloqueaba.
    await screen.findByText("La fecha de nacimiento no puede ser futura");
    expect(birthDate()).toBeEnabled();
    fireEvent.change(birthDate(), { target: { value: "1990-05-10" } });
    expect(birthDate()).toHaveValue("1990-05-10");
  });

  it("prellenado con fecha: la fecha guardada queda bloqueada", () => {
    renderView({
      fullName: "Ana Torres",
      whatsappPhone: "+522281234567",
      email: "ana@correo.mx",
      birthDate: "1990-05-10",
    });
    expect(birthDate()).toBeDisabled();
  });

  it("encontrado por WhatsApp sin correo: el correo queda editable", async () => {
    lookupTraveler.mockResolvedValue({
      fullName: "Eva Torres",
      email: "",
      birthDate: "1992-08-15",
    });
    const user = userEvent.setup();
    renderView();
    await user.type(screen.getByPlaceholderText("Ej. 2281234567"), "2281234567");
    await user.tab();

    await screen.findByText("Cambiar / Editar");
    expect(email()).toBeEnabled();
    expect(birthDate()).toBeDisabled();
  });
});
