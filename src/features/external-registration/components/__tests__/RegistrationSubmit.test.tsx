import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TourRegistrationView } from "../TourRegistrationView";

// Registro del grupo en el Magic Link: "Completar Registro" se habilita solo con el formulario
// válido (incluida la casilla de políticas) y envía lo capturado, también con acompañante.

const createBooking = vi.fn<(body: Record<string, unknown>) => Promise<object>>(async () => ({}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("../../hooks/useBookings", () => ({
  useCreateBooking: () => ({ mutateAsync: createBooking, isPending: false }),
}));
const lookupTraveler = vi.fn<(phone: string) => Promise<object | null>>(async () => null);
vi.mock("../../hooks/usePublicTravelerLookup", () => ({
  usePublicTravelerLookup: () => ({ lookupTraveler }),
}));

const renderView = (reservedSeats: number) =>
  render(
    <TourRegistrationView
      token="tok"
      boardingPoints={[{ id: "bp-1", location: "Plaza Xalapeña", time: "06:00" }]}
      tourInfo={{
        title: "Huasteca",
        departureDateTime: "2026-12-20",
        currency: "MXN",
        reservedSeats,
        priceTotalPerPassenger: 1500,
      }}
      agencyName="Viajes Xalapa"
      agencyPolicies={null}
      agencyPrivacyNoticeUrl={null}
    />,
  );

const fillTitular = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByPlaceholderText("Ej. 2281234567"), "2281234567");
  await user.type(screen.getByPlaceholderText("Nombre y Apellidos"), "Ana Torres");
  await user.type(screen.getAllByPlaceholderText("correo@ejemplo.com")[0]!, "ana@correo.mx");
  await user.type(screen.getAllByPlaceholderText("Nombre del familiar")[0]!, "Luis Torres");
  await user.type(screen.getAllByPlaceholderText("Teléfono")[0]!, "2281112222");
  // Fecha de nacimiento obligatoria desde el 2026-11-17. La etiqueta ya está asociada al campo.
  fireEvent.change(screen.getAllByLabelText(/Fecha de Nacimiento/)[0]!, {
    target: { value: "1990-05-29" },
  });
  await user.click(screen.getAllByText("Plaza Xalapeña")[0]!);
  await user.click(
    screen.getByRole("checkbox", { name: /Declaro ser mayor de edad/, hidden: true }),
  );
};

beforeEach(() => {
  createBooking.mockClear();
  lookupTraveler.mockReset();
  lookupTraveler.mockResolvedValue(null);
});

describe("Registro del Magic Link", () => {
  it("titular: el botón se habilita al llenar y envía los datos", async () => {
    const user = userEvent.setup();
    renderView(1);
    const submit = screen.getByRole("button", { name: /Completar Registro/ });
    expect(submit).toBeDisabled();

    await fillTitular(user);
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(createBooking.mock.calls[0]![0]).toMatchObject({
      mainClient: {
        fullName: "Ana Torres",
        // Teléfonos en E.164 con su país.
        whatsappPhone: "+522281234567",
        whatsappCountry: "MX",
        emergencyContactPhone: "+522281112222",
        boardingPoint: "Plaza Xalapeña (06:00)",
      },
      privacyNoticeAccepted: true,
    });
  });

  it("un contacto de emergencia igual al propio WhatsApp muestra el error y bloquea el envío", async () => {
    const user = userEvent.setup();
    renderView(1);
    await fillTitular(user);

    const emergency = screen.getAllByPlaceholderText("Teléfono")[0]!;
    await user.clear(emergency);
    await user.type(emergency, "2281234567");

    expect(
      await screen.findByText("El contacto de emergencia debe ser un número distinto al tuyo"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Completar Registro/ })).toBeDisabled();
  });

  it("con acompañante: envía al titular y al acompañante", async () => {
    const user = userEvent.setup();
    renderView(2);
    await fillTitular(user);
    await user.click(screen.getByText("Viajo acompañado"));

    await user.type(screen.getByPlaceholderText("Ej. Lizeth Colorado"), "Eva Torres");
    await user.type(screen.getAllByPlaceholderText("Número").at(-1)!, "2283334444");
    await user.type(screen.getAllByPlaceholderText("correo@ejemplo.com").at(-1)!, "eva@correo.mx");
    fireEvent.change(screen.getAllByLabelText(/Fecha de Nacimiento/).at(-1)!, {
      target: { value: "1992-08-15" },
    });

    const submit = screen.getByRole("button", { name: /Completar Registro/ });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    expect(createBooking.mock.calls[0]![0]).toMatchObject({
      hasCompanions: true,
      companions: [
        expect.objectContaining({ fullName: "Eva Torres", whatsappPhone: "+522283334444" }),
      ],
    });
  });

  it("cada campo tiene su etiqueta y el autocompletado solo sugiere datos del titular", async () => {
    const user = userEvent.setup();
    renderView(2);
    await user.click(screen.getByText("Viajo acompañado"));

    // Titular: etiquetas asociadas y autocompletado de sus propios datos.
    const [titularName] = screen.getAllByLabelText(/Nombre Completo/);
    expect(titularName).toHaveAttribute("autocomplete", "name");
    expect(screen.getAllByLabelText(/Correo/)[0]).toHaveAttribute("autocomplete", "email");
    expect(screen.getAllByLabelText(/Fecha de Nacimiento/)[0]).toHaveAttribute(
      "autocomplete",
      "bday",
    );

    // Acompañante: también etiquetado, pero sin sugerir los datos del dueño del celular.
    const companionDate = screen.getAllByLabelText(/Fecha de Nacimiento/).at(-1)!;
    expect(companionDate).not.toBe(screen.getAllByLabelText(/Fecha de Nacimiento/)[0]);
    expect(companionDate).toHaveAttribute("autocomplete", "off");
    const companionPhone = screen.getAllByPlaceholderText("Número").at(-1)!;
    expect(companionPhone).toHaveAttribute("autocomplete", "off");
  });

  it("acompañante encontrado por WhatsApp: carga su correo, usa su propio contacto al desmarcar y habilita el envío", async () => {
    const user = userEvent.setup();
    renderView(2);
    await fillTitular(user);
    await user.click(screen.getByText("Viajo acompañado"));

    lookupTraveler.mockImplementation(async (phone) =>
      phone === "+522281422143"
        ? {
            fullName: "Eva Torres",
            email: "eva@correo.mx",
            emergencyContactName: "Marta Ruiz",
            emergencyContactPhone: "+522285556666",
            birthDate: "1992-08-15",
          }
        : null,
    );
    const companionPhone = screen.getAllByPlaceholderText("Número").at(-1)!;
    await user.type(companionPhone, "2281422143");
    await user.tab();

    // 1. El correo se muestra.
    await waitFor(() =>
      expect(screen.getAllByPlaceholderText("correo@ejemplo.com").at(-1)).toHaveValue(
        "eva@correo.mx",
      ),
    );
    // 3. Con los datos cargados, el botón se habilita.
    const submit = screen.getByRole("button", { name: /Completar Registro/ });
    await waitFor(() => expect(submit).toBeEnabled());

    // 2. Al desmarcar "mismo contacto", aparece el contacto propio del acompañante, no el del titular.
    await user.click(screen.getByLabelText(/Usar el mismo contacto de emergencia/));
    expect(screen.getAllByPlaceholderText("Nombre del familiar").at(-1)).toHaveValue("Marta Ruiz");
    expect(screen.getAllByPlaceholderText("Teléfono").at(-1)).toHaveValue("2285556666");

    await user.click(submit);
    expect(createBooking.mock.calls[0]![0]).toMatchObject({
      companions: [
        expect.objectContaining({
          email: "eva@correo.mx",
          emergencyContactName: "Marta Ruiz",
          emergencyContactPhone: "+522285556666",
        }),
      ],
    });
  });

  it("acompañante encontrado sin correo: el campo queda editable", async () => {
    const user = userEvent.setup();
    renderView(2);
    await fillTitular(user);
    await user.click(screen.getByText("Viajo acompañado"));
    lookupTraveler.mockResolvedValue({ fullName: "Eva Torres", email: "", birthDate: "" });

    await user.type(screen.getAllByPlaceholderText("Número").at(-1)!, "2281422143");
    await user.tab();
    await screen.findByText("Verificado");

    const email = screen.getAllByPlaceholderText("correo@ejemplo.com").at(-1)!;
    expect(email).toBeEnabled();
    expect(screen.getAllByLabelText(/Fecha de Nacimiento/).at(-1)).toBeEnabled();
  });

  it("desmarcar el mismo contacto sin acompañante encontrado deja los campos vacíos", async () => {
    const user = userEvent.setup();
    renderView(2);
    await fillTitular(user);
    await user.click(screen.getByText("Viajo acompañado"));

    await user.click(screen.getByLabelText(/Usar el mismo contacto de emergencia/));
    expect(screen.getAllByPlaceholderText("Nombre del familiar").at(-1)).toHaveValue("");
    expect(screen.getAllByPlaceholderText("Teléfono").at(-1)).toHaveValue("");
  });

  it("si el contacto del titular es el WhatsApp del acompañante, el error se ve aunque la casilla esté marcada", async () => {
    const user = userEvent.setup();
    renderView(2);
    await fillTitular(user); // contacto de emergencia del titular: 2281112222
    await user.click(screen.getByText("Viajo acompañado"));
    await user.type(screen.getAllByPlaceholderText("Número").at(-1)!, "2281112222");
    await user.tab();

    expect(
      await screen.findByText(/debe ser distinto al WhatsApp del acompañante.*Desmarca la casilla/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Completar Registro/ })).toBeDisabled();
  });

  it("con la casilla marcada, el acompañante sigue los cambios posteriores del contacto del titular", async () => {
    const user = userEvent.setup();
    renderView(2);
    await fillTitular(user);
    await user.click(screen.getByText("Viajo acompañado"));
    await user.type(screen.getByPlaceholderText("Ej. Lizeth Colorado"), "Eva Torres");
    await user.type(screen.getAllByPlaceholderText("Número").at(-1)!, "2283334444");
    await user.type(screen.getAllByPlaceholderText("correo@ejemplo.com").at(-1)!, "eva@correo.mx");
    fireEvent.change(screen.getAllByLabelText(/Fecha de Nacimiento/).at(-1)!, {
      target: { value: "1992-08-15" },
    });

    // El titular corrige su contacto de emergencia después de agregar al acompañante.
    const titularEmergencyName = screen.getAllByPlaceholderText("Nombre del familiar")[0]!;
    await user.clear(titularEmergencyName);
    await user.type(titularEmergencyName, "Rosa Méndez");
    const titularEmergencyPhone = screen.getAllByPlaceholderText("Teléfono")[0]!;
    await user.clear(titularEmergencyPhone);
    await user.type(titularEmergencyPhone, "2289990000");

    const submit = screen.getByRole("button", { name: /Completar Registro/ });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);
    expect(createBooking.mock.calls[0]![0]).toMatchObject({
      companions: [
        expect.objectContaining({
          emergencyContactName: "Rosa Méndez",
          emergencyContactPhone: "+522289990000",
          boardingPoint: "Plaza Xalapeña (06:00)",
        }),
      ],
    });
  });

  it("al eliminar un acompañante, el siguiente no hereda su 'Verificado' ni sus casillas", async () => {
    const user = userEvent.setup();
    renderView(3);
    await fillTitular(user);
    await user.click(screen.getByText("Viajo acompañado"));
    await user.click(screen.getByText(/Añadir otro acompañante/));

    // Acompañante 1: encontrado por WhatsApp y con contacto propio.
    lookupTraveler.mockResolvedValue({
      fullName: "Eva Torres",
      email: "eva@correo.mx",
      emergencyContactName: "Marta Ruiz",
      emergencyContactPhone: "+522285556666",
      birthDate: "1992-08-15",
    });
    await user.type(screen.getAllByPlaceholderText("Número")[0]!, "2281422143");
    await user.tab();
    await screen.findByText("Verificado");
    await user.click(screen.getAllByLabelText(/Usar el mismo contacto de emergencia/)[0]!);

    // Se elimina el acompañante 1: el 2 (antes en la posición 2) queda como estaba.
    const companion1 = screen.getByText("Acompañante 1").closest("div.relative")!;
    await user.click(companion1.querySelector("button")!);

    expect(screen.queryByText("Acompañante 2")).not.toBeInTheDocument();
    expect(screen.queryByText("Verificado")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Usar el mismo contacto de emergencia/)).toBeChecked();
    expect(screen.getByPlaceholderText("Ej. Lizeth Colorado")).toBeEnabled();
  });
});
