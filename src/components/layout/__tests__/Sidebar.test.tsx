import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "../Sidebar";

// El rol bajo el nombre usa la misma etiqueta que Configuración → Seguridad (2026-11-16): antes
// mostraba el valor de la API en inglés ("Admin", "Sales", "Guide").

let role: string | undefined = "ADMIN";
vi.mock("next/navigation", () => ({ usePathname: () => "/tours" }));
vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({
    data: { fullName: "Xavier Ramos", role, agencyName: "Viajes Xalapa", agencyLogoPath: null },
    isLoading: false,
  }),
}));
vi.mock("@/features/auth/hooks/useAuth", () => ({
  useLogout: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("Sidebar: rol del usuario", () => {
  it.each([
    ["ADMIN", "Administrador"],
    ["SALES", "Ventas"],
    ["GUIDE", "Guía"],
  ])("%s → %s", (value, label) => {
    role = value;
    render(<Sidebar />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("sin rol muestra el texto de respaldo", () => {
    role = undefined;
    render(<Sidebar />);
    expect(screen.getByText("Operador")).toBeInTheDocument();
  });
});
