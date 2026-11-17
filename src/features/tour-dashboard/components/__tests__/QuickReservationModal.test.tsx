import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuickReservationModal } from "@/features/tour-dashboard/components/passengers/QuickReservationModal";

const copy = vi.fn<(text: string) => Promise<boolean>>();
vi.mock("@/shared/utils/clipboard", () => ({ copyToClipboard: (t: string) => copy(t) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/features/travelers/hooks/useTravelers", () => ({
  useTravelerLookup: () => ({ lookupTraveler: async () => null }),
}));
const mutate = vi.fn((_: unknown, opts: { onSuccess: (r: { token: string }) => void }) =>
  opts.onSuccess({ token: "tok123" }),
);
vi.mock("@/features/tour-dashboard/hooks/useBookingActions", () => ({
  useQuickReservation: () => ({ isPending: false, mutate }),
}));
// País inicial del WhatsApp = el del teléfono de la agencia.
const agency = vi.hoisted(() => ({
  phone: null as string | null,
  phoneCountry: null as string | null,
}));
vi.mock("@/features/settings/hooks/useAgency", () => ({ useAgency: () => ({ data: agency }) }));

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

beforeEach(() => {
  vi.clearAllMocks();
  agency.phone = null;
  agency.phoneCountry = null;
});

describe("QuickReservationModal: WhatsApp internacional", () => {
  it("envía el WhatsApp en E.164 con su país y arranca con el país de la agencia", async () => {
    agency.phone = "+12125550000";
    agency.phoneCountry = "US";
    copy.mockResolvedValue(true);
    const user = userEvent.setup();
    render(<QuickReservationModal tourId={TOUR_ID} isOpen onClose={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /País del teléfono: Estados Unidos \(\+1\)/ }),
    ).toBeTruthy();
    await user.type(screen.getByPlaceholderText("Ej. Carlos Pérez"), "Carlos Pérez");
    await user.type(screen.getByPlaceholderText("2281234567"), "2125551234");
    await user.type(screen.getByPlaceholderText("email@gmail.com"), "carlos@mail.com");
    await user.click(screen.getByRole("button", { name: /Apartar y Crear Link/ }));

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate.mock.calls[0]?.[0]).toMatchObject({
      whatsapp: "+12125551234",
      whatsappCountry: "US",
      tourId: TOUR_ID,
    });
  });

  it("al pegar un número con +lada cambia el país y no duplica la lada", async () => {
    const user = userEvent.setup();
    render(<QuickReservationModal tourId={TOUR_ID} isOpen onClose={vi.fn()} />);

    const phone = screen.getByPlaceholderText("2281234567") as HTMLInputElement;
    await user.click(phone);
    await user.paste("+34 612 345 678");

    expect(phone.value).toBe("612345678");
    expect(screen.getByRole("button", { name: /País del teléfono: España \(\+34\)/ })).toBeTruthy();
  });
});

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
