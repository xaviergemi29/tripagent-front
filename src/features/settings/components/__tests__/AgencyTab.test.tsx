import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AgencyTab } from "../AgencyTab";

// Cuenta operativa: estas pruebas no cubren el Modo Solo Lectura por suscripción
// (ver SubscriptionReadOnly.test.tsx y AgencyBankAccountsSection.test.tsx).
vi.mock("@/features/settings/hooks/useSubscriptionAccess", () => ({
  SUBSCRIPTION_SETTINGS_HREF: "/settings?tab=subscription",
  useSubscriptionAccess: () => ({
    isReadOnly: false,
    isLoading: false,
    canWrite: true,
    subscription: undefined,
  }),
}));

const updateAgency = vi.fn(async () => ({}));
const agency = {
  id: "a1",
  name: "Bruji Tours",
  phone: "2288492011",
  email: "hola@brujitours.mx",
  address: null,
  bankAccounts: [],
  logoPath: null,
  policies: null,
  subscriptionStatus: "trialing",
  trialEndsAt: null,
  isActive: true,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  deletedAt: null,
};
vi.mock("../../hooks/useAgency", () => ({
  useAgency: () => ({ data: agency, isLoading: false, isError: false }),
  useUpdateAgency: () => ({ mutateAsync: updateAgency, isPending: false }),
}));
vi.mock("../../hooks/useBankAccounts", () => ({
  useBankAccounts: () => ({ data: [], isLoading: false, isError: false }),
  useCreateBankAccount: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateBankAccount: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteBankAccount: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("Configuración → Agencia: perfil público", () => {
  it("ya no captura datos bancarios ni el aviso de privacidad, y no los envía", async () => {
    updateAgency.mockClear();
    const user = userEvent.setup();
    render(<AgencyTab />);

    expect(screen.queryByLabelText(/aviso de privacidad/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/CLABE/i)).not.toBeInTheDocument();
    // Sin cambios "Guardar" está deshabilitado: se edita un campo para poder guardar.
    await user.type(screen.getByLabelText(/Nombre Comercial/), " MX");
    await user.click(screen.getByRole("button", { name: /Guardar/ }));

    await waitFor(() => expect(updateAgency).toHaveBeenCalledTimes(1));
    const body = (updateAgency.mock.calls[0] as unknown[])[0];
    expect(body).toMatchObject({ name: "Bruji Tours MX", phone: "+522288492011" });
    for (const field of ["privacyNoticeUrl", "bankAccounts", "clabeNumber", "cardNumber"]) {
      expect(body).not.toHaveProperty(field);
    }
  });
});

describe("Configuración → Agencia: botón Guardar", () => {
  const saveButton = () => screen.getByRole("button", { name: /Guardar/ });

  it("sin cambios está deshabilitado", () => {
    render(<AgencyTab />);
    expect(saveButton()).toBeDisabled();
  });

  it("con un campo inválido (teléfono, correo) se deshabilita", async () => {
    const user = userEvent.setup();
    render(<AgencyTab />);

    await user.clear(screen.getByLabelText(/WhatsApp Oficial/));
    await user.type(screen.getByLabelText(/WhatsApp Oficial/), "228");
    await waitFor(() => expect(saveButton()).toBeDisabled());
    await user.clear(screen.getByLabelText(/WhatsApp Oficial/));
    await user.type(screen.getByLabelText(/WhatsApp Oficial/), "2288492012");
    await waitFor(() => expect(saveButton()).toBeEnabled());

    await user.clear(screen.getByLabelText(/Correo Electrónico/));
    await user.type(screen.getByLabelText(/Correo Electrónico/), "hola@");
    await waitFor(() => expect(saveButton()).toBeDisabled());
  });
});

describe("Configuración → Agencia: estructura responsive", () => {
  it("Perfil Público y Cuentas bancarias como tarjetas independientes", () => {
    render(<AgencyTab />);

    expect(screen.getByRole("heading", { name: "Perfil Público" })).toBeInTheDocument();
    expect(
      screen.getByText("Estos datos aparecerán en tus folletos digitales y mensajes de WhatsApp."),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cuentas bancarias" })).toBeInTheDocument();
    expect(screen.getByText("Transferencias SPEI")).toBeInTheDocument();
    expect(screen.getByLabelText(/WhatsApp Oficial/)).toHaveValue("2288492011");
    expect(screen.getByText(/se refleja de inmediato en los enlaces/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Guardar Configuración/ })).toHaveClass("w-full");
    // La sección de cuentas no vive dentro del formulario del perfil (sus diálogos no lo envían).
    expect(screen.getByRole("heading", { name: "Cuentas bancarias" }).closest("form")).toBeNull();
  });
});
