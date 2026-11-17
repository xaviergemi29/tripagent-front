import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EditTravelerDrawer } from "@/features/travelers/components/EditTravelerDrawer";
import { TravelerHistoryDrawer } from "@/features/travelers/components/TravelerHistoryDrawer";
import { RefundDrawer } from "@/features/tour-dashboard/components/finance/RefundDrawer";

// Los drawers usan el Sheet de Radix (2026-11-17): son un diálogo con título, cierran con Escape,
// atrapan el foco y bloquean el scroll de la página. Antes eran `div` fijos sin nada de eso.

vi.mock("@/features/travelers/hooks/useTravelers", () => ({
  useUpdateTraveler: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useTravelerHistory: () => ({
    data: { id: "v1", fullName: "Ana Torres", history: [], metrics: {} },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    isFetching: false,
  }),
}));
vi.mock("@/features/tour-dashboard/hooks/usePayments", () => ({
  useCreatePayment: () => ({ mutate: vi.fn(), isPending: false }),
}));

const traveler = {
  id: "v1",
  fullName: "Ana Torres",
  whatsappPhone: "+522281234567",
  email: "ana@correo.mx",
  emergencyContactName: "Luis Torres",
  emergencyContactPhone: "+522281112222",
  medicalNotes: "",
  birthDate: "1990-05-29",
} as never;

const refund = {
  bookingId: "b1",
  fullName: "Beto Ruiz",
  whatsapp: "+522289998888",
  paidAmount: 1000,
  retainedAmount: 0,
  refundedAmount: 0,
  refundableAmount: 1000,
  refundStatus: "PENDING",
  payments: [],
} as never;

describe("Drawers como diálogos accesibles", () => {
  it.each([
    [
      "Editar viajero",
      (onClose: () => void) => <EditTravelerDrawer traveler={traveler} isOpen onClose={onClose} />,
      "Ana Torres",
    ],
    [
      "Historial del viajero",
      (onClose: () => void) => <TravelerHistoryDrawer travelerId="v1" onClose={onClose} />,
      "Perfil del Viajero",
    ],
    [
      "Reembolso",
      (onClose: () => void) => (
        <RefundDrawer
          tourId="t1"
          currency="MXN"
          refund={refund}
          canRegisterRefunds
          onClose={onClose}
        />
      ),
      "Beto Ruiz",
    ],
  ])("%s: diálogo con título, cierra con Escape y con la ✕ etiquetada", async (_, ui, title) => {
    const onClose = vi.fn();
    render(ui(onClose));

    expect(await screen.findByRole("dialog", { name: title })).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
