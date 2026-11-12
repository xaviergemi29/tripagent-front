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

vi.mock("@/features/settings/hooks/useAgency", () => ({
  useAgency: () => ({
    data: {
      bankName: "BBVA",
      bankAccountHolder: "Bruji Tours SA",
      clabeNumber: "012180001234567891",
      cardNumber: "4152313412345678",
    },
  }),
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
    paymentLink: null,
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

/** Captura los datos mínimos válidos de un tour nuevo (pago por Transferencia). */
async function fillValidTour(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nombre del Tour"), "Cascadas de Cuetzalan");
  fireEvent.change(screen.getByLabelText(/Fecha de Salida/), { target: { value: "2027-02-14" } });
  await user.type(screen.getByLabelText(/Capacidad total del vehículo/), "20");
  await user.type(screen.getByLabelText(/Precio Total por Pasajero/), "1200");
  await user.type(screen.getByPlaceholderText("Ej. Oxxo Tec, Veracruz"), "Plaza Central");
  await user.click(screen.getByRole("checkbox", { name: "Transferencia" }));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3001/api");
});

// --- Pruebas ----------------------------------------------------------------------------------
describe("TourForm — creación", () => {
  it("muestra los campos principales y deshabilita Guardar mientras el formulario es inválido", () => {
    render(<TourForm />);

    expect(screen.getByLabelText("Nombre del Tour")).toBeInTheDocument();
    expect(
      screen.getByLabelText(new RegExp(TOUR_FORM_COPY.fields.description.replace(/[()]/g, "\\$&"))),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Fecha de Salida/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Capacidad total del vehículo/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Lugares bloqueados para staff/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Precio Total por Pasajero/)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Nacional/ })).toBeInTheDocument();
    for (const method of ["Transferencia", "Tarjeta / Link", "Efectivo"]) {
      expect(screen.getByRole("checkbox", { name: method })).toBeInTheDocument();
    }

    expect(screen.getByRole("button", { name: TOUR_FORM_COPY.actions.reset })).toBeEnabled();
    expect(submitButton()).toBeDisabled();
  });

  it("Transferencia muestra los datos bancarios de la agencia, incluido el número de tarjeta", async () => {
    const user = userEvent.setup();
    render(<TourForm />);

    expect(screen.queryByText("012180001234567891")).not.toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "Transferencia" }));

    expect(screen.getByText("012180001234567891")).toBeInTheDocument();
    expect(screen.getByText("4152313412345678")).toBeInTheDocument();
  });

  it("Tarjeta exige el enlace de pago y Efectivo exige instrucciones", async () => {
    const user = userEvent.setup();
    render(<TourForm />);

    await user.click(screen.getByRole("checkbox", { name: "Tarjeta / Link" }));
    expect(screen.getByPlaceholderText("https://...")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Efectivo" }));
    expect(screen.getByPlaceholderText("Ej. Paga directo al abordar")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Tarjeta / Link" }));
    expect(screen.queryByPlaceholderText("https://...")).not.toBeInTheDocument();
  });

  it("con datos válidos crea el tour (vacíos → null) y regresa al listado", async () => {
    createTour.mockResolvedValue({ id: TOUR_ID });
    const user = userEvent.setup();
    render(<TourForm />);

    await fillValidTour(user);
    await waitFor(() => expect(submitButton()).toBeEnabled());
    await user.click(submitButton());

    await waitFor(() => expect(push).toHaveBeenCalledWith("/tours"));
    expect(createTour).toHaveBeenCalledTimes(1);
    expect(createTour.mock.calls[0]?.[0]).toMatchObject({
      title: "Cascadas de Cuetzalan",
      departureDateTime: "2027-02-14",
      price: 1200,
      maxCapacity: 20,
      destinationType: "NATIONAL",
      paymentLink: null,
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

  it("Limpiar regresa los campos y el PDF adjunto a su estado inicial", async () => {
    const user = userEvent.setup();
    const { container } = render(<TourForm />);

    await user.type(screen.getByLabelText("Nombre del Tour"), "Tour temporal");
    const pdf = new File(["%PDF"], "itinerario.pdf", { type: "application/pdf" });
    await user.upload(container.querySelector<HTMLInputElement>('input[type="file"]')!, pdf);
    expect(screen.getByText("itinerario.pdf")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: TOUR_FORM_COPY.actions.reset }));

    expect(screen.getByLabelText("Nombre del Tour")).toHaveValue("");
    expect(screen.queryByText("itinerario.pdf")).not.toBeInTheDocument();
    expect(screen.getByText("Haz clic para adjuntar el PDF")).toBeInTheDocument();
  });
});

describe("TourForm — edición", () => {
  it("guarda los cambios del tour y regresa al listado", async () => {
    updateTour.mockResolvedValue({ id: TOUR_ID });
    const user = userEvent.setup();
    render(<TourForm tour={savedTour()} />);

    const title = screen.getByLabelText("Nombre del Tour");
    await user.clear(title);
    await user.type(title, "Zacatlán y Chignahuapan");
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

  it("con pagos registrados congela la moneda y el precio", () => {
    render(<TourForm tour={savedTour({ hasPayments: true })} />);

    expect(screen.getByText(/Moneda y precio congelados/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Precio Total por Pasajero/)).toBeDisabled();
    expect(screen.getByRole("radio", { name: /USD/ })).toBeDisabled();
    // El anticipo sigue editable.
    expect(screen.getByLabelText(/Anticipo por pasajero/)).toBeEnabled();
  });

  it("abre el folleto guardado en el origen de la API, fuera de /api", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const user = userEvent.setup();
    render(<TourForm tour={savedTour({ brochureUrl: "/uploads/brochures/tour-1.pdf" })} />);

    await user.click(screen.getByRole("button", { name: /Ver \/ Descargar/ }));

    expect(open).toHaveBeenCalledWith(
      "http://localhost:3001/public/uploads/brochures/tour-1.pdf",
      "_blank",
    );
  });

  it("si el tour guardado no cumple una regla, explica por qué no se puede guardar", async () => {
    // Guardado por API sin ningún método de cobro: la UI exige al menos uno.
    render(<TourForm tour={savedTour({ acceptsBankTransfer: false })} />);

    expect(
      await screen.findByText("Completa o corrige los campos marcados para poder guardar."),
    ).toBeInTheDocument();
    expect(submitButton("Guardar Cambios")).toBeDisabled();
  });
});
