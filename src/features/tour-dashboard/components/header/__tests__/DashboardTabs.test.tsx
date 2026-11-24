import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TourTabsNav } from "../TourTabsNav";
import { MobileTabsNav } from "../../mobile/MobileTabsNav";

const desktopProps = {
  activeTab: "lodging" as const,
  totalPassengers: 8,
  assignedSeatsCount: 3,
  requiresSeats: true,
  showLodging: true,
  lodgingPendingCount: 2,
  onTabChange: vi.fn(),
};

const mobileProps = {
  activeTab: "lodging" as const,
  totalPassengers: 8,
  assignedCount: 3,
  totalBookedPax: 8,
  requiresSeats: true,
  showLodging: true,
  lodgingPendingCount: 2,
  onTabChange: vi.fn(),
};

describe.each([
  [
    "escritorio",
    (onTabChange = vi.fn()) => <TourTabsNav {...desktopProps} onTabChange={onTabChange} />,
  ],
  [
    "celular",
    (onTabChange = vi.fn()) => <MobileTabsNav {...mobileProps} onTabChange={onTabChange} />,
  ],
])("pestañas del Centro de Control (%s)", (_name, renderNav) => {
  it("es un tablist con una sola pestaña seleccionada y tabulable", () => {
    render(renderNav());
    expect(
      screen.getByRole("tablist", { name: "Secciones del Centro de Control" }),
    ).toBeInTheDocument();
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(4);
    const selected = tabs.filter((tab) => tab.getAttribute("aria-selected") === "true");
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveTextContent("Hospedaje");
    expect(selected[0]).toHaveAttribute("tabindex", "0");
    expect(tabs.filter((tab) => tab !== selected[0]).every((tab) => tab.tabIndex === -1)).toBe(
      true,
    );
  });

  it("conserva el conteo de pendientes de Hospedaje", () => {
    render(renderNav());
    expect(screen.getByRole("tab", { name: /Hospedaje/ })).toHaveTextContent("2 pendientes");
  });

  it("cambia de pestaña con clic", async () => {
    const onTabChange = vi.fn();
    render(renderNav(onTabChange));
    await userEvent.click(screen.getByRole("tab", { name: /Abordaje/ }));
    expect(onTabChange).toHaveBeenCalledWith("boarding");
  });

  it("navega con flechas, Inicio y Fin (con vuelta al extremo)", async () => {
    const onTabChange = vi.fn();
    render(renderNav(onTabChange));
    screen.getByRole("tab", { name: /Hospedaje/ }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onTabChange).toHaveBeenLastCalledWith("boarding");
    await userEvent.keyboard("{Home}");
    expect(onTabChange).toHaveBeenLastCalledWith("passengers");
    await userEvent.keyboard("{ArrowLeft}");
    expect(onTabChange).toHaveBeenLastCalledWith("boarding");
    await userEvent.keyboard("{End}");
    expect(onTabChange).toHaveBeenLastCalledWith("boarding");
  });
});

describe("MobileTabsNav", () => {
  it("con cuatro pestañas usa cuatro columnas", () => {
    render(<MobileTabsNav {...mobileProps} />);
    expect(screen.getByRole("tablist")).toHaveClass("grid-cols-4");
  });

  it("sin asientos ni hospedaje usa dos columnas", () => {
    render(<MobileTabsNav {...mobileProps} requiresSeats={false} showLodging={false} />);
    expect(screen.getByRole("tablist")).toHaveClass("grid-cols-2");
    expect(screen.getAllByRole("tab")).toHaveLength(2);
  });
});
