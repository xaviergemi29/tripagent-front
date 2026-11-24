import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { TourRegistrationView } from "../TourRegistrationView";
import { describeRegisterError } from "../../hooks/useBookings";
import type { ApiError } from "@/lib/api-client";

// Registro del Magic Link: llenado en desorden, errores que se limpian al corregir, cambio
// Adulto <-> Niño, quitar acompañantes con error y aviso de dónde está el problema al enviar.

const refresh = vi.fn();
const createBooking = vi.fn<(body: Record<string, unknown>) => Promise<object>>(async () => ({}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("../../hooks/useBookings", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../hooks/useBookings")>()),
  useCreateBooking: () => ({ mutateAsync: createBooking, isPending: false }),
}));
vi.mock("../../hooks/usePublicTravelerLookup", () => ({
  usePublicTravelerLookup: () => ({ lookupTraveler: async () => null }),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const renderView = (reservedSeats = 3) =>
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
    />,
  );

const submitButton = () => screen.getByRole("button", { name: /Completar Registro/ });
const errorTexts = () => screen.queryAllByRole("alert").map((alert) => alert.textContent);

const fillCompanion = async (
  user: ReturnType<typeof userEvent.setup>,
  index: number,
  data: { name: string; phone: string; email: string; birth: string },
) => {
  await user.type(screen.getAllByPlaceholderText("Ej. Lizeth Colorado")[index]!, data.name);
  await user.type(screen.getAllByPlaceholderText("Número")[index]!, data.phone);
  await user.type(screen.getAllByPlaceholderText("correo@ejemplo.com").at(index + 1)!, data.email);
  fireEvent.change(screen.getAllByLabelText(/Fecha de Nacimiento/)[index + 1]!, {
    target: { value: data.birth },
  });
};

const fillTitularRest = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByPlaceholderText("Ej. 2281234567"), "2281234567");
  await user.type(screen.getByPlaceholderText("Nombre y Apellidos"), "Ana Torres");
  await user.type(screen.getAllByPlaceholderText("correo@ejemplo.com")[0]!, "ana@correo.mx");
  await user.type(screen.getAllByPlaceholderText("Nombre del familiar")[0]!, "Luis Torres");
  await user.type(screen.getAllByPlaceholderText("Teléfono")[0]!, "2281112222");
  fireEvent.change(screen.getAllByLabelText(/Fecha de Nacimiento/)[0]!, {
    target: { value: "1990-05-29" },
  });
  await user.click(screen.getAllByText("Plaza Xalapeña")[0]!);
  await user.click(
    screen.getByRole("checkbox", { name: /Declaro ser mayor de edad/, hidden: true }),
  );
};

beforeEach(() => {
  refresh.mockClear();
  createBooking.mockReset();
  createBooking.mockResolvedValue({});
  vi.mocked(toast.error).mockClear();
  Element.prototype.scrollIntoView = vi.fn();
});

describe("Registro del Magic Link: llenado en desorden", () => {
  it("acompañante primero: no pinta errores de campos que el viajero aún no llena y se envía al completar al titular", async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getByText("Viajo acompañado"));
    await fillCompanion(user, 0, {
      name: "Eva Torres",
      phone: "2283334444",
      email: "eva@correo.mx",
      birth: "1992-08-15",
    });

    // El contacto de emergencia del acompañante copia al del titular, que sigue vacío: ningún error.
    expect(errorTexts()).toEqual([]);

    await fillTitularRest(user);
    expect(errorTexts()).toEqual([]);
    await user.click(submitButton());
    expect(createBooking).toHaveBeenCalledTimes(1);
  });

  it("enviar con el titular incompleto avisa dónde está el problema y lleva al primer error", async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getByText("Viajo acompañado"));
    await fillCompanion(user, 0, {
      name: "Eva Torres",
      phone: "2283334444",
      email: "eva@correo.mx",
      birth: "1992-08-15",
    });
    await user.click(submitButton());

    expect(createBooking).not.toHaveBeenCalled();
    expect(await screen.findByText("La fecha de nacimiento es obligatoria")).toBeInTheDocument();
    expect(screen.getByText("Ingresa tu WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("El nombre completo es obligatorio")).toBeInTheDocument();
    expect(screen.getByText("Correo electrónico inválido")).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith(
      "Revisa los campos marcados en rojo",
      expect.objectContaining({ description: expect.stringContaining("Titular") }),
    );
    // El primer error (WhatsApp del titular) recibe foco y scroll.
    await waitFor(() => expect(screen.getByPlaceholderText("Ej. 2281234567")).toHaveFocus());
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it("el error de un acompañante colapsado en la lista se nombra en el aviso", async () => {
    const user = userEvent.setup();
    renderView();
    await fillTitularRest(user);
    await user.click(screen.getByText("Viajo acompañado"));
    await user.click(submitButton());

    expect(createBooking).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      "Revisa los campos marcados en rojo",
      expect.objectContaining({ description: "Pendiente en: Acompañante 1." }),
    );
    expect(await screen.findByText("El nombre completo es obligatorio")).toBeInTheDocument();
  });

  it("los errores del titular se limpian al corregirlos y el envío procede", async () => {
    const user = userEvent.setup();
    renderView(1);
    await user.click(submitButton());
    expect(await screen.findByText("La fecha de nacimiento es obligatoria")).toBeInTheDocument();

    await fillTitularRest(user);
    await waitFor(() => expect(errorTexts()).toEqual([]));
    await user.click(submitButton());
    expect(createBooking).toHaveBeenCalledTimes(1);
  });
});

describe("Registro del Magic Link: validaciones cruzadas", () => {
  it("al cambiar el WhatsApp del titular se quita el error 'distinto al tuyo' del contacto de emergencia", async () => {
    const user = userEvent.setup();
    renderView(1);
    await fillTitularRest(user);
    const emergency = screen.getAllByPlaceholderText("Teléfono")[0]!;
    await user.clear(emergency);
    await user.type(emergency, "2281234567");
    expect(
      await screen.findByText("El contacto de emergencia debe ser un número distinto al tuyo"),
    ).toBeInTheDocument();

    const whatsapp = screen.getByPlaceholderText("Ej. 2281234567");
    await user.clear(whatsapp);
    await user.type(whatsapp, "2289998888");
    await waitFor(() =>
      expect(
        screen.queryByText("El contacto de emergencia debe ser un número distinto al tuyo"),
      ).not.toBeInTheDocument(),
    );
  });

  it("aviso de menores (Art. 58, fr. X Ter, LGT): aparece con un acompañante Niño o menor de 18", async () => {
    const user = userEvent.setup();
    renderView();
    const notice = () => screen.queryByRole("note", { name: "Reserva con menor de edad" });
    expect(notice()).not.toBeInTheDocument();

    await user.click(screen.getByText("Viajo acompañado"));
    expect(notice()).not.toBeInTheDocument();
    // Adulto con 15 años por su fecha de nacimiento: también es menor.
    fireEvent.change(screen.getAllByLabelText(/Fecha de Nacimiento/)[1]!, {
      target: { value: `${new Date().getFullYear() - 15}-03-10` },
    });
    expect(
      await screen.findByRole("note", { name: "Reserva con menor de edad" }),
    ).toHaveTextContent("Art. 58, fracción X Ter, de la Ley General de Turismo");

    fireEvent.change(screen.getAllByLabelText(/Fecha de Nacimiento/)[1]!, {
      target: { value: "1990-03-10" },
    });
    await waitFor(() => expect(notice()).not.toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /Niño/ }));
    expect(
      await screen.findByRole("note", { name: "Reserva con menor de edad" }),
    ).toBeInTheDocument();
  });

  it("Adulto -> Niño quita los errores que ya no aplican y Niño -> Adulto no inventa errores", async () => {
    const user = userEvent.setup();
    renderView();
    await fillTitularRest(user);
    await user.click(screen.getByText("Viajo acompañado"));
    await user.click(submitButton());
    expect(await screen.findByText("El WhatsApp es obligatorio para adultos")).toBeInTheDocument();
    expect(screen.getByText("Correo electrónico inválido o faltante")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Niño/ }));
    await waitFor(() => {
      expect(screen.queryByText("El WhatsApp es obligatorio para adultos")).not.toBeInTheDocument();
      expect(screen.queryByText("Correo electrónico inválido o faltante")).not.toBeInTheDocument();
    });

    // Niño -> Adulto: el WhatsApp pasa a ser obligatorio, pero no se marca hasta que se envíe.
    await user.click(screen.getByRole("button", { name: /Adulto/ }));
    expect(screen.queryByText("El WhatsApp es obligatorio para adultos")).not.toBeInTheDocument();
  });

  it("un menor sin WhatsApp ni correo se puede registrar", async () => {
    const user = userEvent.setup();
    renderView();
    await fillTitularRest(user);
    await user.click(screen.getByText("Viajo acompañado"));
    await user.click(screen.getByRole("button", { name: /Niño/ }));
    await user.type(screen.getByPlaceholderText("Ej. Lizeth Colorado"), "Leo Torres");
    fireEvent.change(screen.getAllByLabelText(/Fecha de Nacimiento/).at(-1)!, {
      target: { value: "2018-03-02" },
    });
    await user.click(submitButton());
    expect(createBooking).toHaveBeenCalledTimes(1);
  });
});

describe("Registro del Magic Link: acompañantes con error", () => {
  it("al quitar un acompañante, el error se queda con el acompañante correcto", async () => {
    const user = userEvent.setup();
    renderView();
    await fillTitularRest(user);
    await user.click(screen.getByText("Viajo acompañado"));
    await user.click(screen.getByText(/Añadir otro acompañante/));
    // El acompañante 1 queda completo y el 2 incompleto (sin nombre).
    await fillCompanion(user, 0, {
      name: "Eva Torres",
      phone: "2283334444",
      email: "eva@correo.mx",
      birth: "1992-08-15",
    });
    await user.click(submitButton());
    expect(await screen.findByText("El nombre completo es obligatorio")).toBeInTheDocument();

    // Se quita el acompañante 1 (sin error): el error del 2 pasa a ser el del único que queda.
    const companion1 = screen.getByText("Acompañante 1").closest("div.relative") as HTMLElement;
    await user.click(within(companion1).getAllByRole("button")[0]!);

    expect(screen.queryByText("Acompañante 2")).not.toBeInTheDocument();
    const remaining = screen.getByText("Acompañante 1").closest("div.relative") as HTMLElement;
    expect(within(remaining).getByText("El nombre completo es obligatorio")).toBeInTheDocument();
    expect(within(remaining).getByPlaceholderText("Ej. Lizeth Colorado")).toHaveValue("");
  });
});

describe("Registro del Magic Link: respuesta de la API", () => {
  it("un 409 (ya registrado) recarga la página para mostrar la vista que corresponde", async () => {
    const user = userEvent.setup();
    createBooking.mockRejectedValueOnce({
      status: 409,
      message: "Esta reservación ya fue registrada",
    });
    renderView(1);
    await fillTitularRest(user);
    await user.click(submitButton());
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });

  it("describeRegisterError no muestra el texto técnico de una validación fallida", () => {
    const validation: ApiError = {
      status: 400,
      code: "FST_ERR_VALIDATION",
      message: "Invalid input: expected string, received undefined",
    };
    expect(describeRegisterError(validation)).not.toMatch(/Invalid input/);
    expect(describeRegisterError({ status: 409, message: "Ya registrado" })).toBe("Ya registrado");
    expect(describeRegisterError({ status: 500, message: "" })).toBe(
      "No se pudo guardar la información",
    );
  });
});
