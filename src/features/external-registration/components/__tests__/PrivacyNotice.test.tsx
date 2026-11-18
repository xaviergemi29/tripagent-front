import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TourRegistrationView } from "../TourRegistrationView";
import { bookingFormSchema } from "../../schemas/booking.schema";

// Casilla obligatoria de políticas y aviso de privacidad (regla 19; LFPDPPP: el registro incluye
// notas médicas). El enlace abre el modal con las políticas de la agencia; "Aceptar y continuar"
// marca la casilla y cerrar el modal no la cambia.

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("../../hooks/useBookings", () => ({
  useCreateBooking: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("../../hooks/usePublicTravelerLookup", () => ({
  usePublicTravelerLookup: () => ({ lookupTraveler: vi.fn() }),
}));

const POLICIES = "Anticipo no reembolsable.\n\nPresentarse 15 minutos antes de la salida.";

const renderView = ({
  policies = POLICIES,
  privacyNoticeUrl = "https://viajesxalapa.mx/privacidad",
}: { policies?: string | null; privacyNoticeUrl?: string | null } = {}) =>
  render(
    <TourRegistrationView
      token="tok"
      boardingPoints={[{ id: "bp-1", location: "Plaza Xalapeña", time: "06:00" }]}
      tourInfo={{ title: "Huasteca Potosina", departureDateTime: "2026-12-20", currency: "MXN" }}
      agencyName="Viajes Xalapa"
      agencyPolicies={policies}
      agencyPrivacyNoticeUrl={privacyNoticeUrl}
    />,
  );

// `hidden: true`: con el modal abierto, Radix marca el resto de la página con aria-hidden.
const checkbox = () =>
  screen.getByRole("checkbox", {
    name: "Acepto las políticas de viaje y el aviso de privacidad",
    hidden: true,
  });
const policiesLink = () =>
  screen.getByRole("button", { name: "Políticas de Viaje y Aviso de Privacidad" });

describe("Políticas y aviso de privacidad en el registro del Magic Link", () => {
  it("el enlace abre el modal sin marcar la casilla; el texto conserva sus saltos de línea", async () => {
    const user = userEvent.setup();
    renderView();

    expect(checkbox()).not.toBeChecked();
    await user.click(policiesLink());

    const dialog = await screen.findByRole("dialog", {
      name: "Políticas de Viaje y Aviso de Privacidad",
    });
    const text = within(dialog).getByText(/Anticipo no reembolsable/);
    expect(text.textContent).toBe(POLICIES);
    expect(text).toHaveClass("whitespace-pre-line");
    expect(
      within(dialog).getByRole("link", { name: "aviso de privacidad completo" }),
    ).toHaveAttribute("href", "https://viajesxalapa.mx/privacidad");
    expect(checkbox()).not.toBeChecked();
  });

  it("'Aceptar y continuar' cierra el modal y marca la casilla", async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(policiesLink());
    await user.click(await screen.findByRole("button", { name: "Aceptar y continuar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(checkbox()).toBeChecked();
  });

  it("cerrar con ✕ o con Esc no cambia la casilla", async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(policiesLink());
    await user.click(await screen.findByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(checkbox()).not.toBeChecked();

    // Si ya estaba marcada, cerrar tampoco la desmarca.
    await user.click(checkbox());
    await user.click(policiesLink());
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(checkbox()).toBeChecked();
  });

  it("sin políticas capturadas no inventa condiciones; sin enlace no muestra el aviso", async () => {
    const user = userEvent.setup();
    renderView({ policies: null, privacyNoticeUrl: null });

    await user.click(policiesLink());
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/aún no ha publicado sus políticas/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/no reembolsable/)).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("link")).not.toBeInTheDocument();
  });

  it("la casilla se puede marcar directamente", async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(checkbox());
    expect(checkbox()).toBeChecked();
  });

  it("el formulario no es válido sin aceptar las políticas", () => {
    const base = {
      token: "tok",
      mainClient: {
        fullName: "Ana Torres",
        whatsappPhone: "2281234567",
        email: "ana@correo.mx",
        emergencyContactName: "Luis Torres",
        emergencyContactPhone: "2281112222",
        medicalNotes: "",
        birthDate: "",
        boardingPoint: "Plaza Xalapeña (06:00)",
      },
      hasCompanions: false,
      companions: [],
    };

    const rejected = bookingFormSchema.safeParse({ ...base, privacyNoticeAccepted: false });
    expect(rejected.success).toBe(false);
    expect(JSON.stringify(rejected.error?.issues)).toContain(
      "Es necesario aceptar las políticas y el aviso de privacidad",
    );
    expect(
      bookingFormSchema
        .safeParse({ ...base, privacyNoticeAccepted: true })
        .error?.issues.some((i) => i.path.includes("privacyNoticeAccepted")) ?? false,
    ).toBe(false);
  });
});
