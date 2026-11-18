import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrandingSettingsCard } from "../BrandingSettingsCard";

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

// --- Dobles de prueba -------------------------------------------------------------------------
const updateBranding = vi.fn();
const uploadLogo = vi.fn();
const removeLogo = vi.fn();
let branding: {
  logoPath: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string | null;
} = {
  logoPath: null,
  primaryColor: "#4f46e5",
  secondaryColor: "#4338ca",
  accentColor: null,
};

vi.mock("../../../hooks/useAgencyBranding", () => ({
  useAgencyBranding: () => ({ data: branding, isLoading: false, isError: false }),
  useUpdateBranding: () => ({ mutate: updateBranding, isPending: false }),
  useUploadAgencyLogo: () => ({ mutate: uploadLogo, isPending: false }),
  useRemoveAgencyLogo: () => ({ mutate: removeLogo, isPending: false }),
}));

vi.mock("../../../hooks/useAgency", () => ({
  useAgency: () => ({ data: { name: "Bruji Tours" } }),
}));

const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: (...a: unknown[]) => toastError(...a) },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3001/api");
  branding = {
    logoPath: null,
    primaryColor: "#4f46e5",
    secondaryColor: "#4338ca",
    accentColor: null,
  };
});

const saveButton = () => screen.getByRole("button", { name: /Guardar Configuración/ });

describe("Identidad Visual para PDFs", () => {
  it("carga los colores guardados y no permite guardar sin cambios", () => {
    render(<BrandingSettingsCard />);

    expect(screen.getByLabelText("Color Primario de Marca")).toHaveValue("#4f46e5");
    expect(screen.getByLabelText("Color Secundario")).toHaveValue("#4338ca");
    expect(saveButton()).toBeDisabled();
  });

  it("elegir un color sugerido y guardar envía los colores normalizados", async () => {
    const user = userEvent.setup();
    render(<BrandingSettingsCard />);

    const [primarySwatches] = screen.getAllByRole("group", { name: /Colores sugeridos/ });
    await user.click(
      primarySwatches!.querySelector<HTMLButtonElement>('[aria-label="Usar #059669"]')!,
    );
    const secondary = screen.getByLabelText("Color Secundario");
    await user.clear(secondary);
    await user.type(secondary, "#ABC");

    await waitFor(() => expect(saveButton()).toBeEnabled());
    await user.click(saveButton());

    await waitFor(() =>
      expect(updateBranding).toHaveBeenCalledWith({
        primaryColor: "#059669",
        secondaryColor: "#aabbcc",
        accentColor: null,
      }),
    );
  });

  it("un color inválido muestra el error y bloquea Guardar", async () => {
    const user = userEvent.setup();
    render(<BrandingSettingsCard />);

    const primary = screen.getByLabelText("Color Primario de Marca");
    await user.clear(primary);
    await user.type(primary, "azul");

    expect(await screen.findByText(/color hexadecimal/)).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  it("sube un PNG al seleccionarlo y rechaza SVG o archivos de más de 2 MB", async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<BrandingSettingsCard />);
    const input = screen.getByTestId("logo-file-input");

    await user.upload(input, new File(["<svg/>"], "logo.svg", { type: "image/svg+xml" }));
    const big = new File(["x"], "grande.png", { type: "image/png" });
    Object.defineProperty(big, "size", { value: 2 * 1024 * 1024 + 1 });
    await user.upload(input, big);
    expect(uploadLogo).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledTimes(2);

    const png = new File(["png"], "logo.png", { type: "image/png" });
    await user.upload(input, png);
    expect(uploadLogo).toHaveBeenCalledWith(png);
  });

  it("muestra el logotipo guardado desde la API (fuera de /api) y permite quitarlo", async () => {
    branding = { ...branding, logoPath: "/uploads/logos/agency-1.png" };
    const user = userEvent.setup();
    render(<BrandingSettingsCard />);

    expect(screen.getByAltText("Logotipo actual de la agencia")).toHaveAttribute(
      "src",
      "http://localhost:3001/public/uploads/logos/agency-1.png",
    );
    await user.click(screen.getByRole("button", { name: /Quitar/ }));
    expect(removeLogo).toHaveBeenCalled();
  });

  it("el acento es opcional: se guarda normalizado y 'Quitar' lo deja en null (usa el secundario)", async () => {
    branding = { ...branding, accentColor: "#dc2626" };
    const user = userEvent.setup();
    render(<BrandingSettingsCard />);

    const accent = screen.getByLabelText("Color de Acento (opcional)");
    expect(accent).toHaveValue("#dc2626");

    await user.clear(accent);
    await user.type(accent, "#0F0");
    await waitFor(() => expect(saveButton()).toBeEnabled());
    await user.click(saveButton());
    await waitFor(() =>
      expect(updateBranding).toHaveBeenLastCalledWith(
        expect.objectContaining({ accentColor: "#00ff00" }),
      ),
    );

    await user.click(screen.getByRole("button", { name: "Quitar" }));
    expect(screen.getByText(/el PDF usa el color secundario/)).toBeInTheDocument();
    await user.click(saveButton());
    await waitFor(() =>
      expect(updateBranding).toHaveBeenLastCalledWith(
        expect.objectContaining({ accentColor: null }),
      ),
    );
  });
});
