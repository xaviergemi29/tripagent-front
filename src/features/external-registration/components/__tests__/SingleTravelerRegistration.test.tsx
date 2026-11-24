import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { TourRegistrationView } from "../TourRegistrationView";

// Registro del Magic Link con UN solo viajero (1 lugar apartado, o "Viajo solo" con más lugares):
// llenado en cualquier orden, envíos a medias, teléfonos cruzados y búsqueda por WhatsApp.

const refresh = vi.fn();
const createBooking = vi.fn<(body: Record<string, unknown>) => Promise<object>>(async () => ({}));
const lookupTraveler = vi.fn<(phone: string) => Promise<object | null>>(async () => null);
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("../../hooks/useBookings", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../hooks/useBookings")>()),
  useCreateBooking: () => ({ mutateAsync: createBooking, isPending: false }),
}));
vi.mock("../../hooks/usePublicTravelerLookup", () => ({
  usePublicTravelerLookup: () => ({ lookupTraveler }),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const renderView = (reservedSeats = 1) =>
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
        depositPerPassenger: 500,
      }}
      agencyName="Viajes Xalapa"
    />,
  );

type User = ReturnType<typeof userEvent.setup>;

const field = {
  whatsapp: () => screen.getByPlaceholderText("Ej. 2281234567"),
  name: () => screen.getByPlaceholderText("Nombre y Apellidos"),
  email: () => screen.getByPlaceholderText("correo@ejemplo.com"),
  birth: () => screen.getByLabelText(/Fecha de Nacimiento/),
  emergencyName: () => screen.getByPlaceholderText("Nombre del familiar"),
  emergencyPhone: () => screen.getByPlaceholderText("Teléfono"),
};

const step = {
  whatsapp: (user: User, value = "2281234567") => user.type(field.whatsapp(), value),
  name: (user: User) => user.type(field.name(), "Ana Torres"),
  email: (user: User, value = "ana@correo.mx") => user.type(field.email(), value),
  birth: (value = "1990-05-29") => fireEvent.change(field.birth(), { target: { value } }),
  pickup: (user: User) => user.click(screen.getByText("Plaza Xalapeña")),
  emergencyName: (user: User) => user.type(field.emergencyName(), "Luis Torres"),
  emergencyPhone: (user: User, value = "2281112222") => user.type(field.emergencyPhone(), value),
  privacy: (user: User) =>
    user.click(screen.getByRole("checkbox", { name: /Declaro ser mayor de edad/, hidden: true })),
};

const submitButton = () => screen.getByRole("button", { name: /Completar Registro/ });
const errorTexts = () => screen.queryAllByRole("alert").map((alert) => alert.textContent);

const expectedPayload = {
  token: "tok",
  hasCompanions: false,
  companions: [],
  privacyNoticeAccepted: true,
  mainClient: expect.objectContaining({
    fullName: "Ana Torres",
    whatsappPhone: "+522281234567",
    whatsappCountry: "MX",
    email: "ana@correo.mx",
    birthDate: "1990-05-29",
    boardingPoint: "Plaza Xalapeña (06:00)",
    emergencyContactName: "Luis Torres",
    emergencyContactPhone: "+522281112222",
    emergencyContactCountry: "MX",
  }),
};

beforeEach(() => {
  refresh.mockClear();
  createBooking.mockReset();
  createBooking.mockResolvedValue({});
  lookupTraveler.mockReset();
  lookupTraveler.mockResolvedValue(null);
  vi.mocked(toast.error).mockClear();
  Element.prototype.scrollIntoView = vi.fn();
});

describe("Un solo viajero: llenado en desorden", () => {
  it("sin campos ni errores de acompañantes, y con el total de 1 viajero", () => {
    renderView();
    expect(screen.queryByText(/Acompañante/)).not.toBeInTheDocument();
    expect(screen.getByText("1 lugar apartado")).toBeInTheDocument();
    expect(screen.getByText("Anticipo hoy")).toBeInTheDocument();
    expect(screen.getByText("$500.00 MXN")).toBeInTheDocument();
    expect(screen.getByText(/Total: \$1,500\.00 MXN/)).toBeInTheDocument();
    expect(screen.getByText("(1 viajero)")).toBeInTheDocument();
  });

  it("aviso de privacidad, punto, fecha, nombre, WhatsApp, correo y emergencia al final", async () => {
    const user = userEvent.setup();
    renderView();
    await step.privacy(user);
    await step.pickup(user);
    step.birth();
    await step.name(user);
    await step.whatsapp(user);
    expect(errorTexts()).toEqual([]);
    await step.email(user);
    await step.emergencyName(user);
    await step.emergencyPhone(user);
    await waitFor(() => expect(errorTexts()).toEqual([]));

    await user.click(submitButton());
    expect(createBooking).toHaveBeenCalledTimes(1);
    expect(createBooking.mock.calls[0]![0]).toEqual(expectedPayload);
  });

  it("emergencia antes que el WhatsApp propio, y correo al final", async () => {
    const user = userEvent.setup();
    renderView();
    await step.emergencyPhone(user);
    await step.emergencyName(user);
    await step.whatsapp(user);
    await step.birth();
    await step.name(user);
    await step.pickup(user);
    await step.privacy(user);
    expect(errorTexts()).toEqual([]);
    await step.email(user);
    await waitFor(() => expect(errorTexts()).toEqual([]));

    await user.click(submitButton());
    expect(createBooking.mock.calls[0]![0]).toEqual(expectedPayload);
  });

  it("escribir el WhatsApp primero no marca el teléfono de emergencia que aún no se llena", async () => {
    const user = userEvent.setup();
    renderView();
    await step.whatsapp(user);
    expect(errorTexts()).toEqual([]);
    // Elegir el país del contacto de emergencia (vacío) tampoco marca los campos vacíos.
    await user.click(screen.getAllByRole("button", { name: /País del teléfono/ })[1]!);
    await user.click(screen.getByRole("option", { name: /Estados Unidos/ }));
    expect(errorTexts()).toEqual([]);
  });

  it("emergencia igual al WhatsApp: el error aparece y se quita al cambiar cualquiera de los dos", async () => {
    const user = userEvent.setup();
    renderView();
    await step.whatsapp(user);
    await step.emergencyPhone(user, "2281234567");
    const sameError = "El contacto de emergencia debe ser un número distinto al tuyo";
    expect(await screen.findByText(sameError)).toBeInTheDocument();

    // Se corrige el WhatsApp propio.
    await user.clear(field.whatsapp());
    await user.type(field.whatsapp(), "2289998888");
    await waitFor(() => expect(screen.queryByText(sameError)).not.toBeInTheDocument());

    // Se vuelve a igualar escribiendo el WhatsApp después: el error regresa y se corrige en emergencia.
    await user.clear(field.whatsapp());
    await user.type(field.whatsapp(), "2281234567");
    expect(await screen.findByText(sameError)).toBeInTheDocument();
    await user.clear(field.emergencyPhone());
    await user.type(field.emergencyPhone(), "2281112222");
    await waitFor(() => expect(screen.queryByText(sameError)).not.toBeInTheDocument());
  });

  it("enviar a medias varias veces: cada intento nombra lo pendiente, enfoca el primer error y limpia lo corregido", async () => {
    const user = userEvent.setup();
    renderView();
    await step.emergencyName(user);
    await user.click(submitButton());
    expect(await screen.findByText("Ingresa tu WhatsApp")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Para completar tu registro marca la casilla de declaración y aceptación del aviso de privacidad.",
      ),
    ).toBeInTheDocument();
    expect(toast.error).toHaveBeenLastCalledWith(
      "Revisa los campos marcados en rojo",
      expect.objectContaining({ description: "Pendiente en: Titular, Aviso de privacidad." }),
    );
    await waitFor(() => expect(field.whatsapp()).toHaveFocus());

    // Intento 2: se completa solo la casilla; el error de la casilla desaparece al marcarla.
    await step.privacy(user);
    expect(screen.queryByText(/marca la casilla de declaración/)).not.toBeInTheDocument();
    await user.click(submitButton());
    expect(toast.error).toHaveBeenLastCalledWith(
      "Revisa los campos marcados en rojo",
      expect.objectContaining({ description: "Pendiente en: Titular." }),
    );

    // Intento 3: WhatsApp; el primer pendiente pasa a ser el nombre.
    await step.whatsapp(user);
    expect(screen.queryByText("Ingresa tu WhatsApp")).not.toBeInTheDocument();
    await user.click(submitButton());
    await waitFor(() => expect(field.name()).toHaveFocus());

    // Intento 4: todo lo demás menos el teléfono de emergencia.
    await step.name(user);
    await step.email(user);
    step.birth();
    await step.pickup(user);
    await user.click(submitButton());
    expect(await screen.findByText("Ingresa el teléfono de emergencia")).toBeInTheDocument();
    expect(errorTexts()).toEqual(["Ingresa el teléfono de emergencia"]);
    await waitFor(() => expect(field.emergencyPhone()).toHaveFocus());

    await step.emergencyPhone(user);
    await waitFor(() => expect(errorTexts()).toEqual([]));
    await user.click(submitButton());
    expect(createBooking).toHaveBeenCalledTimes(1);
    expect(createBooking.mock.calls[0]![0]).toEqual(expectedPayload);
  });

  it("borrar un campo ya válido después de un intento de envío lo marca de nuevo y al reescribirlo se quita", async () => {
    const user = userEvent.setup();
    renderView();
    await step.whatsapp(user);
    await step.name(user);
    await step.email(user);
    step.birth();
    await step.pickup(user);
    await step.emergencyName(user);
    await step.emergencyPhone(user);
    await user.click(submitButton());
    expect(await screen.findByText(/marca la casilla de declaración/)).toBeInTheDocument();

    await user.clear(field.name());
    expect(await screen.findByText("El nombre completo es obligatorio")).toBeInTheDocument();
    step.birth("");
    expect(await screen.findByText("La fecha de nacimiento es obligatoria")).toBeInTheDocument();

    await user.type(field.name(), "Ana Torres");
    step.birth("1990-05-29");
    await step.privacy(user);
    await waitFor(() => expect(errorTexts()).toEqual([]));
    await user.click(submitButton());
    expect(createBooking.mock.calls[0]![0]).toEqual(expectedPayload);
  });

  it("fecha de nacimiento escrita, borrada y vuelta a escribir; una fecha futura se rechaza", async () => {
    const user = userEvent.setup();
    renderView();
    step.birth("2099-01-01");
    expect(
      await screen.findByText("La fecha de nacimiento no puede ser futura"),
    ).toBeInTheDocument();
    step.birth("");
    expect(await screen.findByText("La fecha de nacimiento es obligatoria")).toBeInTheDocument();
    step.birth("1990-05-29");
    await waitFor(() => expect(errorTexts()).toEqual([]));
    await user.click(submitButton());
    expect(createBooking).not.toHaveBeenCalled();
  });

  it("'Viajo solo' con varios lugares apartados envía solo al titular, sin acompañantes ni sus errores", async () => {
    const user = userEvent.setup();
    renderView(3);
    // Se abre y se cierra la lista de acompañantes sin llenarla.
    await user.click(screen.getByText("Viajo acompañado"));
    await user.click(screen.getByText("Viajo solo"));
    expect(screen.queryByText(/Acompañante 1/)).not.toBeInTheDocument();

    await step.whatsapp(user);
    await step.name(user);
    await step.email(user);
    step.birth();
    await step.pickup(user);
    await step.emergencyName(user);
    await step.emergencyPhone(user);
    await step.privacy(user);
    expect(errorTexts()).toEqual([]);
    await user.click(submitButton());
    expect(createBooking.mock.calls[0]![0]).toEqual(expectedPayload);
    // Los 3 lugares siguen apartados hasta que la agencia libere los que sobren.
    expect(screen.getByText("(3 viajeros)")).toBeInTheDocument();
  });
});

describe("Un solo viajero: validaciones del formulario", () => {
  const fillAll = async (user: User, overrides: { name?: string; email?: string } = {}) => {
    await step.whatsapp(user);
    await user.type(field.name(), overrides.name ?? "Ana Torres");
    await step.email(user, overrides.email);
    step.birth();
    await step.pickup(user);
    await step.emergencyName(user);
    await step.emergencyPhone(user);
    await step.privacy(user);
  };

  it("un espacio al final del correo se recorta y el payload sale limpio", async () => {
    const user = userEvent.setup();
    renderView();
    await fillAll(user, { email: "ana@correo.mx " });
    expect(errorTexts()).toEqual([]);
    await user.click(submitButton());
    expect(createBooking.mock.calls[0]![0]).toEqual(expectedPayload);
  });

  it("un nombre de solo espacios o de menos de 3 letras se rechaza en el front, no en la API", async () => {
    const user = userEvent.setup();
    renderView();
    await fillAll(user, { name: "   " });
    await user.click(submitButton());
    expect(createBooking).not.toHaveBeenCalled();
    expect(await screen.findByText("El nombre completo es obligatorio")).toBeInTheDocument();

    await user.clear(field.name());
    await user.type(field.name(), "Al ");
    expect(await screen.findByText("El nombre completo es obligatorio")).toBeInTheDocument();
  });

  it("un titular menor de 18 años bloquea el envío con el mensaje de la regla", async () => {
    const user = userEvent.setup();
    renderView();
    await fillAll(user);
    const year = new Date().getFullYear() - 10;
    step.birth(`${year}-01-15`);
    await user.click(submitButton());

    expect(
      await screen.findByText(/El titular de la reserva debe ser mayor de edad \(18 años o más\)/),
    ).toBeInTheDocument();
    expect(createBooking).not.toHaveBeenCalled();

    // Con una fecha de adulto el error se quita y el registro se envía.
    step.birth("1990-05-29");
    await waitFor(() =>
      expect(screen.queryByText(/debe ser mayor de edad/)).not.toBeInTheDocument(),
    );
    await user.click(submitButton());
    await waitFor(() => expect(createBooking).toHaveBeenCalledTimes(1));
  });
});

describe("Un solo viajero: búsqueda por WhatsApp a mitad del llenado", () => {
  it("lo ya escrito se conserva cuando el registro previo no tiene ese dato; lo guardado se respeta", async () => {
    lookupTraveler.mockResolvedValue({ fullName: "Ana Torres Ruiz", email: "", birthDate: "" });
    const user = userEvent.setup();
    renderView();
    await step.email(user, "ana.nueva@correo.mx");
    step.birth("1991-02-03");
    await step.whatsapp(user);
    await user.tab();

    await waitFor(() => expect(field.name()).toHaveValue("Ana Torres Ruiz"));
    expect(field.name()).toHaveAttribute("readonly");
    // Antes se pisaban con vacío y el viajero perdía lo que ya había capturado.
    expect(field.email()).toHaveValue("ana.nueva@correo.mx");
    expect(field.birth()).toHaveValue("1991-02-03");
    expect(field.email()).toBeEnabled();
    expect(field.birth()).toBeEnabled();
    expect(errorTexts()).toEqual([]);
  });

  it("un correo y una fecha guardados reemplazan lo escrito y quedan bloqueados", async () => {
    lookupTraveler.mockResolvedValue({
      fullName: "Ana Torres",
      email: "ana@correo.mx",
      birthDate: "1990-05-29",
    });
    const user = userEvent.setup();
    renderView();
    await step.email(user, "otra@correo.mx");
    step.birth("2000-01-01");
    await step.whatsapp(user);
    await user.tab();

    await waitFor(() => expect(field.email()).toBeDisabled());
    expect(field.email()).toHaveValue("ana@correo.mx");
    expect(field.birth()).toBeDisabled();
    expect(field.birth()).toHaveValue("1990-05-29");

    await step.emergencyName(user);
    await step.emergencyPhone(user);
    await step.pickup(user);
    await step.privacy(user);
    await user.click(submitButton());
    expect(createBooking.mock.calls[0]![0]).toEqual(expectedPayload);
  });

  it("si el WhatsApp cambia mientras llega la búsqueda, el resultado de otro número se descarta", async () => {
    let resolveLookup: (value: object) => void = () => undefined;
    lookupTraveler.mockReturnValue(new Promise((resolve) => (resolveLookup = resolve)));
    const user = userEvent.setup();
    renderView();
    await step.whatsapp(user);
    await user.tab();
    await waitFor(() => expect(lookupTraveler).toHaveBeenCalledWith("+522281234567"));

    await user.clear(field.whatsapp());
    await user.type(field.whatsapp(), "2289998888");
    resolveLookup({ fullName: "Otra Persona", email: "otra@correo.mx", birthDate: "1980-01-01" });

    await waitFor(() => expect(field.whatsapp()).toBeEnabled());
    expect(field.name()).toHaveValue("");
    expect(field.email()).toHaveValue("");
    expect(field.email()).toBeEnabled();
  });
});
