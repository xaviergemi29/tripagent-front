import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgencyBankAccountsSection } from "../AgencyBankAccountsSection";
import type { BankAccountOutput } from "../../../schemas/bank-account.schema";

// Hooks reales (React Query + react-hook-form) contra un servidor simulado con estado que replica
// el contrato de `/agencies/bank-accounts` (límite de 2 y CLABE única → 409).
let accounts: BankAccountOutput[];
const post = vi.fn();
const patch = vi.fn();
const remove = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

const conflict = (message: string) => ({ status: 409, message });

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn(async () => structuredClone(accounts)),
    post: vi.fn(async (_url: string, body: Omit<BankAccountOutput, "id" | "position">) => {
      post(body);
      if (accounts.length >= 2) throw conflict("Puedes registrar hasta 2 cuentas bancarias");
      if (accounts.some((account) => account.clabeNumber === body.clabeNumber)) {
        throw conflict("Ya registraste una cuenta con esa CLABE");
      }
      const created = { ...body, id: crypto.randomUUID(), position: accounts.length + 1 };
      accounts = [...accounts, created];
      return structuredClone(created);
    }),
    patch: vi.fn(async (url: string, body: Partial<BankAccountOutput>) => {
      patch(url, body);
      const id = url.split("/").pop();
      accounts = accounts.map((account) => (account.id === id ? { ...account, ...body } : account));
      return structuredClone(accounts.find((account) => account.id === id));
    }),
    delete: vi.fn(async (url: string) => {
      remove(url);
      const id = url.split("/").pop();
      accounts = accounts.filter((account) => account.id !== id);
      return { id };
    }),
  },
}));
vi.mock("sonner", () => ({
  toast: {
    success: (...a: unknown[]) => toastSuccess(...a),
    error: (...a: unknown[]) => toastError(...a),
  },
}));

const account = (index: number, overrides: Partial<BankAccountOutput> = {}): BankAccountOutput => ({
  id: `00000000-0000-4000-8000-00000000000${index}`,
  position: index,
  bankName: `Banco ${index}`,
  accountHolder: "Bruji Tours SA",
  clabeNumber: `01218000123456789${index}`,
  cardNumber: null,
  ...overrides,
});

const renderSection = (canWrite = true) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <AgencyBankAccountsSection canWrite={canWrite} />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  accounts = [];
  for (const mock of [post, patch, remove, toastSuccess, toastError]) mock.mockClear();
});

describe("Configuración → Agencia → Cuentas bancarias", () => {
  it("sin cuentas: estado vacío y alta desde el CTA (CLABE y tarjeta solo con dígitos)", async () => {
    const user = userEvent.setup();
    renderSection();

    expect(await screen.findByText("Aún no tienes cuentas bancarias")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Agregar cuenta/ }));
    const dialog = await screen.findByRole("dialog", { name: "Agregar cuenta bancaria" });

    // Enviar vacío marca los obligatorios y no llama a la API.
    await user.click(within(dialog).getByRole("button", { name: "Guardar cuenta" }));
    expect(await within(dialog).findByText("El banco es obligatorio")).toBeInTheDocument();
    expect(within(dialog).getByText("El titular es obligatorio")).toBeInTheDocument();
    expect(within(dialog).getByText(/exactamente 18 números/)).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();

    await user.type(within(dialog).getByLabelText("Banco *"), " BBVA ");
    await user.type(within(dialog).getByLabelText("Titular de la cuenta *"), "Bruji Tours SA");
    await user.type(
      within(dialog).getByLabelText("CLABE interbancaria *"),
      "012-180-00123456789-1",
    );
    await user.type(within(dialog).getByLabelText(/Número de tarjeta/), "4152 3134 1234 5678");
    await user.click(within(dialog).getByRole("button", { name: "Guardar cuenta" }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0]![0]).toEqual({
      bankName: "BBVA",
      accountHolder: "Bruji Tours SA",
      clabeNumber: "012180001234567891",
      cardNumber: "4152313412345678",
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(toastSuccess).toHaveBeenCalledWith("Cuenta bancaria agregada", expect.anything());
    const list = await screen.findByRole("list", { name: "Cuentas bancarias" });
    expect(within(list).getByText("BBVA")).toBeInTheDocument();
    expect(within(list).getByText("CLABE 012 180 00123456789 1")).toBeInTheDocument();
    expect(within(list).getByText("Tarjeta •••• 5678")).toBeInTheDocument();
  });

  it("lista en orden; una cuenta migrada sin banco ni titular se muestra sin huecos", async () => {
    accounts = [account(1), account(2, { bankName: "", accountHolder: "" })];
    renderSection();

    const items = within(
      await screen.findByRole("list", { name: "Cuentas bancarias" }),
    ).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]!).getByText("Banco 1")).toBeInTheDocument();
    expect(within(items[1]!).getByText("Banco sin capturar")).toBeInTheDocument();
    expect(within(items[1]!).getByText("Titular sin capturar")).toBeInTheDocument();
    expect(screen.getByText(/Llegaste al máximo de 2 cuentas/)).toBeInTheDocument();
  });

  it("editar una cuenta migrada exige banco y titular y envía el PATCH", async () => {
    accounts = [account(1, { bankName: "", accountHolder: "" })];
    const user = userEvent.setup();
    renderSection();

    await user.click(
      await screen.findByRole("button", { name: "Editar cuenta Banco sin capturar" }),
    );
    const dialog = await screen.findByRole("dialog", { name: "Editar cuenta bancaria" });
    expect(within(dialog).getByLabelText("CLABE interbancaria *")).toHaveValue(
      "012180001234567891",
    );
    await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));
    expect(await within(dialog).findByText("El banco es obligatorio")).toBeInTheDocument();
    expect(patch).not.toHaveBeenCalled();

    await user.type(within(dialog).getByLabelText("Banco *"), "Santander");
    await user.type(within(dialog).getByLabelText("Titular de la cuenta *"), "Bruji Tours SA");
    await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch.mock.calls[0]).toEqual([
      `/agencies/bank-accounts/${accounts[0]!.id}`,
      {
        bankName: "Santander",
        accountHolder: "Bruji Tours SA",
        clabeNumber: "012180001234567891",
        cardNumber: null,
      },
    ]);
    expect(await screen.findByText("Santander")).toBeInTheDocument();
  });

  it("eliminar pide confirmación y quita la cuenta", async () => {
    accounts = [account(1), account(2)];
    const user = userEvent.setup();
    renderSection();

    await user.click(await screen.findByRole("button", { name: "Eliminar cuenta Banco 2" }));
    const confirm = await screen.findByRole("alertdialog");
    expect(confirm).toHaveTextContent("Banco 2 · CLABE 012 180 00123456789 2");
    await user.click(within(confirm).getByRole("button", { name: "Eliminar cuenta" }));

    await waitFor(() =>
      expect(remove).toHaveBeenCalledWith(`/agencies/bank-accounts/${account(2).id}`),
    );
    await waitFor(() => expect(screen.queryByText("Banco 2")).not.toBeInTheDocument());
    expect(toastSuccess).toHaveBeenCalledWith("Cuenta bancaria eliminada");
  });

  it("con 1 cuenta muestra el contador y permite agregar la segunda", async () => {
    accounts = [account(1)];
    renderSection();

    expect(await screen.findByText("1 de 2 cuentas registradas.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Agregar cuenta/ })).toBeEnabled();
  });

  it("con 2 cuentas deshabilita 'Agregar cuenta' y explica el límite", async () => {
    accounts = [1, 2].map((index) => account(index));
    renderSection();

    expect(await screen.findByText(/Llegaste al máximo de 2 cuentas/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Agregar cuenta/ })).toBeDisabled();
  });

  it("CLABE repetida (409): avisa con el mensaje de la API y conserva el diálogo abierto", async () => {
    accounts = [account(1)];
    const user = userEvent.setup();
    renderSection();

    await user.click(await screen.findByRole("button", { name: /Agregar cuenta/ }));
    const dialog = await screen.findByRole("dialog", { name: "Agregar cuenta bancaria" });
    await user.type(within(dialog).getByLabelText("Banco *"), "Nu");
    await user.type(within(dialog).getByLabelText("Titular de la cuenta *"), "Bruji Tours SA");
    await user.type(within(dialog).getByLabelText("CLABE interbancaria *"), account(1).clabeNumber);
    await user.click(within(dialog).getByRole("button", { name: "Guardar cuenta" }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("No se pudo agregar la cuenta bancaria", {
        description: "Ya registraste una cuenta con esa CLABE",
      }),
    );
    expect(screen.getByRole("dialog", { name: "Agregar cuenta bancaria" })).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Banco *")).toHaveValue("Nu");
  });

  it("Solo Lectura: se consultan las cuentas sin agregar, editar ni eliminar", async () => {
    accounts = [account(1)];
    renderSection(false);

    expect(await screen.findByText("Banco 1")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Agregar cuenta/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Editar cuenta/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Eliminar cuenta/ })).not.toBeInTheDocument();
  });
});
