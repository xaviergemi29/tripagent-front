import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PrivacidadPage from "@/app/(marketing)/privacidad/page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn(), push: vi.fn() }) }));

// Aviso integral (LFPDPPP DOF 20-03-2025; PM, 2026-11-22): contenido mínimo del art. 15.
describe("/privacidad", () => {
  it("identifica al responsable con domicilio en Xalapa y no trata datos sensibles", () => {
    render(<PrivacidadPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Aviso de Privacidad Integral" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/con domicilio en Xalapa, Veracruz, México/)).toBeInTheDocument();
    expect(screen.getByText("No tratamos datos personales sensibles.")).toBeInTheDocument();
  });

  it("plazos ARCO del art. 31 en días hábiles y la SABG como autoridad (nunca el INAI)", () => {
    const { container } = render(<PrivacidadPage />);
    const text = container.textContent ?? "";
    expect(text).toMatch(/20 días hábiles/);
    expect(text).toMatch(/15 días hábiles/);
    expect(text).toMatch(/artículo 31 de la LFPDPPP/);
    expect(text).toMatch(/Secretaría Anticorrupción y Buen\s+Gobierno/);
    expect(text).not.toMatch(/INAI/);
  });

  it("tiene la sección para viajeros que enlazan los avisos simplificados", () => {
    render(<PrivacidadPage />);
    const section = document.getElementById("viajeros");
    expect(section).not.toBeNull();
    expect(section!.textContent).toMatch(/agencia es la responsable/);
    expect(section!.textContent).toMatch(/encargado tecnológico/);
  });

  it("informa el enlace de solo consulta del staff y lo que no muestra", () => {
    render(<PrivacidadPage />);
    const text = document.getElementById("viajeros")!.textContent ?? "";
    expect(text).toMatch(/Acceso del staff del viaje/);
    expect(text).toMatch(/no muestra\s+teléfonos, correos, contactos de emergencia ni montos/);
  });
});
