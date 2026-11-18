import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgencySetupBanner } from "../AgencySetupBanner";

/** Banner de `/tours` mientras la agencia no tenga CLABE (OBS-038, 2026-11-17). */
let agency: Record<string, unknown> | undefined;
vi.mock("@/features/settings/hooks/useAgency", () => ({
  useAgency: () => ({ data: agency }),
}));

describe("AgencySetupBanner", () => {
  beforeEach(() => {
    agency = undefined;
  });

  it("sin CLABE: invita a completar la agencia con enlace a Configuración", () => {
    agency = { clabeNumber: null };
    render(<AgencySetupBanner />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Completa los datos de tu agencia (logo y cuenta para transferencias) para que tus estados de cuenta y enlaces de pago salgan listos para cobrar.",
    );
    expect(screen.getByRole("link", { name: "Configurar" })).toHaveAttribute(
      "href",
      "/settings?tab=agency",
    );
  });

  it("con CLABE no se muestra", () => {
    agency = { clabeNumber: "012180001234567891" };
    render(<AgencySetupBanner />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("mientras carga (o si falló la consulta) no se muestra", () => {
    render(<AgencySetupBanner />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
