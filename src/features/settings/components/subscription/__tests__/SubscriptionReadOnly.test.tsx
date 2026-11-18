import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SubscriptionReadOnlyBanner } from "../SubscriptionReadOnlyBanner";
import { WritableAccountGuard } from "../WritableAccountGuard";
import { TourDesktopTable } from "@/features/tours/components/TourDesktopTable";
import { TourMobileCardList } from "@/features/tours/components/mobile/TourMobileCardList";
import { TravelerCard } from "@/features/travelers/components/TravelerCard";
import type { TourOutput } from "@/features/tours/schemas/tour.schema";
import type { TravelerTableRow } from "@/features/travelers/components/TravelersTable";
import type { SubscriptionOutput } from "../../../schemas/subscription.schema";

// Modo Solo Lectura por suscripción (feedback del PM, 2026-11-18): con la prueba vencida o el pago
// pendiente se consulta todo, pero no se crea ni modifica nada. La API responde 402 a las
// mutaciones; la interfaz lo explica con un banner y oculta o deshabilita las acciones.

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace, back: vi.fn() }),
}));

let subscription: Partial<SubscriptionOutput> | undefined;
let isLoading = false;
vi.mock("../../../hooks/useAgencySubscription", () => ({
  useAgencySubscription: () => ({ data: subscription, isLoading }),
}));

const readOnly = (status: SubscriptionOutput["status"] = "trialing") => ({
  status,
  trialExpired: true,
  isReadOnly: true,
  priceMxn: 499,
});

beforeEach(() => {
  vi.clearAllMocks();
  subscription = undefined;
  isLoading = false;
});

describe("Banner superior del Modo Solo Lectura", () => {
  it("prueba vencida: explica el modo y lleva a Suscripción con el precio del plan", () => {
    subscription = readOnly();
    render(<SubscriptionReadOnlyBanner />);

    expect(screen.getByText(/Tu prueba gratuita terminó/)).toBeInTheDocument();
    expect(screen.getByText(/modo solo lectura/)).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: "Activar plan por $499.00 MXN/mes" });
    expect(cta).toHaveAttribute("href", "/settings?tab=subscription");
  });

  it("pago pendiente y plan cancelado tienen su propio título", () => {
    subscription = readOnly("past_due");
    const { rerender } = render(<SubscriptionReadOnlyBanner />);
    expect(screen.getByText(/Tu plan tiene un pago pendiente/)).toBeInTheDocument();

    subscription = readOnly("canceled");
    rerender(<SubscriptionReadOnlyBanner />);
    expect(screen.getByText(/Tu plan está cancelado/)).toBeInTheDocument();
  });

  it("con la cuenta operativa (o mientras carga) no se dibuja", () => {
    subscription = { status: "trialing", trialExpired: false, isReadOnly: false, priceMxn: 499 };
    const { container, rerender } = render(<SubscriptionReadOnlyBanner />);
    expect(container).toBeEmptyDOMElement();

    subscription = undefined;
    rerender(<SubscriptionReadOnlyBanner />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("Nuevo tour y Editar tour (WritableAccountGuard)", () => {
  it("en solo lectura redirige a Suscripción sin mostrar el formulario", () => {
    subscription = readOnly();
    render(
      <WritableAccountGuard>
        <p>Formulario</p>
      </WritableAccountGuard>,
    );
    expect(screen.queryByText("Formulario")).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/settings?tab=subscription");
  });

  it("mientras carga no muestra el formulario; con la cuenta operativa sí", () => {
    isLoading = true;
    const { rerender } = render(
      <WritableAccountGuard>
        <p>Formulario</p>
      </WritableAccountGuard>,
    );
    expect(screen.queryByText("Formulario")).not.toBeInTheDocument();

    isLoading = false;
    subscription = { status: "active", trialExpired: false, isReadOnly: false, priceMxn: 499 };
    rerender(
      <WritableAccountGuard>
        <p>Formulario</p>
      </WritableAccountGuard>,
    );
    expect(screen.getByText("Formulario")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});

const tour = {
  id: "t1",
  title: "Cascadas de Cuetzalan",
  temporalStatus: "PRÓXIMO",
  currency: "MXN",
  price: 1200,
  departureDateTime: "2026-12-14",
  destinationType: "NATIONAL",
  boardingPoints: [],
  maxCapacity: 20,
  sellableCapacity: 19,
  currentOccupancy: 7,
} as unknown as TourOutput;

describe("Catálogo de tours", () => {
  it("sin permiso de gestión no hay menú Editar / Eliminar (escritorio y celular)", () => {
    const { unmount } = render(
      <TourDesktopTable tours={[tour]} onDeleteRequest={() => {}} canManage={false} />,
    );
    expect(screen.getByText("Cascadas de Cuetzalan")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Opciones del tour" })).not.toBeInTheDocument();
    unmount();

    render(<TourMobileCardList tours={[tour]} onDeleteRequest={() => {}} canManage={false} />);
    expect(screen.queryByRole("button", { name: "Opciones del tour" })).not.toBeInTheDocument();
  });

  it("con la cuenta operativa el menú sigue ahí", () => {
    render(<TourMobileCardList tours={[tour]} onDeleteRequest={() => {}} />);
    expect(screen.getByRole("button", { name: "Opciones del tour" })).toBeInTheDocument();
  });
});

describe("Directorio de viajeros", () => {
  it("Editar y Eliminar se deshabilitan; el historial sigue disponible", () => {
    const traveler = {
      id: "v1",
      fullName: "Ana Torres",
      whatsappPhone: "+522281234567",
      tripCount: 2,
    } as unknown as TravelerTableRow;
    render(
      <TravelerCard
        traveler={traveler}
        onEdit={() => {}}
        onDelete={() => {}}
        onViewHistory={() => {}}
        canManage={false}
      />,
    );

    expect(screen.getByRole("button", { name: /Editar/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Eliminar viajero" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Historial/ })).toBeEnabled();
  });
});
