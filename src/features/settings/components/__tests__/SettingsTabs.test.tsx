import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsTabs } from "../SettingsTabs";

let tab = "subscription";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/settings",
  useSearchParams: () => new URLSearchParams(`tab=${tab}`),
}));
// Solo importa la barra: el contenido de cada pestaña se sustituye.
vi.mock("../AgencyTab", () => ({ AgencyTab: () => null }));
vi.mock("../SecurityTab", () => ({ SecurityTab: () => null }));
vi.mock("../PoliciesTab", () => ({ PoliciesTab: () => null }));
vi.mock("../branding/BrandingSettingsCard", () => ({ BrandingSettingsCard: () => null }));
vi.mock("../subscription/SubscriptionTab", () => ({ SubscriptionTab: () => null }));
vi.mock("../subscription/SubscriptionTabBadge", () => ({
  SubscriptionTabBadge: () => <span>Prueba 6d</span>,
}));

const scrollIntoView = vi.fn();
beforeEach(() => {
  tab = "subscription";
  scrollIntoView.mockClear();
  HTMLElement.prototype.scrollIntoView = scrollIntoView;
});

describe("Barra de pestañas de Configuración", () => {
  it("conserva textos, íconos e insignia, y en celular es una fila deslizable sin salto", () => {
    render(<SettingsTabs />);

    const list = screen.getByRole("tablist");
    expect(list.className).toMatch(/flex-nowrap/);
    expect(list.className).toMatch(/overflow-x-auto/);
    expect(list.className).toMatch(/lg:overflow-visible/);
    for (const name of [/Seguridad/, /Agencia/, /Políticas/, /Marca y PDFs/, /Suscripción/]) {
      expect(screen.getByRole("tab", { name })).toHaveClass("shrink-0", "min-h-11");
    }
    const active = screen.getByRole("tab", { name: /Suscripción/ });
    expect(active.className).toMatch(/data-active:bg-indigo-600/);
    expect(active.className).toMatch(/lg:data-active:border-indigo-600/);
    expect(active.className).toMatch(/focus-visible:ring-2/);
    {
    }
    expect(screen.getByRole("tab", { name: /Suscripción/ })).toHaveTextContent("Prueba 6d");
    expect(screen.getByRole("tab", { name: /Suscripción/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("centra la pestaña activa solo si la barra se desplaza (celular)", () => {
    const scrollWidth = vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(800);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(360);
    render(<SettingsTabs />);
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });

    // Escritorio: sin desbordamiento no se mueve nada.
    scrollIntoView.mockClear();
    scrollWidth.mockReturnValue(360);
    tab = "agency";
    render(<SettingsTabs />);
    expect(scrollIntoView).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});
