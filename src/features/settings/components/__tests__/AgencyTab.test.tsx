import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AgencyTab } from "../AgencyTab";

const updateAgency = vi.fn(async () => ({}));
const agency = {
  id: "a1",
  name: "Bruji Tours",
  phone: "2288492011",
  email: "hola@brujitours.mx",
  address: null,
  bankName: "BBVA",
  bankAccountHolder: "Bruji Tours SA",
  clabeNumber: "012180001234567891",
  cardNumber: "4111111111111111",
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

describe("Configuración → Agencia: número de tarjeta opcional", () => {
  it("borrar la tarjeta envía cardNumber vacío (la API lo guarda como null)", async () => {
    const user = userEvent.setup();
    render(<AgencyTab />);

    expect(screen.getByLabelText(/Número de Tarjeta/)).toHaveAccessibleName(/opcional/);
    await user.clear(screen.getByLabelText(/Número de Tarjeta/));
    await user.click(screen.getByRole("button", { name: /Guardar/ }));

    await waitFor(() => expect(updateAgency).toHaveBeenCalledTimes(1));
    expect(updateAgency.mock.calls[0]).toEqual([
      expect.objectContaining({ cardNumber: "", clabeNumber: "012180001234567891" }),
    ]);
  });

  it("guarda el enlace al aviso de privacidad (A1)", async () => {
    updateAgency.mockClear();
    const user = userEvent.setup();
    render(<AgencyTab />);

    await user.type(
      screen.getByLabelText(/Enlace al aviso de privacidad/),
      "https://brujitours.mx/privacidad",
    );
    await user.click(screen.getByRole("button", { name: /Guardar/ }));

    await waitFor(() => expect(updateAgency).toHaveBeenCalledTimes(1));
    expect(updateAgency.mock.calls[0]).toEqual([
      expect.objectContaining({ privacyNoticeUrl: "https://brujitours.mx/privacidad" }),
    ]);
  });
});
