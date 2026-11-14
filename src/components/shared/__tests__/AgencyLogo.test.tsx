import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgencyLogo } from "../AgencyLogo";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3001/api");
});

describe("AgencyLogo", () => {
  it("muestra el logotipo servido por la API (fuera de /api)", () => {
    render(<AgencyLogo logoPath="/uploads/logos/agency-1.png" agencyName="Bruji Tours" />);

    expect(screen.getByAltText("Logotipo de Bruji Tours")).toHaveAttribute(
      "src",
      "http://localhost:3001/public/uploads/logos/agency-1.png",
    );
  });

  it("sin logotipo muestra el ícono de respaldo", () => {
    const { container } = render(<AgencyLogo logoPath={null} agencyName="Bruji Tours" />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("si el archivo no carga, cambia al ícono de respaldo", () => {
    const { container } = render(
      <AgencyLogo logoPath="/uploads/logos/borrado.png" agencyName="Bruji Tours" />,
    );

    fireEvent.error(screen.getByAltText("Logotipo de Bruji Tours"));

    expect(screen.queryByAltText("Logotipo de Bruji Tours")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
