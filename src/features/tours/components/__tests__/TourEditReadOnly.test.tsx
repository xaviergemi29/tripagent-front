import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TourDesktopTable } from "../TourDesktopTable";
import { TourMobileCardList } from "../mobile/TourMobileCardList";
import EditTourPage from "@/app/(dashboard)/tours/[id]/edit/page";
import type { TourOutput } from "../../schemas/tour.schema";

// Cuenta operativa: estas pruebas no cubren el Modo Solo Lectura por suscripción
// (ver SubscriptionReadOnly.test.tsx).
vi.mock("@/features/settings/hooks/useSubscriptionAccess", () => ({
  SUBSCRIPTION_SETTINGS_HREF: "/settings?tab=subscription",
  useSubscriptionAccess: () => ({
    isReadOnly: false,
    isLoading: false,
    canWrite: true,
    subscription: undefined,
  }),
}));

/**
 * Modo Auditoría (OBS-004): un tour FINALIZADO o CANCELADO no se edita. El listado oculta "Editar
 * Tour" y la página de edición muestra un aviso en lugar del formulario (la API responde 409).
 */

const tour = (id: string, temporalStatus: TourOutput["temporalStatus"]) =>
  ({
    id,
    title: `Tour ${id}`,
    temporalStatus,
    currency: "MXN",
    price: 1200,
    departureDateTime: "2026-11-20",
    destinationType: "NATIONAL",
    boardingPoints: [],
    maxCapacity: 20,
    sellableCapacity: 19,
    currentOccupancy: 7,
  }) as unknown as TourOutput;

let tourQuery: { data: TourOutput | undefined; isLoading: boolean } = {
  data: undefined,
  isLoading: false,
};

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "t1" }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));
vi.mock("@/features/tours/hooks/useTours", () => ({
  useTourById: () => ({
    ...tourQuery,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  }),
}));
vi.mock("@/features/tours/components/TourForm", () => ({
  TourForm: () => <form aria-label="Formulario del tour" />,
}));

describe("Editar Tour en el listado", () => {
  it.each([
    ["escritorio", TourDesktopTable],
    ["celular", TourMobileCardList],
  ])("%s: se ofrece en próximos y en curso; no en finalizados ni cancelados", async (_, List) => {
    const user = userEvent.setup();
    const { unmount } = render(
      <List tours={[tour("proximo", "PRÓXIMO")]} onDeleteRequest={() => {}} />,
    );
    await user.click(screen.getAllByRole("button", { name: "Opciones del tour" })[0]!);
    expect(await screen.findByText("Editar Tour")).toBeInTheDocument();
    unmount();

    for (const status of ["FINALIZADO", "CANCELADO"] as const) {
      const view = render(<List tours={[tour(status, status)]} onDeleteRequest={() => {}} />);
      await user.click(screen.getAllByRole("button", { name: "Opciones del tour" })[0]!);
      expect(screen.queryByText("Editar Tour")).not.toBeInTheDocument();
      view.unmount();
    }
  });
});

describe("Página de edición", () => {
  beforeEach(() => {
    tourQuery = { data: undefined, isLoading: false };
  });

  it("tour próximo: muestra el formulario", () => {
    tourQuery = { data: tour("t1", "PRÓXIMO"), isLoading: false };
    render(<EditTourPage />);
    expect(screen.getByRole("form", { name: "Formulario del tour" })).toBeInTheDocument();
  });

  it.each([
    ["FINALIZADO", "Este tour ya finalizó"],
    ["CANCELADO", "Este tour fue cancelado"],
  ] as const)("tour %s: aviso de solo consulta, sin formulario", (status, title) => {
    tourQuery = { data: tour("t1", status), isLoading: false };
    render(<EditTourPage />);
    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "Formulario del tour" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir al Centro de Control" })).toHaveAttribute(
      "href",
      "/tours/t1",
    );
  });
});
