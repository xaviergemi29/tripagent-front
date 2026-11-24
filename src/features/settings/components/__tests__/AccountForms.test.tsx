import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SecurityTab } from "../SecurityTab";
import LoginPage from "@/app/(auth)/login/page";
import { PreBookingDialog } from "@/features/public-tours/components/PreBookingDialog";

// Formularios simples que corren compilados con el React Compiler: el botón se habilita al
// llenarlos, los errores se muestran y se envía lo escrito.

const changePassword = vi.fn(async () => ({}));
const login = vi.fn();
const preBook = vi.fn();
vi.mock("@/features/auth/hooks/useAuth", () => ({
  useChangePassword: () => ({ mutateAsync: changePassword, isPending: false }),
  useLogin: () => ({ mutate: login, isPending: false }),
}));
vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({
    data: { email: "ana@agencia.mx", role: "ADMIN", fullName: "Ana", agencyName: "Bruji Tours" },
  }),
}));
vi.mock("@/features/public-tours/hooks/usePreBooking", () => ({
  usePreBooking: () => ({ mutate: preBook, isPending: false, error: null, reset: vi.fn() }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => vi.clearAllMocks());

describe("Cambio de contraseña (SecurityTab)", () => {
  it("valida que coincidan, habilita el botón y envía la nueva contraseña", async () => {
    const user = userEvent.setup();
    render(<SecurityTab />);
    // La sesión mostrada es la del usuario real, no un texto fijo.
    expect(screen.getByText("ana@agencia.mx")).toBeInTheDocument();
    expect(screen.getByText("Administrador")).toBeInTheDocument();
    const submit = screen.getByRole("button", { name: /Actualizar Contraseña/ });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText("Contraseña Actual"), "anterior1");
    await user.type(screen.getByLabelText("Nueva Contraseña"), "nueva123");
    await user.type(screen.getByLabelText("Confirmar Nueva Contraseña"), "nueva12X");
    expect(await screen.findByText("Las contraseñas no coinciden")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Confirmar Nueva Contraseña"));
    await user.type(screen.getByLabelText("Confirmar Nueva Contraseña"), "nueva123");
    expect(submit).toBeEnabled();
    await user.click(submit);
    expect(changePassword).toHaveBeenCalledWith(
      expect.objectContaining({ currentPassword: "anterior1", newPassword: "nueva123" }),
    );
  });
});

describe("Login", () => {
  it("habilita el botón al llenar y envía correo y contraseña", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    const submit = screen.getByRole("button", { name: /Iniciar Sesión/ });
    expect(submit).toBeDisabled();

    await user.type(screen.getByPlaceholderText("admin@agencia.com"), "ana@agencia.mx");
    await user.type(screen.getByPlaceholderText("••••••••••••"), "secreta1");
    expect(submit).toBeEnabled();
    await user.click(submit);
    expect(login.mock.calls[0]![0]).toEqual({ email: "ana@agencia.mx", password: "secreta1" });
  });

  it("muestra el error de la API dentro del formulario y lo quita al corregir", async () => {
    // Antes `authError` nunca se asignaba: el aviso rojo no aparecía, solo el toast.
    login.mockImplementationOnce(
      (_data: unknown, options: { onError: (e: { status: number; message: string }) => void }) =>
        options.onError({ status: 401, message: "Credenciales inválidas" }),
    );
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByPlaceholderText("admin@agencia.com"), "ana@agencia.mx");
    await user.type(screen.getByPlaceholderText("••••••••••••"), "incorrecta");
    await user.click(screen.getByRole("button", { name: /Iniciar Sesión/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Credenciales inválidas");
    await user.type(screen.getByPlaceholderText("••••••••••••"), "1");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("Pre-reserva del folleto", () => {
  it("cabecera: el nombre largo del tour va en su propia línea, con la indicación de WhatsApp", () => {
    render(
      <PreBookingDialog
        tourId="t1"
        tourTitle="Zacatlán de las manzanas con cascadas"
        availableSeats={1}
        open
        onOpenChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("heading", { name: "Iniciar Reserva" })).toBeInTheDocument();
    expect(screen.getByText("Zacatlán de las manzanas con cascadas").tagName).toBe("P");
    expect(screen.getByText("Te contactamos por WhatsApp para confirmar.")).toBeInTheDocument();
    // Último lugar: aviso en ámbar.
    expect(screen.getByText("• Queda 1 lugar disponible").className).toMatch(/text-amber-600/);
    expect(screen.getByText(/Enlace seguro • Con tecnología TripAgent MX/)).toBeInTheDocument();
  });

  it("con otro país, el WhatsApp no promete '10 dígitos'", () => {
    render(
      <PreBookingDialog
        tourId="t1"
        tourTitle="Huasteca"
        availableSeats={10}
        open
        onOpenChange={vi.fn()}
        defaultPhoneCountry="US"
      />,
    );
    expect(screen.getByPlaceholderText("Tu número")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/10 dígitos/)).not.toBeInTheDocument();
  });

  it("muestra el aviso de privacidad simplificado con la agencia y su domicilio", () => {
    render(
      <PreBookingDialog
        tourId="t1"
        tourTitle="Huasteca"
        availableSeats={10}
        agencyName="Viajes Xalapa"
        agencyAddress="Av. Xalapa 100, Xalapa, Ver."
        open
        onOpenChange={vi.fn()}
      />,
    );
    const notice = screen.getByRole("complementary", { name: "Aviso de privacidad simplificado" });
    expect(notice.textContent).toMatch(
      /Viajes Xalapa, con domicilio en Av\. Xalapa 100, Xalapa, Ver\., es responsable de tu nombre y tu WhatsApp/,
    );
    expect(notice.textContent).toMatch(/TripAgent MX/);
    // Tarjeta de confianza; el aviso integral abre en otra pestaña para no perder lo capturado.
    expect(notice.className).toMatch(/rounded-2xl/);
    expect(screen.getByRole("link", { name: "Aviso de Privacidad integral" })).toHaveAttribute(
      "target",
      "_blank",
    );
  });

  it("arranca con el país del teléfono de la agencia", () => {
    render(
      <PreBookingDialog
        tourId="t1"
        tourTitle="Huasteca"
        availableSeats={10}
        open
        onOpenChange={vi.fn()}
        defaultPhoneCountry="CO"
      />,
    );
    expect(
      screen.getByRole("button", { name: /País del teléfono: Colombia \(\+57\)/ }),
    ).toBeTruthy();
  });

  it("marca los campos vacíos y envía lo capturado", async () => {
    const user = userEvent.setup();
    render(
      <PreBookingDialog
        tourId="t1"
        tourTitle="Huasteca"
        availableSeats={10}
        open
        onOpenChange={vi.fn()}
      />,
    );
    // El botón queda deshabilitado mientras falten el nombre o un WhatsApp válido (2026-11-22).
    const submit = screen.getByRole("button", { name: /Enviar solicitud/ });
    expect(submit).toBeDisabled();

    const name = screen.getByPlaceholderText("Tu nombre y apellido (ej. Mariana Ruiz)");
    await user.type(name, "Mariana Ruiz");
    const phone = screen.getByPlaceholderText("10 dígitos (ej. 228 123 4567)");
    await user.type(phone, "228123");
    expect(submit).toBeDisabled(); // número incompleto
    await user.type(phone, "4567");
    // Sin la declaración de mayoría de edad del titular sigue deshabilitado (2026-11-23).
    expect(submit).toBeDisabled();
    await user.click(
      screen.getByRole("checkbox", {
        name: "Declaro ser mayor de 18 años y aceptar los términos como titular responsable de esta reserva",
      }),
    );
    expect(submit).toBeEnabled();
    expect(preBook).not.toHaveBeenCalled();
    await user.click(submit);
    // El WhatsApp viaja completo (E.164) con su país; sin otro dato, el país inicial es México.
    expect(preBook.mock.calls[0]![0]).toEqual({
      fullName: "Mariana Ruiz",
      whatsapp: "+522281234567",
      whatsappCountry: "MX",
      numberPassengers: 1,
      adultDeclarationAccepted: true,
      tourId: "t1",
    });
  });
});
