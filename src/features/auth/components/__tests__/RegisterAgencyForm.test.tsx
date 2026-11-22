import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterAgencyForm } from "../RegisterAgencyForm";
import { RegisterAgencyPageContent } from "../RegisterAgencyPageContent";

const mutate = vi.fn();
let mutationState: { isPending: boolean; error: { status: number; message: string } | null } = {
  isPending: false,
  error: null,
};
vi.mock("../../hooks/useRegisterAgency", () => ({
  useRegisterAgency: () => ({ mutate, reset: vi.fn(), ...mutationState }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));

beforeEach(() => {
  vi.clearAllMocks();
  mutationState = { isPending: false, error: null };
});

const fillForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("Tu nombre completo"), "Carlos Mendoza");
  await user.type(screen.getByLabelText("Nombre de tu agencia"), "Viajes Aventureros MX");
  await user.type(screen.getByLabelText("WhatsApp de contacto"), "228 123 4567");
  await user.type(screen.getByLabelText("Correo electrónico de acceso"), " Carlos@TuAgencia.com ");
  await user.type(screen.getByLabelText("Contraseña"), "secreta123");
};

describe("Registro de agencia (/registro)", () => {
  it("envía los datos con el WhatsApp en E.164, el país y el plan", async () => {
    const user = userEvent.setup();
    render(<RegisterAgencyForm plan="todo-incluido" />);

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /Activar mis 30 días gratis/ }));

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0]![0]).toEqual({
      fullName: "Carlos Mendoza",
      agencyName: "Viajes Aventureros MX",
      whatsapp: "+522281234567",
      whatsappCountry: "MX",
      email: "carlos@tuagencia.com",
      password: "secreta123",
      plan: "todo-incluido",
    });
  });

  it("valida los campos sin enviar (contraseña corta, correo, WhatsApp vacío)", async () => {
    const user = userEvent.setup();
    render(<RegisterAgencyForm plan="todo-incluido" />);

    await user.type(screen.getByLabelText("Correo electrónico de acceso"), "no-es-correo");
    await user.type(screen.getByLabelText("Contraseña"), "corta");
    await user.click(screen.getByRole("button", { name: /Activar mis 30 días gratis/ }));

    expect(await screen.findByText("Ingresa un correo electrónico válido")).toBeInTheDocument();
    expect(screen.getByText("La contraseña debe tener mínimo 8 caracteres")).toBeInTheDocument();
    expect(screen.getByText("Ingresa tu número de WhatsApp")).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("alterna mostrar/ocultar la contraseña", async () => {
    const user = userEvent.setup();
    render(<RegisterAgencyForm plan="todo-incluido" />);
    const password = screen.getByLabelText("Contraseña");
    expect(password).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
    expect(password).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "Ocultar contraseña" }));
    expect(password).toHaveAttribute("type", "password");
  });

  it("correo ya registrado (409): el mensaje va junto al correo con enlace al login", async () => {
    const user = userEvent.setup();
    mutate.mockImplementation((_body, options: { onError: (e: unknown) => void }) => {
      const error = { status: 409, message: "Este correo ya está registrado. Inicia sesión." };
      mutationState = { isPending: false, error };
      options.onError(error);
    });
    const { rerender } = render(<RegisterAgencyForm plan="todo-incluido" />);

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /Activar mis 30 días gratis/ }));
    rerender(<RegisterAgencyForm plan="todo-incluido" />);

    expect(
      await screen.findByText("Este correo ya está registrado. Inicia sesión."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a iniciar sesión" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("estado de carga: 'Creando cuenta de agencia...' y botón deshabilitado", () => {
    mutationState = { isPending: true, error: null };
    render(<RegisterAgencyForm plan="todo-incluido" />);
    expect(screen.getByRole("button", { name: /Creando cuenta de agencia/ })).toBeDisabled();
  });

  it("la página muestra el plan ($0 hoy, $999 al mes), las píldoras y los enlaces legales", () => {
    render(<RegisterAgencyPageContent plan="todo-incluido" />);
    expect(screen.getByText("$0 MXN")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Después de 30 días: \$999 MXN\/mes\. Sin contratos ni cargos automáticos\./,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/30 días gratis \(\$0 MXN hoy\) · Sin tarjeta/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Términos de Servicio" })).toHaveAttribute(
      "href",
      "/terminos",
    );
    expect(screen.getByRole("link", { name: "Aviso de Privacidad" })).toHaveAttribute(
      "href",
      "/privacidad",
    );
    // Aviso de privacidad simplificado (LFPDPPP arts. 15-16): TripAgent es el responsable.
    const notice = screen.getByRole("complementary", { name: "Aviso de privacidad simplificado" });
    expect(notice).toHaveTextContent("TripAgent MX, con domicilio en Xalapa, Veracruz, México");
    expect(notice).toHaveTextContent("No pedimos datos de salud");
    // Sin NEXT_PUBLIC_SUPPORT_WHATSAPP no se ofrece un WhatsApp falso.
    expect(screen.queryByText("Asistencia técnica en WhatsApp")).not.toBeInTheDocument();
  });
});
