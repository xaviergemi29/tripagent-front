import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PublicBookingLayout } from "../PublicBookingLayout";

const renderLayout = (agencyWhatsApp: string | null = "2281234567") =>
  render(
    <PublicBookingLayout
      headerProps={{
        agencyName: "Viajes Xalapa",
        statusBadgeText: "Anticipo pendiente",
        statusVariant: "warning",
        tourTitle: "Cascadas de Cuetzalan",
        departureDate: "2026-11-14",
      }}
      footerProps={{
        agencyName: "Viajes Xalapa",
        agencyWhatsApp,
        whatsappMessage: "Hola, tengo dudas.",
      }}
    >
      <button type="button">Acción del estado</button>
    </PublicBookingLayout>,
  );

describe("PublicBookingLayout (Magic Link)", () => {
  it("encabezado: agencia, estado, tour y fecha con formatSpanishLongDate; sin 'Enlace seguro'", () => {
    renderLayout();
    const header = screen.getByRole("banner");

    expect(within(header).getByText("Viajes Xalapa")).toBeInTheDocument();
    expect(within(header).getByText("Anticipo pendiente")).toBeInTheDocument();
    expect(
      within(header).getByRole("heading", { name: "Cascadas de Cuetzalan" }),
    ).toBeInTheDocument();
    expect(within(header).getByText(/^Salida: Sábado, 14 de noviembre/)).toBeInTheDocument();
    expect(screen.queryByText(/enlace seguro/i)).not.toBeInTheDocument();
  });

  it("conserva el contenido del estado dentro de <main>", () => {
    renderLayout();
    expect(
      within(screen.getByRole("main")).getByRole("button", { name: "Acción del estado" }),
    ).toBeInTheDocument();
  });

  it("pie: asesor por WhatsApp con lada 52, mensaje de cercanía y atribución a TripAgent", () => {
    renderLayout();
    const footer = screen.getByRole("contentinfo");

    expect(
      within(footer).getByRole("link", { name: /Contactar asesor por WhatsApp/ }),
    ).toHaveAttribute("href", "https://wa.me/522281234567?text=Hola%2C%20tengo%20dudas.");
    expect(within(footer).getByText(/Estamos para ayudarte • Viajes Xalapa/)).toBeInTheDocument();
    expect(within(footer).getByText("TripAgent")).toBeInTheDocument();
  });

  it("sin teléfono de la agencia no muestra el botón del asesor", () => {
    renderLayout(null);
    expect(screen.queryByRole("link", { name: /Contactar asesor/ })).not.toBeInTheDocument();
  });
});
