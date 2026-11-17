import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { QueryErrorState } from "@/components/shared/QueryErrorState";
import {
  downloadOperatorStatement,
  STATEMENT_AGENCY_MISSING_MESSAGE,
} from "@/features/tour-dashboard/utils/statement-agency.util";
import EditTourPage from "@/app/(dashboard)/tours/[id]/edit/page";
import ManifestPrintView from "@/app/pdf-tour/[id]/page";
import { PoliciesTab } from "@/features/settings/components/PoliciesTab";

// Pantallas con la consulta fallida (2026-11-16): aviso + Volver a intentar, nunca un dato falso.

const generatePdf = vi.fn();
vi.mock("@/features/statements/pdf/payment-receipt.pdf", () => ({
  generatePartialPaymentReceiptPDF: (...args: unknown[]) => generatePdf(...args),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

let query: Record<string, unknown> = {};
const refetch = vi.fn();
const failedWith = (error: unknown) => ({
  data: undefined,
  isLoading: false,
  isError: true,
  error,
  refetch,
  isFetching: false,
});
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "t1" }),
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/features/tours/hooks/useTours", () => ({ useTourById: () => query }));
vi.mock("@/features/tour-dashboard/hooks/useTourManifest", () => ({
  useTourManifest: () => query,
}));
vi.mock("@/features/settings/hooks/useAgency", () => ({
  useAgency: () => query,
  useUpdateAgencyPolicies: () => ({ mutate: vi.fn(), isPending: false }),
}));

const serverError = { status: 500, message: "Error interno del servidor" };

describe("QueryErrorState (copy sin tecnicismos, 2026-11-17)", () => {
  it("título con el recurso y su artículo; textos tranquilizadores", () => {
    render(<QueryErrorState resourceArticle="tu" resourceName="suscripción" onRetry={vi.fn()} />);
    expect(screen.getByRole("heading")).toHaveTextContent("No pudimos cargar tu suscripción");
    expect(screen.getByText("¡No te preocupes!")).toBeInTheDocument();
    expect(screen.getByText("Espera unos momentos y vuelve a intentarlo.")).toBeInTheDocument();
    expect(
      screen.getByText("Tus registros están respaldados y protegidos en tu cuenta."),
    ).toBeInTheDocument();
  });

  it("sin recurso: 'No pudimos cargar esta información'; por defecto el artículo es 'tus'", () => {
    const { unmount } = render(<QueryErrorState />);
    expect(screen.getByRole("heading")).toHaveTextContent("No pudimos cargar esta información");
    expect(screen.queryByRole("button")).not.toBeInTheDocument(); // sin onRetry, sin botón
    unmount();
    render(<QueryErrorState resourceName="tours" />);
    expect(screen.getByRole("heading")).toHaveTextContent("No pudimos cargar tus tours");
  });

  it("'Volver a intentar' muestra su propio estado mientras la promesa no termina", async () => {
    let finish: () => void = () => {};
    const onRetry = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    render(<QueryErrorState resourceName="tours" onRetry={onRetry} />);

    await userEvent.click(screen.getByRole("button", { name: /Volver a intentar/ }));
    expect(screen.getByRole("button", { name: /Volviendo a intentar/ })).toBeDisabled();

    await act(async () => finish());
    expect(screen.getByRole("button", { name: /Volver a intentar/ })).toBeEnabled();
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe("Estado de cuenta PDF del operador sin datos de la agencia", () => {
  it("no genera el PDF: avisa y vuelve a pedir los datos", async () => {
    const onAgencyMissing = vi.fn();
    await downloadOperatorStatement({} as never, {
      agency: null,
      onAgencyMissing,
      tourTitle: "Zacatlán",
      tourDepartureDate: "2026-11-20",
    });
    expect(generatePdf).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(STATEMENT_AGENCY_MISSING_MESSAGE, expect.anything());
    expect(onAgencyMissing).toHaveBeenCalledOnce();
  });
});

describe("Pantallas con la consulta fallida", () => {
  beforeEach(() => refetch.mockClear());

  it("Editar tour: un error del servidor no dice 'Tour no encontrado'", async () => {
    query = failedWith(serverError);
    render(<EditTourPage />);
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar el tour");
    expect(screen.queryByText("Tour no encontrado.")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Volver a intentar/ }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("Editar tour: un 404 sí dice 'Tour no encontrado'", () => {
    query = failedWith({ status: 404, message: "Tour no encontrado" });
    render(<EditTourPage />);
    expect(screen.getByText("Tour no encontrado.")).toBeInTheDocument();
  });

  it("Manifiesto: motivo + Reintentar", async () => {
    vi.spyOn(window, "print").mockImplementation(() => {});
    query = failedWith(serverError);
    await act(async () => {
      render(<ManifestPrintView params={Promise.resolve({ id: "t1" })} />);
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos cargar el manifiesto");
  });

  it("Configuración → Políticas: motivo + Reintentar", async () => {
    query = failedWith(serverError);
    render(<PoliciesTab />);
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar tus políticas");
    await userEvent.click(screen.getByRole("button", { name: /Volver a intentar/ }));
    expect(refetch).toHaveBeenCalledOnce();
  });
});
