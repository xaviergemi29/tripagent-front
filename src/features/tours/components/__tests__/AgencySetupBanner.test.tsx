import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgencySetupBanner } from "../AgencySetupBanner";

/** Banner de `/tours` mientras la agencia no tenga cuentas bancarias (OBS-038, regla 22). */
let agency: Record<string, unknown> | undefined;
vi.mock("@/features/settings/hooks/useAgency", () => ({
  useAgency: () => ({ data: agency }),
}));

describe("AgencySetupBanner", () => {
  beforeEach(() => {
    agency = undefined;
  });

  it("sin cuentas bancarias: invita a completar la agencia con enlace a Configuración", () => {
    agency = { bankAccounts: [] };
    render(<AgencySetupBanner />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Completa los datos de tu agencia (logo y cuenta para transferencias) para que tus estados de cuenta y enlaces de pago salgan listos para cobrar.",
    );
    expect(screen.getByRole("link", { name: "Configurar" })).toHaveAttribute(
      "href",
      "/settings?tab=agency",
    );
  });

  it("con al menos una cuenta bancaria no se muestra", () => {
    agency = {
      bankAccounts: [
        {
          bankName: "BBVA",
          accountHolder: "Bruji Tours SA",
          clabeNumber: "012180001234567891",
          cardNumber: null,
        },
      ],
    };
    render(<AgencySetupBanner />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("mientras carga (o si falló la consulta) no se muestra", () => {
    render(<AgencySetupBanner />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
