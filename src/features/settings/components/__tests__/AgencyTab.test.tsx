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

  it("captura la tarjeta como en el ejemplo (con espacios) y la guarda solo con dígitos", async () => {
    updateAgency.mockClear();
    const user = userEvent.setup();
    render(<AgencyTab />);

    const card = screen.getByLabelText(/Número de Tarjeta/);
    await user.clear(card);
    await user.type(card, "4152 3134 1234 5678");
    expect(card).toHaveValue("4152 3134 1234 5678"); // ya no se corta a 16 caracteres
    await user.click(screen.getByRole("button", { name: /Guardar/ }));

    await waitFor(() => expect(updateAgency).toHaveBeenCalledTimes(1));
    expect(updateAgency.mock.calls[0]).toEqual([
      expect.objectContaining({ cardNumber: "4152313412345678" }),
    ]);
  });

  it("una CLABE pegada agrupada se guarda solo con dígitos", async () => {
    updateAgency.mockClear();
    const user = userEvent.setup();
    render(<AgencyTab />);

    const clabe = screen.getByLabelText(/CLABE Interbancaria/);
    await user.clear(clabe);
    await user.type(clabe, "012 180 00123456789 1");
    await user.click(screen.getByRole("button", { name: /Guardar/ }));

    await waitFor(() => expect(updateAgency).toHaveBeenCalledTimes(1));
    expect(updateAgency.mock.calls[0]).toEqual([
      expect.objectContaining({ clabeNumber: "012180001234567891" }),
    ]);
  });

  it("una tarjeta incompleta muestra el error y no se envía", async () => {
    updateAgency.mockClear();
    const user = userEvent.setup();
    render(<AgencyTab />);

    const card = screen.getByLabelText(/Número de Tarjeta/);
    await user.clear(card);
    await user.type(card, "4152 3134");
    await user.click(screen.getByRole("button", { name: /Guardar/ }));

    expect(
      await screen.findByText("La tarjeta debe contener exactamente 16 números"),
    ).toBeInTheDocument();
    expect(updateAgency).not.toHaveBeenCalled();
  });

  it("ya no captura el aviso de privacidad ni lo envía (la API conserva el valor guardado)", async () => {
    updateAgency.mockClear();
    const user = userEvent.setup();
    render(<AgencyTab />);

    expect(screen.queryByLabelText(/aviso de privacidad/i)).not.toBeInTheDocument();
    // Sin cambios "Guardar" está deshabilitado: se edita un campo para poder guardar.
    await user.type(screen.getByLabelText(/Nombre Comercial/), " MX");
    await user.click(screen.getByRole("button", { name: /Guardar/ }));

    await waitFor(() => expect(updateAgency).toHaveBeenCalledTimes(1));
    expect((updateAgency.mock.calls[0] as unknown[])[0]).not.toHaveProperty("privacyNoticeUrl");
  });
});

describe("Configuración → Agencia: botón Guardar", () => {
  const saveButton = () => screen.getByRole("button", { name: /Guardar/ });

  it("sin cambios está deshabilitado", () => {
    render(<AgencyTab />);
    expect(saveButton()).toBeDisabled();
  });

  it("con la tarjeta inválida se deshabilita y se vuelve a habilitar al corregirla", async () => {
    const user = userEvent.setup();
    render(<AgencyTab />);
    const card = screen.getByLabelText(/Número de Tarjeta/);

    await user.clear(card);
    await user.type(card, "4152 3134");
    expect(
      await screen.findByText("La tarjeta debe contener exactamente 16 números"),
    ).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();

    await user.type(card, " 1234 5678");
    await waitFor(() => expect(saveButton()).toBeEnabled());
    expect(
      screen.queryByText("La tarjeta debe contener exactamente 16 números"),
    ).not.toBeInTheDocument();
  });

  it("con cualquier otro campo inválido también se deshabilita (CLABE, teléfono, correo)", async () => {
    const user = userEvent.setup();
    render(<AgencyTab />);

    await user.clear(screen.getByLabelText(/CLABE Interbancaria/));
    await user.type(screen.getByLabelText(/CLABE Interbancaria/), "0121");
    expect(await screen.findByText(/exactamente 18 números/)).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
    await user.clear(screen.getByLabelText(/CLABE Interbancaria/));
    await user.type(screen.getByLabelText(/CLABE Interbancaria/), "012180001234567899");
    await waitFor(() => expect(saveButton()).toBeEnabled());

    await user.clear(screen.getByLabelText(/WhatsApp Oficial/));
    await user.type(screen.getByLabelText(/WhatsApp Oficial/), "228");
    await waitFor(() => expect(saveButton()).toBeDisabled());
    await user.clear(screen.getByLabelText(/WhatsApp Oficial/));
    await user.type(screen.getByLabelText(/WhatsApp Oficial/), "2288492011");

    await user.clear(screen.getByLabelText(/Correo Electrónico/));
    await user.type(screen.getByLabelText(/Correo Electrónico/), "hola@");
    await waitFor(() => expect(saveButton()).toBeDisabled());
  });
});

describe("Configuración → Agencia: estructura responsive", () => {
  it("dos tarjetas (Perfil Público y Datos Bancarios) con los textos de siempre y la nota", () => {
    render(<AgencyTab />);

    expect(screen.getByRole("heading", { name: "Perfil Público" })).toBeInTheDocument();
    expect(
      screen.getByText("Estos datos aparecerán en tus folletos digitales y mensajes de WhatsApp."),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Datos Bancarios" })).toBeInTheDocument();
    expect(screen.getByText("Transferencias SPEI")).toBeInTheDocument();
    expect(screen.getByText("18 dígitos SPEI")).toBeInTheDocument();
    // "+52" es solo visual: el campo conserva los 10 dígitos guardados.
    expect(screen.getByText("+52")).toBeInTheDocument();
    expect(screen.getByLabelText(/WhatsApp Oficial/)).toHaveValue("2288492011");
    expect(screen.getByText(/se refleja de inmediato en los enlaces/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Guardar Configuración/ })).toHaveClass("w-full");
  });
});
