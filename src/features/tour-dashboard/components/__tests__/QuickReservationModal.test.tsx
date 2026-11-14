import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuickReservationModal } from "../QuickReservationModal";

const copy = vi.fn<(text: string) => Promise<boolean>>();
vi.mock("@/shared/utils/clipboard", () => ({ copyToClipboard: (t: string) => copy(t) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/features/travelers/hooks/useTravelers", () => ({
  useTravelerLookup: () => ({ lookupTraveler: async () => null }),
}));
vi.mock("@/features/external-registration/hooks/useBookings", () => ({
  useQuickReservation: () => ({
    isPending: false,
    mutate: (_: unknown, opts: { onSuccess: (r: { token: string }) => void }) =>
      opts.onSuccess({ token: "tok123" }),
  }),
}));

const TOUR_ID = "c1c1c1c1-c1c1-4c1c-8c1c-c1c1c1c1c1c1";

/** Captura el apartado rápido y llega a la pantalla del Magic Link. */
const reachMagicLinkStep = async (onClose = vi.fn()) => {
  const user = userEvent.setup();
  render(<QuickReservationModal tourId={TOUR_ID} isOpen onClose={onClose} />);
  await user.type(screen.getByPlaceholderText("Ej. Carlos Pérez"), "Carlos Pérez");
  await user.type(screen.getByPlaceholderText("2281234567"), "2281234567");
  await user.type(screen.getByPlaceholderText("email@gmail.com"), "carlos@mail.com");
  await user.click(screen.getByRole("button", { name: /Apartar y Crear Link/ }));
  await screen.findByRole("button", { name: /Copiar Enlace y Cerrar/ });
  return { user, onClose };
};

beforeEach(() => vi.clearAllMocks());

describe("QuickReservationModal: Copiar Enlace y Cerrar", () => {
  it("copia el Magic Link y cierra el modal", async () => {
    copy.mockResolvedValue(true);
    const { user, onClose } = await reachMagicLinkStep();

    await user.click(screen.getByRole("button", { name: /Copiar Enlace y Cerrar/ }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(copy).toHaveBeenCalledWith(`${window.location.origin}/register?token=tok123`);
  });

  it("si no se pudo copiar, el modal sigue abierto para copiarlo a mano", async () => {
    copy.mockResolvedValue(false);
    const { user, onClose } = await reachMagicLinkStep();

    await user.click(screen.getByRole("button", { name: /Copiar Enlace y Cerrar/ }));

    await waitFor(() => expect(copy).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
  });
});
