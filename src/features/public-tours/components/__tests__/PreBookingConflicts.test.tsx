import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PreBookingDialog } from "../PreBookingDialog";
import type { ApiError } from "@/lib/api-client";

const post = vi.fn();
const refresh = vi.fn();

vi.mock("@/lib/api-client", () => ({ apiClient: { post: (...args: unknown[]) => post(...args) } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const AGENCY_PHONE = "+522281234567";

function renderDialog(availableSeats = 5, agencyPhone: string | null = AGENCY_PHONE) {
  const onOpenChange = vi.fn();
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <PreBookingDialog
        tourId="tour-1"
        tourTitle="Zacatlán de las manzanas"
        tourDepartureDate="2026-12-12"
        availableSeats={availableSeats}
        agencyPhone={agencyPhone}
        open
        onOpenChange={onOpenChange}
      />
    </QueryClientProvider>,
  );
  return { onOpenChange };
}

async function fillAndSubmit(seats = 3) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Nombre completo"), "Mariana Ruiz");
  await user.type(screen.getByLabelText("WhatsApp"), "2281234567");
  const seatsInput = screen.getByLabelText("Cantidad de lugares");
  await user.clear(seatsInput);
  await user.type(seatsInput, String(seats));
  await user.click(screen.getByRole("checkbox", { name: /Declaro ser mayor de 18 años/ }));
  await user.click(screen.getByRole("button", { name: "Enviar solicitud" }));
  return user;
}

const conflict = (overrides: Partial<ApiError>): ApiError => ({
  status: 409,
  message: "Conflicto",
  ...overrides,
});

describe("Iniciar Reserva: respuestas de la API sin cupo o cerrada", () => {
  beforeEach(() => {
    post.mockReset();
    refresh.mockReset();
  });

  it("sin lugares (CAPACITY_EXCEEDED con 0): reemplaza el formulario por 'Se agotaron los lugares' y ofrece WhatsApp", async () => {
    post.mockRejectedValue(conflict({ code: "CAPACITY_EXCEEDED", availableSeats: 0 }));
    const { onOpenChange } = renderDialog();

    const user = await fillAndSubmit();

    expect(await screen.findByText("Se agotaron los lugares")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enviar solicitud" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Nombre completo")).not.toBeInTheDocument();
    const whatsapp = screen.getByRole("link", { name: /Pedir que me avisen/ });
    expect(whatsapp.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/522281234567\?text=/);
    expect(decodeURIComponent(whatsapp.getAttribute("href")!)).toContain(
      "¿Podrían avisarme si se libera algún lugar?",
    );
    // El folleto de fondo se actualiza (contador y botón "Agotado").
    expect(refresh).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Volver al folleto" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("quedan menos lugares que los pedidos: conserva nombre y WhatsApp y ajusta la cantidad", async () => {
    post.mockRejectedValue(conflict({ code: "CAPACITY_EXCEEDED", availableSeats: 2 }));
    renderDialog();

    await fillAndSubmit(3);

    expect(await screen.findByText(/se apartaron algunos lugares/)).toBeInTheDocument();
    expect(screen.getByText("Quedan 2 lugares")).toBeInTheDocument();
    expect(screen.getByLabelText("Cantidad de lugares")).toHaveValue(2);
    expect(screen.getByLabelText("Nombre completo")).toHaveValue("Mariana Ruiz");
    expect(screen.getByRole("button", { name: "Agregar un lugar" })).toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    // Reenviar con la cantidad ajustada.
    post.mockResolvedValue({ success: true, message: "ok" });
    await userEvent.setup().click(screen.getByRole("button", { name: "Enviar solicitud" }));
    expect(await screen.findByText("¡Solicitud enviada!")).toBeInTheDocument();
    expect(post).toHaveBeenLastCalledWith(
      "/public/pre-booking",
      expect.objectContaining({ numberPassengers: 2, fullName: "Mariana Ruiz" }),
    );
  });

  it.each([
    ["el tour cerró las reservas (BOOKINGS_CLOSED)", conflict({ code: "BOOKINGS_CLOSED" })],
    ["el tour ya no está publicado (404)", { status: 404, message: "Tour no encontrado" }],
  ])("%s: muestra 'Ya no recibimos solicitudes en línea'", async (_label, apiError) => {
    post.mockRejectedValue(apiError);
    renderDialog();

    await fillAndSubmit();

    expect(await screen.findByText("Ya no recibimos solicitudes en línea")).toBeInTheDocument();
    const whatsapp = screen.getByRole("link", { name: /Escribir por WhatsApp/ });
    expect(decodeURIComponent(whatsapp.getAttribute("href")!)).toContain(
      "¿Me pueden dar información para reservar?",
    );
    expect(screen.queryByRole("button", { name: "Enviar solicitud" })).not.toBeInTheDocument();
  });

  it("sin teléfono de la agencia: no inventa un enlace de WhatsApp, solo 'Volver al folleto'", async () => {
    post.mockRejectedValue(conflict({ code: "CAPACITY_EXCEEDED", availableSeats: 0 }));
    renderDialog(5, null);

    await fillAndSubmit();

    expect(await screen.findByText("Se agotaron los lugares")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Volver al folleto" })).toBeInTheDocument();
  });

  it("WhatsApp ya inscrito (ALREADY_BOOKED): aviso junto al campo, que desaparece al corregir el número", async () => {
    post.mockRejectedValue(conflict({ code: "ALREADY_BOOKED" }));
    renderDialog();

    const user = await fillAndSubmit();

    expect(await screen.findByText(/ya tiene una solicitud para este viaje/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Escribir a la agencia/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre completo")).toHaveValue("Mariana Ruiz");

    await user.type(screen.getByLabelText("WhatsApp"), "8");
    await waitFor(() =>
      expect(screen.queryByText(/ya tiene una solicitud para este viaje/)).not.toBeInTheDocument(),
    );
  });

  it("otro error (429): se muestra el mensaje de la API en el aviso general y el formulario sigue", async () => {
    post.mockRejectedValue({
      status: 429,
      message: "Demasiados intentos. Vuelve a intentarlo en 60 minutos.",
    });
    renderDialog();

    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent("Demasiados intentos");
    expect(screen.getByRole("button", { name: "Enviar solicitud" })).toBeInTheDocument();
  });
});
