import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TerminosPage from "@/app/(marketing)/terminos/page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn(), push: vi.fn() }) }));

beforeEach(() => {
  // jsdom no implementa IntersectionObserver ni scrollIntoView.
  window.IntersectionObserver = class {
    observe = vi.fn();
    disconnect = vi.fn();
  } as unknown as typeof IntersectionObserver;
  Element.prototype.scrollIntoView = vi.fn();
});

describe("/terminos", () => {
  it("muestra las 5 secciones con sus anclas, el resumen y el precio del plan", () => {
    render(<TerminosPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Términos y Condiciones de Servicio" }),
    ).toBeInTheDocument();
    for (const id of ["naturaleza", "prueba", "propiedad", "operacion", "soporte"]) {
      expect(document.getElementById(id)).not.toBeNull();
    }
    expect(screen.getByText(/Tú eres el dueño absoluto de tus listas/)).toBeInTheDocument();
    expect(screen.getByText(/\$999 MXN mensuales concluidos los 30 días/)).toBeInTheDocument();
    expect(screen.getByText("Garantía de Candado Suave (Soft-Lock)")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Crear mi cuenta gratis \(30 días\)/ }),
    ).toHaveAttribute("href", "/registro?plan=todo-incluido");
  });

  it("el índice marca la sección elegida y hace scroll suave hasta ella", async () => {
    const user = userEvent.setup();
    render(<TerminosPage />);
    const desktopNav = screen.getAllByRole("navigation", { name: "Contenido" })[1]!;

    await user.click(within(desktopNav).getByRole("link", { name: /Propiedad de los datos/ }));

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(
      within(desktopNav).getByRole("link", { name: /Propiedad de los datos/ }),
    ).toHaveAttribute("aria-current", "true");
    const mobileNav = screen.getAllByRole("navigation", { name: "Contenido" })[0]!;
    expect(within(mobileNav).getByRole("button", { name: "3. Propiedad" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });
});
