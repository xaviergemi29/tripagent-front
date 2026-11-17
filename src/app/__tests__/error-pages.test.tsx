import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import NotFound from "../not-found";
import Error from "../error";
import DashboardError from "../(dashboard)/error";

describe("Páginas de error", () => {
  it("404: en español, sin asumir sesión", () => {
    render(<NotFound />);
    expect(
      screen.getByRole("heading", { name: "Este enlace no está disponible" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir al panel" })).toHaveAttribute("href", "/tours");
  });

  it("error de ruta: 'Reintentar' llama a retry", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const retry = vi.fn();
    render(<Error error={new globalThis.Error("boom")} retry={retry} />);
    expect(screen.getByText("Algo salió mal")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("error dentro del panel: ofrece volver a Tours", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<DashboardError error={new globalThis.Error("boom")} retry={vi.fn()} />);
    expect(screen.getByRole("link", { name: "Ir a Tours" })).toHaveAttribute("href", "/tours");
  });
});
