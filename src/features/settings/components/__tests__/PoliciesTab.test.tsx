import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PoliciesTab } from "../PoliciesTab";

// Cuenta operativa: estas pruebas no cubren el Modo Solo Lectura por suscripción
// (ver SubscriptionReadOnly.test.tsx).
vi.mock("@/features/settings/hooks/useSubscriptionAccess", () => ({
  SUBSCRIPTION_SETTINGS_HREF: "/settings?tab=subscription",
  useSubscriptionAccess: () => ({
    isReadOnly: false,
    isLoading: false,
    canWrite: true,
    subscription: undefined,
  }),
}));

const savePolicies = vi.fn();
let agency: { policies: string | null } = { policies: null };
vi.mock("../../hooks/useAgency", () => ({
  useAgency: () => ({ data: agency, isLoading: false, isError: false }),
  useUpdateAgencyPolicies: () => ({ mutate: savePolicies, isPending: false }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  agency = { policies: null };
});

const textarea = () => screen.getByLabelText("Políticas generales");
const saveButton = () => screen.getByRole("button", { name: /Guardar Políticas/ });

describe("Configuración → Políticas", () => {
  it("carga las políticas guardadas y no deja guardar sin cambios", () => {
    agency = { policies: "El anticipo no es reembolsable." };
    render(<PoliciesTab />);

    expect(textarea()).toHaveValue("El anticipo no es reembolsable.");
    expect(saveButton()).toBeDisabled();
  });

  it("guarda el texto recortado y respeta los saltos de línea", async () => {
    const user = userEvent.setup();
    render(<PoliciesTab />);

    await user.type(textarea(), "  Sin reembolsos.{enter}Llegar 15 min antes.  ");
    await waitFor(() => expect(saveButton()).toBeEnabled());
    await user.click(saveButton());

    await waitFor(() =>
      expect(savePolicies).toHaveBeenCalledWith({
        policies: "Sin reembolsos.\nLlegar 15 min antes.",
      }),
    );
  });

  it("vaciar el campo envía null (quita las políticas)", async () => {
    agency = { policies: "Texto anterior" };
    const user = userEvent.setup();
    render(<PoliciesTab />);

    await user.clear(textarea());
    await user.click(saveButton());

    await waitFor(() => expect(savePolicies).toHaveBeenCalledWith({ policies: null }));
  });

  it("más de 5000 caracteres marca el contador y bloquea Guardar", async () => {
    agency = { policies: "x".repeat(5001) };
    render(<PoliciesTab />);

    expect(screen.getByText("5,001 / 5,000")).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });
});
