import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgencyTab } from "../AgencyTab";

// Regresión (2026-11-15): con el React Compiler, el formulario mostraba lo que escribía el usuario
// pero enviaba los valores con los que se cargó ("Calle california #22" en lugar de "#100") y no
// mostraba errores. Aquí corren los hooks reales (React Query + react-hook-form); solo la red es
// un servidor simulado con estado.

const AGENCY = {
  id: "a1",
  name: "Bruji Tours",
  phone: "2294378318",
  email: "alfredo@brujitours.com",
  bankName: "BBVA Bancomer",
  bankAccountHolder: "Alfredo Villgas",
  address: "Calle california #22",
  clabeNumber: "111111111111111111",
  cardNumber: "7777777777777777",
  privacyNoticeUrl: null,
  logoPath: null,
  policies: null,
  subscriptionStatus: "trialing",
  trialEndsAt: null,
  isActive: true,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  deletedAt: null,
};

let stored: Record<string, unknown>;
const patch = vi.fn();
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn(async () => structuredClone(stored)),
    patch: vi.fn(async (_url: string, body: Record<string, unknown>) => {
      patch(body);
      stored = { ...stored, ...body };
      return structuredClone(stored);
    }),
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const renderTab = async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <AgencyTab />
    </QueryClientProvider>,
  );
  const address = await screen.findByLabelText(/Dirección Física/);
  await waitFor(() => expect(address).toHaveValue("Calle california #22"));
  return { address, card: screen.getByLabelText(/Número de Tarjeta/) };
};

beforeEach(() => {
  stored = structuredClone(AGENCY);
  patch.mockClear();
});

describe("AgencyTab: guarda lo que el usuario escribe", () => {
  it("envía la dirección y la tarjeta editadas, no las cargadas", async () => {
    const user = userEvent.setup();
    const { address, card } = await renderTab();

    await user.clear(address);
    await user.type(address, "Calle california #100");
    await user.clear(card);
    await user.type(card, "6666 6666 6666 6666");
    await user.click(screen.getByRole("button", { name: /Guardar/ }));

    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch.mock.calls[0]![0]).toMatchObject({
      address: "Calle california #100",
      cardNumber: "6666666666666666",
    });
  });

  it("un segundo guardado (después de recargar los datos) también envía lo escrito", async () => {
    const user = userEvent.setup();
    const { address } = await renderTab();

    await user.clear(address);
    await user.type(address, "Calle california #100");
    await user.click(screen.getByRole("button", { name: /Guardar/ }));
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));

    await user.clear(address);
    await user.type(address, "Calle california #200");
    await user.click(screen.getByRole("button", { name: /Guardar/ }));
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(2));
    expect(patch.mock.calls[1]![0]).toMatchObject({ address: "Calle california #200" });
  });

  it("una tarjeta de 19 dígitos muestra el error, deshabilita Guardar y no se envía", async () => {
    const user = userEvent.setup();
    const { card } = await renderTab();

    await user.clear(card);
    await user.type(card, "6666666666666666666");
    await user.click(screen.getByRole("button", { name: /Guardar/ }));

    expect(
      await screen.findByText("La tarjeta debe contener exactamente 16 números"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Guardar/ })).toBeDisabled();
    expect(patch).not.toHaveBeenCalled();
  });

  it("después de guardar, Guardar vuelve a deshabilitarse hasta el siguiente cambio", async () => {
    const user = userEvent.setup();
    const { address } = await renderTab();
    const save = screen.getByRole("button", { name: /Guardar/ });
    expect(save).toBeDisabled();

    await user.type(address, " bis");
    expect(save).toBeEnabled();
    await user.click(save);
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(save).toBeDisabled());
    expect(address).toHaveValue("Calle california #22 bis");
  });
});
