import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TourForm } from "../TourForm";
import { TOUR_FORM_COPY } from "../../constants/copy";
import type { TourOutput } from "../../schemas/tour.schema";

// --- Dobles de prueba -------------------------------------------------------------------------
// TourForm usa el router de Next (no existe fuera de la app) y hooks de React Query: se simulan
// en el módulo real donde viven (`hooks/useTours`, `settings/hooks/useAgency`).
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }),
}));

const createTour = vi.fn();
const updateTour = vi.fn();
const uploadBrochure = vi.fn();
vi.mock("../../hooks/useTours", () => ({
  useCreateTour: () => ({ mutateAsync: createTour, isPending: false }),
  useUpdateTour: () => ({ mutateAsync: updateTour, isPending: false }),
  useUploadTourBrochure: () => ({ mutateAsync: uploadBrochure, isPending: false }),
  extractTourId: (response: { id?: string } | undefined) => response?.id,
}));

const AGENCY_WITH_CLABE = {
  bankName: "BBVA",
  bankAccountHolder: "Bruji Tours SA",
  clabeNumber: "012180001234567891",
  cardNumber: "4152313412345678",
};
// Mutable por prueba: con o sin CLABE (OBS-038).
let agencyData: Record<string, unknown> = AGENCY_WITH_CLABE;
const saveBankAccount = vi.fn();
vi.mock("@/features/settings/hooks/useAgency", () => ({
  useAgency: () => ({ data: agencyData }),
  useUpdateAgencyBankAccount: () => ({ mutate: saveBankAccount, isPending: false }),
}));

const toastWarning = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: (...a: unknown[]) => toastWarning(...a),
  },
}));

// --- Datos ------------------------------------------------------------------------------------
const TOUR_ID = "5f0c7a52-1f5e-4a8e-9a3b-2c1d0e9f8a7b";

const savedTour = (overrides: Partial<TourOutput> = {}): TourOutput =>
  ({
    id: TOUR_ID,
    title: "Zacatlán de las manzanas",
    description: "Recorrido por el pueblo mágico",
    transportModality: "TRANSPORT_INCLUDED",
    price: 1200,
    depositPerPerson: 500,
    currency: "MXN",
    departureDateTime: "2027-01-10",
    returnDate: null,
    maxCapacity: 20,
    staffCapacity: 1,
    isActive: true,
    acceptsBankTransfer: true,
    acceptsCreditCard: false,
    postPaymentInstructions: "",
    acceptsCash: false,
    cashInstructions: null,
    boardingPoints: [
      { id: "8a1d2c3b-4e5f-4a6b-8c7d-9e0f1a2b3c4d", location: "Plaza Central", time: "06:00" },
    ],
    brochureUrl: null,
    destinationType: "NATIONAL",
    hasPayments: false,
    ...overrides,
  }) as TourOutput;

const submitButton = (name: string = TOUR_FORM_COPY.actions.submit) =>
  screen.getByRole("button", { name });
const nextButton = () => screen.getByRole("button", { name: /Siguiente/ });

// Reloj controlable: "Guardar" ignora el envío justo después de llegar al último paso.
let now = 1_800_000_000_000;

type User = ReturnType<typeof userEvent.setup>;

/** Paso 1 (Excursión y Cupo) con los datos mínimos válidos, y "Siguiente". */
async function completeStep1(user: User) {
  await user.type(screen.getByLabelText("Nombre del Tour"), "Cascadas de Cuetzalan");
  fireEvent.change(screen.getByLabelText(/Fecha de Salida/), { target: { value: "2027-02-14" } });
  await user.type(screen.getByLabelText(/Capacidad total del vehículo/), "20");
  await user.click(nextButton());
  await screen.findByRole("button", { name: /Añadir Parada/ });
}

/** Paso 2 (Transporte y Abordaje) con una parada, y "Siguiente". */
async function completeStep2(user: User) {
  await user.type(screen.getByPlaceholderText("Ej. Oxxo Tec, Veracruz"), "Plaza Central");
  await user.click(nextButton());
  await screen.findByLabelText(/Precio Total por Pasajero/);
}

/** Paso 3 (Finanzas) con precio y Transferencia, y "Siguiente" hasta el último paso. */
async function completeStep3(user: User) {
  await user.type(screen.getByLabelText(/Precio Total por Pasajero/), "1200");
  await user.click(screen.getByRole("checkbox", { name: "Transferencia" }));
  await user.click(nextButton());
  await screen.findByText("Resumen antes de guardar");
  // Pasada la ventana en la que se ignora un clic rezagado de "Siguiente".
  now += 1_000;
}

async function goToFinance(user: User) {
  await completeStep1(user);
  await completeStep2(user);
}

/** Recorre los 4 pasos con un tour válido (pago por Transferencia). */
async function fillValidTour(user: User) {
  await goToFinance(user);
  await completeStep3(user);
}

/** Al editar todos los pasos están completos: se abre cualquiera desde la barra. */
const openStep = (user: User, step: number) =>
  user.click(screen.getByRole("button", { name: new RegExp(`^Paso ${step}:`) }));

beforeEach(() => {
  vi.clearAllMocks();
  now = 1_800_000_000_000;
  vi.spyOn(Date, "now").mockImplementation(() => now);
  agencyData = AGENCY_WITH_CLABE;
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3001/api");
});

// --- Pruebas ----------------------------------------------------------------------------------
describe("TourForm — wizard de 4 pasos", () => {
  it("abre en el Paso 1 con sus campos y el stepper con los 4 pasos", () => {
    render(<TourForm />);

    expect(screen.getByRole("button", { name: "Paso 1: Excursión y Cupo" })).toHaveAttribute(
      "aria-current",
      "step",
    );
    for (const title of [
      "Transporte y Abordaje",
      "Finanzas y Medios de Pago",
      "Instrucciones y Folleto",
    ]) {
      expect(screen.getByRole("button", { name: new RegExp(title) })).toBeDisabled();
    }
    expect(screen.getByLabelText("Nombre del Tour")).toBeInTheDocument();
    expect(
      screen.getByLabelText(new RegExp(TOUR_FORM_COPY.fields.description.replace(/[()]/g, "\\$&"))),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Fecha de Salida/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Lugares bloqueados para staff/)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Nacional/ })).toBeInTheDocument();
    // Los campos de otros pasos no se muestran.
    expect(screen.queryByLabelText(/Precio Total por Pasajero/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Anterior/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: TOUR_FORM_COPY.actions.reset })).toBeEnabled();
  });

  it("'Siguiente' valida solo el paso actual: con errores no avanza y los marca", async () => {
    const user = userEvent.setup();
    render(<TourForm />);

    await user.click(nextButton());

    expect(await screen.findByText(/al menos 5 caracteres/)).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre del Tour")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Paso 1: Excursión y Cupo" })).toHaveAttribute(
      "aria-current",
      "step",
    );
  });

  it("Enter en un campo de un paso intermedio valida el paso, no guarda", async () => {
    const user = userEvent.setup();
    render(<TourForm />);
    await user.type(screen.getByLabelText("Nombre del Tour"), "Corto{Enter}");
    expect(createTour).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Nombre del Tour")).toBeInTheDocument();
  });

  it("los pasos completados se marcan y se puede volver a ellos desde la barra", async () => {
    const user = userEvent.setup();
    render(<TourForm />);
    await completeStep1(user);

    const step1 = screen.getByRole("button", { name: "Paso 1: Excursión y Cupo (completado)" });
    await user.click(step1);
    expect(screen.getByLabelText("Nombre del Tour")).toHaveValue("Cascadas de Cuetzalan");

    await user.click(nextButton());
    await user.click(screen.getByRole("button", { name: /Anterior/ }));
    expect(screen.getByLabelText("Nombre del Tour")).toBeInTheDocument();
  });

  it("Paso 2: llegada independiente explica que no hay paradas y pide el punto de reunión", async () => {
    const user = userEvent.setup();
    render(<TourForm />);
    await completeStep1(user);

    await user.click(screen.getByText("Hiking / Punto de encuentro"));
    expect(
      screen.getByText(/Con llegada independiente no hay paradas de transporte/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Añadir Parada/ })).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Ej. Refugio 1, Parque Nacional"), "Refugio 1");
    await user.click(nextButton());
    expect(await screen.findByLabelText(/Precio Total por Pasajero/)).toBeInTheDocument();
  });

  it("Paso 4: muestra el resumen del tour antes de guardar", async () => {
    const user = userEvent.setup();
    render(<TourForm />);
    await fillValidTour(user);

    const summary = screen.getByRole("region", { name: "Resumen antes de guardar" });
    expect(summary).toHaveTextContent("Cascadas de Cuetzalan");
    expect(summary).toHaveTextContent("14 de febrero");
    expect(summary).toHaveTextContent("20 lugares");
    expect(summary).toHaveTextContent("$1,200.00 MXN");
    expect(submitButton()).toBeEnabled();
  });
});

describe("TourForm — finanzas", () => {
  it("recién abierto no marca el precio en rojo; el error aparece al tocarlo", async () => {
    const user = userEvent.setup();
    render(<TourForm />);
    await goToFinance(user);
    expect(screen.queryByText("El precio debe ser mayor a 0")).not.toBeInTheDocument();

    const price = screen.getByLabelText(/Precio Total por Pasajero/);
    fireEvent.change(price, { target: { value: "100" } });
    fireEvent.change(price, { target: { value: "" } });
    expect(await screen.findByText("El precio debe ser mayor a 0")).toBeInTheDocument();
  });

  it("los campos numéricos no pegan lo escrito a un 0 y aceptan un anticipo de 0.5", async () => {
    const user = userEvent.setup();
    render(<TourForm />);
    const staff = screen.getByLabelText(/Lugares bloqueados para staff/) as HTMLInputElement;
    const capacity = screen.getByLabelText(/Capacidad total del vehículo/) as HTMLInputElement;
    expect(staff.value).toBe("");
    fireEvent.change(staff, { target: { value: "2" } });
    expect(staff.value).toBe("2");
    fireEvent.change(capacity, { target: { value: "20" } });
    fireEvent.change(capacity, { target: { value: "" } });
    expect(capacity.value).toBe("");
    fireEvent.change(staff, { target: { value: "" } });

    await goToFinance(user);
    const deposit = screen.getByLabelText(/Anticipo/) as HTMLInputElement;
    fireEvent.change(deposit, { target: { value: "0" } });
    expect(deposit.value).toBe("0");
    fireEvent.change(deposit, { target: { value: "0.5" } });
    expect(deposit.value).toBe("0.5");
  });

  it("anticipo en $0: aviso destacado de que el cliente paga el 100%", async () => {
    const user = userEvent.setup();
    render(<TourForm />);
    await goToFinance(user);

    const alert = screen.getByRole("alert", { name: "" });
    expect(screen.getByText("Sin anticipo")).toBeInTheDocument();
    expect(alert).toBeTruthy();
    expect(screen.getByText(/el cliente pagará el 100% para asegurar lugares/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Anticipo/), { target: { value: "300" } });
    expect(screen.queryByText("Sin anticipo")).not.toBeInTheDocument();
    expect(screen.getByText(/y liquidará antes de salir/)).toBeInTheDocument();
  });

  it("Transferencia muestra los datos bancarios de la agencia, incluido el número de tarjeta", async () => {
    const user = userEvent.setup();
    render(<TourForm />);
    await goToFinance(user);

    expect(screen.queryByText("012180001234567891")).not.toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "Transferencia" }));
    expect(screen.getByText("012180001234567891")).toBeInTheDocument();
    expect(screen.getByText("4152313412345678")).toBeInTheDocument();
  });

  it("Tarjeta muestra un aviso de advertencia destacado y Efectivo exige instrucciones", async () => {
    const user = userEvent.setup();
    render(<TourForm />);
    await goToFinance(user);

    await user.click(screen.getByRole("checkbox", { name: "Tarjeta" }));
    expect(screen.queryByPlaceholderText("https://...")).not.toBeInTheDocument();
    expect(screen.getByText("Pago con tarjeta")).toBeInTheDocument();
    expect(screen.getByText(/te escribirán por WhatsApp/).closest('[role="alert"]')).not.toBeNull();

    await user.click(screen.getByRole("checkbox", { name: "Efectivo" }));
    expect(screen.getByPlaceholderText("Ej. Paga directo al abordar")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Tarjeta" }));
    expect(screen.queryByText(/te escribirán por WhatsApp/)).not.toBeInTheDocument();
  });

  it("sin ningún método de cobro no avanza del Paso 3 y lo explica ahí", async () => {
    const user = userEvent.setup();
    render(<TourForm />);
    await goToFinance(user);
    await user.type(screen.getByLabelText(/Precio Total por Pasajero/), "1200");
    await user.click(nextButton());

    expect(await screen.findByText(/método de cobro/)).toBeInTheDocument();
    expect(screen.queryByText("Resumen antes de guardar")).not.toBeInTheDocument();
  });
});

describe("TourForm — guardar", () => {
  it("con datos válidos crea el tour (vacíos → null) y regresa al listado", async () => {
    createTour.mockResolvedValue({ id: TOUR_ID });
    const user = userEvent.setup();
    render(<TourForm />);

    await fillValidTour(user);
    await user.click(submitButton());

    await waitFor(() => expect(push).toHaveBeenCalledWith("/tours"));
    expect(createTour).toHaveBeenCalledTimes(1);
    expect(createTour.mock.calls[0]?.[0]).toMatchObject({
      title: "Cascadas de Cuetzalan",
      departureDateTime: "2027-02-14",
      price: 1200,
      maxCapacity: 20,
      destinationType: "NATIONAL",
      transportModality: "TRANSPORT_INCLUDED",
      acceptsBankTransfer: true,
      boardingPoints: [expect.objectContaining({ location: "Plaza Central" })],
      cashInstructions: null,
      postPaymentInstructions: null,
      returnDate: null,
    });
    expect(uploadBrochure).not.toHaveBeenCalled();
  });

  it("si el folleto falla después de crear, lleva a la edición del tour nuevo (sin duplicarlo)", async () => {
    createTour.mockResolvedValue({ id: TOUR_ID });
    uploadBrochure.mockRejectedValue(new Error("Error al subir"));
    const user = userEvent.setup();
    const { container } = render(<TourForm />);

    await fillValidTour(user);
    const pdf = new File(["%PDF"], "itinerario.pdf", { type: "application/pdf" });
    await user.upload(container.querySelector<HTMLInputElement>('input[type="file"]')!, pdf);
    await user.click(submitButton());

    await waitFor(() => expect(push).toHaveBeenCalledWith(`/tours/${TOUR_ID}/edit`));
    expect(createTour).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalledWith("/tours");
    expect(toastWarning).toHaveBeenCalledWith(
      "El tour se guardó, pero el folleto no se subió",
      expect.anything(),
    );
  });

  it("Limpiar regresa los campos, el PDF y el wizard al Paso 1", async () => {
    const user = userEvent.setup();
    const { container } = render(<TourForm />);

    await fillValidTour(user);
    const pdf = new File(["%PDF"], "itinerario.pdf", { type: "application/pdf" });
    await user.upload(container.querySelector<HTMLInputElement>('input[type="file"]')!, pdf);
    expect(screen.getByText("itinerario.pdf")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: TOUR_FORM_COPY.actions.reset }));

    expect(screen.getByLabelText("Nombre del Tour")).toHaveValue("");
    expect(screen.getByRole("button", { name: /Paso 4: Instrucciones/ })).toBeDisabled();
  });
});

describe("TourForm — 'Siguiente' en el Paso 3 nunca guarda", () => {
  it("crear: muestra el Paso 4, no llama a createTour y 'Guardar' es otro nodo", async () => {
    const user = userEvent.setup();
    render(<TourForm />);
    await goToFinance(user);
    await user.type(screen.getByLabelText(/Precio Total por Pasajero/), "1200");
    await user.click(screen.getByRole("checkbox", { name: "Transferencia" }));

    const next = nextButton();
    await user.click(next);
    await screen.findByText("Resumen antes de guardar");

    const save = submitButton();
    expect(save).not.toBe(next);
    expect(save).toHaveAttribute("type", "submit");
    expect(createTour).not.toHaveBeenCalled();
  });

  it("crear: un segundo clic inmediato sobre la misma posición no guarda", async () => {
    const user = userEvent.setup();
    render(<TourForm />);
    await goToFinance(user);
    await user.type(screen.getByLabelText(/Precio Total por Pasajero/), "1200");
    await user.click(screen.getByRole("checkbox", { name: "Transferencia" }));
    await user.click(nextButton());
    await screen.findByText("Resumen antes de guardar");

    await user.click(submitButton()); // sin esperar: sigue dentro de la ventana
    expect(createTour).not.toHaveBeenCalled();
    expect(screen.getByText("Resumen antes de guardar")).toBeInTheDocument();
  });

  it("editar: 'Siguiente' en el Paso 3 muestra el Paso 4 sin llamar a updateTour", async () => {
    const user = userEvent.setup();
    render(<TourForm tour={savedTour()} />);
    await openStep(user, 3);
    const next = nextButton();
    await user.click(next);

    await screen.findByText("Resumen antes de guardar");
    expect(submitButton("Guardar Cambios")).not.toBe(next);
    await user.click(submitButton("Guardar Cambios"));
    expect(updateTour).not.toHaveBeenCalled();
  });
});

describe("TourForm — edición", () => {
  it("todos los pasos están completos y se guarda desde el último", async () => {
    updateTour.mockResolvedValue({ id: TOUR_ID });
    const user = userEvent.setup();
    render(<TourForm tour={savedTour()} />);

    const title = screen.getByLabelText("Nombre del Tour");
    await user.clear(title);
    await user.type(title, "Zacatlán y Chignahuapan");
    await openStep(user, 4);
    await user.click(submitButton("Guardar Cambios"));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/tours"));
    expect(updateTour).toHaveBeenCalledWith({
      tourId: TOUR_ID,
      tourData: expect.objectContaining({
        title: "Zacatlán y Chignahuapan",
        removeBrochure: false,
      }),
    });
  });

  it("con pagos registrados congela la moneda y el precio", async () => {
    const user = userEvent.setup();
    render(<TourForm tour={savedTour({ hasPayments: true })} />);
    await openStep(user, 3);

    expect(screen.getByText(/Moneda y precio congelados/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Precio Total por Pasajero/)).toBeDisabled();
    expect(screen.getByRole("radio", { name: /USD/ })).toBeDisabled();
    expect(screen.getByLabelText(/Anticipo por pasajero/)).toBeEnabled();
  });

  it("abre el folleto guardado en el origen de la API, fuera de /api", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const user = userEvent.setup();
    render(<TourForm tour={savedTour({ brochureUrl: "/uploads/brochures/tour-1.pdf" })} />);
    await openStep(user, 4);

    await user.click(screen.getByRole("button", { name: /Ver \/ Descargar/ }));

    expect(open).toHaveBeenCalledWith(
      "http://localhost:3001/public/uploads/brochures/tour-1.pdf",
      "_blank",
    );
  });

  it("si el tour guardado no cumple una regla, al guardar lleva al paso con el error", async () => {
    // Guardado por API sin ningún método de cobro: la UI exige al menos uno.
    const user = userEvent.setup();
    render(<TourForm tour={savedTour({ acceptsBankTransfer: false })} />);
    await openStep(user, 4);

    expect(
      await screen.findByText("Completa o corrige los campos marcados para poder guardar."),
    ).toBeInTheDocument();
    await user.click(submitButton("Guardar Cambios"));

    expect(await screen.findByLabelText(/Precio Total por Pasajero/)).toBeInTheDocument();
    expect(updateTour).not.toHaveBeenCalled();
  });
});

// OBS-038 (decisión del PM, 2026-11-17): la CLABE se pide cuando el operador activa la
// transferencia, sin sacarlo del formulario; solo transferencia sin CLABE no se puede guardar.
describe("TourForm — transferencia sin CLABE en la agencia", () => {
  const AGENCY_WITHOUT_CLABE = { bankName: null, bankAccountHolder: null, clabeNumber: null };

  it("avisa debajo de Transferencia y abre el modal sin perder lo capturado", async () => {
    agencyData = AGENCY_WITHOUT_CLABE;
    const user = userEvent.setup();
    render(<TourForm />);
    await goToFinance(user);

    await user.click(screen.getByRole("checkbox", { name: "Transferencia" }));
    expect(
      screen.getByText(
        /Aún no has configurado tu cuenta bancaria\. Tus viajeros no verán a dónde transferir/,
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Configurar cuenta ahora" }));
    expect(await screen.findByText("Cuenta para transferencias")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Banco"), "BBVA");
    await user.type(screen.getByLabelText("CLABE interbancaria *"), "012 180 001234567891");
    await user.click(screen.getByRole("button", { name: "Guardar cuenta" }));

    await waitFor(() => expect(saveBankAccount).toHaveBeenCalledTimes(1));
    expect(saveBankAccount.mock.calls[0]?.[0]).toMatchObject({
      bankName: "BBVA",
      clabeNumber: "012180001234567891",
    });
    expect(createTour).not.toHaveBeenCalled(); // el modal no envía el formulario del tour
    await user.keyboard("{Escape}");
    await openStep(user, 1);
    expect(screen.getByLabelText("Nombre del Tour")).toHaveValue("Cascadas de Cuetzalan");
  });

  it("solo transferencia y sin CLABE: no avanza del Paso 3 y explica qué hacer", async () => {
    agencyData = AGENCY_WITHOUT_CLABE;
    const user = userEvent.setup();
    render(<TourForm />);
    await goToFinance(user);
    await user.type(screen.getByLabelText(/Precio Total por Pasajero/), "1200");
    await user.click(screen.getByRole("checkbox", { name: "Transferencia" }));
    await user.click(nextButton());

    expect(
      (
        await screen.findAllByText(
          "Activa pago en efectivo o agrega tu CLABE para que tus clientes sepan cómo apartar",
        )
      ).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("Resumen antes de guardar")).not.toBeInTheDocument();
  });

  it("con efectivo también activo sí se guarda aunque falte la CLABE", async () => {
    agencyData = AGENCY_WITHOUT_CLABE;
    createTour.mockResolvedValue({ id: TOUR_ID });
    const user = userEvent.setup();
    render(<TourForm />);
    await goToFinance(user);
    await user.type(screen.getByLabelText(/Precio Total por Pasajero/), "1200");
    await user.click(screen.getByRole("checkbox", { name: "Transferencia" }));
    await user.click(screen.getByRole("checkbox", { name: "Efectivo" }));
    await user.type(
      screen.getByPlaceholderText("Ej. Paga directo al abordar"),
      "Pagar en la oficina del centro",
    );
    await user.click(nextButton());
    await screen.findByText("Resumen antes de guardar");
    now += 1_000;

    await user.click(submitButton());
    await waitFor(() => expect(createTour).toHaveBeenCalledTimes(1));
    expect(createTour.mock.calls[0]?.[0]).toMatchObject({
      acceptsBankTransfer: true,
      acceptsCash: true,
    });
  });
});
