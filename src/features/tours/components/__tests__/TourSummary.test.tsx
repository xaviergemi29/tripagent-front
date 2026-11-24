import { fireEvent, render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import type { TourInput } from "../../schemas/tour.schema";
import {
  TourSummary,
  TourSummaryView,
  type TourSummaryViewProps,
} from "../form-sections/TourSummary";

const baseProps: TourSummaryViewProps = {
  title: "Cascadas de Cuetzalan",
  destinationType: "NATIONAL",
  departureDate: "2026-02-14",
  returnDate: "2026-02-16",
  totalSeats: 20,
  staffSeats: 2,
  isIndependentAccess: false,
  boardingPoints: [
    { location: "Terminal TAPO", time: "06:00" },
    { location: "Plaza Norte", time: "07:30" },
  ],
  currency: "MXN",
  price: 1200,
  deposit: 300,
  paymentMethods: { cash: true, transfer: true, card: false },
  postPaymentInstructions: "Llevar impermeable",
  isComplete: true,
};

const renderView = (overrides: Partial<TourSummaryViewProps> = {}) =>
  render(<TourSummaryView {...baseProps} {...overrides} />);

describe("TourSummaryView", () => {
  it("muestra los datos completos", () => {
    renderView();
    const card = screen.getByRole("region", { name: "Resumen antes de guardar" });
    expect(card).toHaveTextContent("• Paso 4 de 4");
    expect(card).toHaveTextContent("Cascadas de Cuetzalan");
    expect(card).toHaveTextContent("Destino Nacional (México)");
    expect(card).toHaveTextContent("Sábado, 14 de febrero");
    expect(card).toHaveTextContent("3 días / 2 noches");
    expect(card).toHaveTextContent("18 lugares abiertos");
    expect(card).toHaveTextContent("2 asientos para staff");
    expect(card).not.toHaveTextContent(/cortesía/i);
    expect(card).toHaveTextContent("20");
    expect(card).toHaveTextContent("(2 paradas)");
    expect(card).toHaveTextContent("Terminal TAPO");
    expect(card).toHaveTextContent("06:00 AM");
    expect(card).toHaveTextContent("07:30 AM");
    expect(card).toHaveTextContent("$1,200.00 MXN");
    expect(card).toHaveTextContent("25% para apartar lugar");
    expect(card).toHaveTextContent("$900.00 MXN");
    expect(card).toHaveTextContent("$21,600.00 MXN");
    expect(card).toHaveTextContent("18 lugares × $1,200.00 MXN");
    expect(card).toHaveTextContent("MXN · Peso mexicano");
    expect(screen.getByText("Efectivo")).toBeInTheDocument();
    expect(screen.getByText("Transferencia")).toBeInTheDocument();
    expect(screen.queryByText("Tarjeta")).not.toBeInTheDocument();
    expect(card).toHaveTextContent("Llevar impermeable");
    expect(
      screen.getByRole("img", { name: "18 de 20 lugares al público y 2 para staff" }),
    ).toBeInTheDocument();
  });

  it("anticipo 0: liquidación 100% sin porcentaje", () => {
    renderView({ deposit: 0 });
    expect(screen.getByText("Liquidación 100%")).toBeInTheDocument();
    expect(screen.queryByText(/para apartar lugar/)).not.toBeInTheDocument();
  });

  it("precio 0: no calcula porcentaje ni divide entre 0", () => {
    renderView({ price: 0, deposit: 100 });
    expect(screen.queryByText(/para apartar lugar/)).not.toBeInTheDocument();
    expect(screen.getByRole("region")).not.toHaveTextContent("NaN");
    expect(screen.getByRole("region")).not.toHaveTextContent("Infinity");
  });

  it("sin paradas: estado vacío", () => {
    renderView({ boardingPoints: [] });
    expect(
      screen.getByText("Llegada directa al sitio / Sin paradas intermedias configuradas"),
    ).toBeInTheDocument();
  });

  it("llegada independiente: habla de punto de reunión, no de paradas", () => {
    renderView({
      isIndependentAccess: true,
      boardingPoints: [{ location: "Refugio 1", time: "08:00" }],
    });
    const card = screen.getByRole("region");
    expect(card).toHaveTextContent("llegada independiente");
    expect(card).toHaveTextContent("Punto de reunión");
    expect(card).toHaveTextContent("Refugio 1");
    expect(card).not.toHaveTextContent(/paradas\)/);
  });

  it("sin nombre y sin instrucciones", () => {
    renderView({ title: "  ", postPaymentInstructions: " " });
    expect(screen.getByText("Sin nombre asignado")).toBeInTheDocument();
    expect(screen.queryByText(/Instrucciones post-pago/i)).not.toBeInTheDocument();
  });

  it("regreso el mismo día e internacional con USD", () => {
    renderView({ returnDate: "2026-02-14", destinationType: "INTERNATIONAL", currency: "USD" });
    const card = screen.getByRole("region");
    expect(card).toHaveTextContent("1 día (regreso el mismo día)");
    expect(card).toHaveTextContent("Destino Internacional");
    expect(card).toHaveTextContent("USD · Dólar estadounidense");
  });

  it("estado según validez del formulario", () => {
    const { rerender } = renderView({ isComplete: true });
    expect(screen.getByText("Todo configurado")).toBeInTheDocument();
    rerender(<TourSummaryView {...baseProps} isComplete={false} />);
    expect(screen.getByText("Completando información")).toBeInTheDocument();
    expect(screen.queryByText("Todo configurado")).not.toBeInTheDocument();
  });
});

function Harness() {
  const form = useForm<TourInput>({
    defaultValues: {
      title: "Tour",
      maxCapacity: 20,
      staffCapacity: 2,
      price: 1000,
      currency: "MXN",
      boardingPoints: [],
    } as unknown as TourInput,
  });
  return (
    <FormProvider {...form}>
      <button type="button" onClick={() => form.setValue("staffCapacity", 5)}>
        más staff
      </button>
      <TourSummary />
    </FormProvider>
  );
}

describe("TourSummary (contenedor)", () => {
  it("cupo y proyección se actualizan al cambiar el staff", () => {
    render(<Harness />);
    const card = screen.getByRole("region", { name: "Resumen antes de guardar" });
    expect(card).toHaveTextContent("18 lugares abiertos");
    expect(card).toHaveTextContent("$18,000.00 MXN");
    fireEvent.click(screen.getByText("más staff"));
    expect(card).toHaveTextContent("15 lugares abiertos");
    expect(card).toHaveTextContent("$15,000.00 MXN");
  });
});
