import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationCenter } from "../components/NotificationCenter";
import { NotificationItem } from "../components/NotificationItem";
import type { NotificationOutput, NotificationsOutput } from "../schemas/notification.schema";
import {
  filterNotifications,
  formatUnreadBadge,
  getNotificationInitials,
} from "../utils/notification.util";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const get = vi.fn();
const patch = vi.fn();
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: (...args: unknown[]) => get(...args),
    patch: (...args: unknown[]) => patch(...args),
  },
}));

const TOUR_ID = "11111111-1111-4111-8111-111111111111";
const BOOKING_ID = "22222222-2222-4222-8222-222222222222";

const notification = (overrides: Partial<NotificationOutput> = {}): NotificationOutput => ({
  id: "33333333-3333-4333-8333-333333333333",
  tourId: TOUR_ID,
  bookingId: BOOKING_ID,
  type: "PRE_BOOKING",
  travelerName: "Mariana Ruiz",
  tourTitle: "Zacatlán de las manzanas",
  seatsCount: 2,
  isRead: false,
  createdAt: new Date().toISOString(),
  ...overrides,
});

/** `matchMedia` de jsdom: escritorio (popover) o celular (bottom sheet). */
const setViewport = (isDesktop: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: isDesktop,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
};

/** Respuestas por URL: la campana también consulta la agencia y la suscripción. */
let subscriptionReadOnly = false;
const routeGet = (notifications: () => unknown) => {
  get.mockImplementation((url: string) => {
    if (url === "/notifications") return notifications();
    if (url === "/agencies/subscription")
      return Promise.resolve({ isReadOnly: subscriptionReadOnly, status: "active" });
    if (url === "/agencies")
      return Promise.resolve({
        bankName: "BBVA",
        bankAccountHolder: "Viajes SA",
        clabeNumber: "012180001234567897",
      });
    return Promise.reject({ status: 404, message: "no" });
  });
};

const notificationCalls = () => get.mock.calls.filter(([url]) => url === "/notifications").length;

const renderCenter = (data: NotificationsOutput) => {
  routeGet(() => Promise.resolve(data));
  patch.mockResolvedValue({});
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <NotificationCenter />
    </QueryClientProvider>,
  );
  return queryClient;
};

beforeEach(() => {
  vi.clearAllMocks();
  subscriptionReadOnly = false;
  setViewport(true);
});
afterEach(() => vi.restoreAllMocks());

describe("utilidades de notificaciones", () => {
  it("iniciales, contador 9+ y filtro Sin leer", () => {
    expect(getNotificationInitials("Mariana Ruiz")).toBe("MR");
    expect(getNotificationInitials("  ana  ")).toBe("AN");
    expect(formatUnreadBadge(3)).toBe("3");
    expect(formatUnreadBadge(10)).toBe("9+");
    const items = [notification({ id: "a" }), notification({ id: "b", isRead: true })];
    expect(filterNotifications(items, "UNREAD").map((i) => i.id)).toEqual(["a"]);
    expect(filterNotifications(items, "ALL")).toHaveLength(2);
  });
});

describe("NotificationItem", () => {
  it("PRE_BOOKING: texto en singular/plural y badge de Magic Link", () => {
    const { rerender } = render(
      <NotificationItem notification={notification({ seatsCount: 1 })} onSelect={vi.fn()} />,
    );
    expect(screen.getByText(/Apartó 1 lugar en/)).toBeInTheDocument();
    expect(screen.getByText("• Pre-reserva · Enviar Magic Link")).toBeInTheDocument();
    expect(screen.getByText("MR")).toBeInTheDocument();
    expect(screen.getByText("Justo ahora")).toBeInTheDocument();

    rerender(
      <NotificationItem notification={notification({ seatsCount: 3 })} onSelect={vi.fn()} />,
    );
    expect(screen.getByText(/Apartó 3 lugares en/)).toBeInTheDocument();
  });

  it("BOOKING_COMPLETED: texto de viajeros y badge verde (gris si ya se leyó)", () => {
    const { rerender } = render(
      <NotificationItem
        notification={notification({ type: "BOOKING_COMPLETED", seatsCount: 4 })}
        onSelect={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/Completó el registro de su booking \(4 viajeros\) en/),
    ).toBeInTheDocument();
    expect(screen.getByText("• Booking completado").className).toMatch(/emerald/);
    expect(screen.getByLabelText("Sin leer")).toBeInTheDocument();

    rerender(
      <NotificationItem
        notification={notification({ type: "BOOKING_COMPLETED", seatsCount: 1, isRead: true })}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText(/\(1 viajero\)/)).toBeInTheDocument();
    expect(screen.getByText("• Booking completado").className).toMatch(/slate/);
    expect(screen.queryByLabelText("Sin leer")).not.toBeInTheDocument();
  });
});

describe("NotificationCenter (campana)", () => {
  it("muestra el contador (9+ desde 10) y lo oculta sin pendientes", async () => {
    renderCenter({ items: [notification()], unreadCount: 12 });
    expect(await screen.findByText("9+")).toBeInTheDocument();
  });

  it("sin pendientes no hay contador; el popover muestra 'Todo al día'", async () => {
    const user = userEvent.setup();
    renderCenter({ items: [], unreadCount: 0 });
    const bell = await screen.findByRole("button", { name: /no tienes avisos nuevos/ });
    expect(within(bell).queryByText(/\d/)).not.toBeInTheDocument();

    await user.click(bell);
    expect(await screen.findByText("Todo al día")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Marcar todas/ })).not.toBeInTheDocument();
  });

  it("clic en una notificación: la marca como leída (optimista), cierra y navega al grupo", async () => {
    const user = userEvent.setup();
    const queryClient = renderCenter({ items: [notification()], unreadCount: 1 });
    // La respuesta del PATCH tarda: el contador baja antes de que la API conteste.
    patch.mockImplementation(() => new Promise(() => {}));

    await user.click(await screen.findByRole("button", { name: /1 sin leer/ }));
    await user.click(await screen.findByRole("button", { name: /Mariana Ruiz/ }));

    expect(patch).toHaveBeenCalledWith(`/notifications/33333333-3333-4333-8333-333333333333/read`);
    expect(push).toHaveBeenCalledWith(`/tours/${TOUR_ID}?bookingId=${BOOKING_ID}`);
    await waitFor(() =>
      expect(queryClient.getQueryData<NotificationsOutput>(["notifications"])?.unreadCount).toBe(0),
    );
    await waitFor(() => expect(screen.queryByText("Notificaciones")).not.toBeInTheDocument());
  });

  it("una ya leída solo navega (sin PATCH)", async () => {
    const user = userEvent.setup();
    renderCenter({ items: [notification({ isRead: true })], unreadCount: 0 });

    await user.click(await screen.findByRole("button", { name: /no tienes avisos nuevos/ }));
    await user.click(await screen.findByRole("button", { name: /Mariana Ruiz/ }));

    expect(patch).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith(`/tours/${TOUR_ID}?bookingId=${BOOKING_ID}`);
  });

  it("filtro Sin leer y 'Marcar todas como leídas'", async () => {
    const user = userEvent.setup();
    const queryClient = renderCenter({
      items: [
        notification({ id: "44444444-4444-4444-8444-444444444444", travelerName: "Ana Pérez" }),
        notification({ isRead: true, travelerName: "Luis Gómez" }),
      ],
      unreadCount: 1,
    });

    await user.click(await screen.findByRole("button", { name: /1 sin leer/ }));
    expect(screen.getByText("• 1 nueva")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Sin leer (1)" }));
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.queryByText("Luis Gómez")).not.toBeInTheDocument();

    // El PATCH queda pendiente: se comprueba la actualización optimista, no el refetch posterior.
    patch.mockImplementation(() => new Promise(() => {}));
    await user.click(screen.getByRole("button", { name: /Marcar todas como leídas/ }));
    expect(patch).toHaveBeenCalledWith("/notifications/read-all");
    await waitFor(() =>
      expect(queryClient.getQueryData<NotificationsOutput>(["notifications"])?.unreadCount).toBe(0),
    );
  });

  it("en celular abre el bottom sheet con 'Marcar todas' y botón Cerrar", async () => {
    setViewport(false);
    const user = userEvent.setup();
    renderCenter({ items: [notification()], unreadCount: 1 });

    await user.click(await screen.findByRole("button", { name: /1 sin leer/ }));
    const dialog = await screen.findByRole("dialog", { name: "Notificaciones" });
    expect(within(dialog).getByRole("button", { name: /Marcar todas/ })).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Cerrar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});

describe("actualización de la campana", () => {
  it("al volver a la pestaña con datos viejos (> 45 s) vuelve a pedir, aunque el provider apague el foco", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      renderCenter({ items: [notification()], unreadCount: 1 });
      await screen.findByText("1");
      expect(notificationCalls()).toBe(1);

      vi.setSystemTime(Date.now() + 60_000);
      routeGet(() =>
        Promise.resolve({
          items: [notification(), notification({ id: "n2" })],
          unreadCount: 2,
        }),
      );
      focusManager.setFocused(false);
      focusManager.setFocused(true);

      expect(await screen.findByText("2")).toBeInTheDocument();
      expect(notificationCalls()).toBe(2);
    } finally {
      focusManager.setFocused(undefined);
      vi.useRealTimers();
    }
  });

  it.each([
    ["escritorio", true],
    ["celular", false],
  ])(
    "abrir la campana (%s) pide de nuevo y muestra el skeleton hasta que resuelve",
    async (_n, isDesktop) => {
      setViewport(isDesktop);
      const user = userEvent.setup();
      renderCenter({ items: [notification()], unreadCount: 1 });
      const bell = await screen.findByRole("button", { name: /1 sin leer/ });
      expect(notificationCalls()).toBe(1);

      let resolveFetch: (value: NotificationsOutput) => void = () => {};
      routeGet(() => new Promise<NotificationsOutput>((r) => (resolveFetch = r)));
      await user.click(bell);

      expect(await screen.findByRole("status")).toHaveTextContent("Cargando notificaciones");
      expect(notificationCalls()).toBe(2);
      // El contador de la campana no desaparece durante el refetch.
      expect(
        screen.getAllByRole("button", { name: /1 sin leer/, hidden: true }).length,
      ).toBeGreaterThan(0);
      expect(screen.queryByText("Mariana Ruiz")).not.toBeInTheDocument();

      resolveFetch({ items: [notification({ travelerName: "Luis Pérez" })], unreadCount: 1 });
      expect(await screen.findByText("Luis Pérez")).toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    },
  );

  it("si el refetch al abrir falla, conserva los datos en caché", async () => {
    const user = userEvent.setup();
    renderCenter({ items: [notification()], unreadCount: 1 });
    const bell = await screen.findByRole("button", { name: /1 sin leer/ });
    routeGet(() => Promise.reject({ status: 500, message: "Error interno del servidor" }));
    await user.click(bell);
    expect(await screen.findByText("Mariana Ruiz")).toBeInTheDocument();
    expect(screen.queryByText(/No pudimos cargar/)).not.toBeInTheDocument();
  });
});

describe("Enviar acceso por WhatsApp desde la campana", () => {
  const booking = (overrides: Partial<NonNullable<NotificationOutput["booking"]>> = {}) => ({
    status: "AWAITING_REGISTRATION" as const,
    whatsappPhone: "+522281234567",
    magicToken: "tok123",
    pendingDeposit: 1500,
    currency: "MXN" as const,
    ...overrides,
  });
  const openBell = async (items: NotificationOutput[], isDesktop = true) => {
    setViewport(isDesktop);
    const user = userEvent.setup();
    renderCenter({ items, unreadCount: items.filter((i) => !i.isRead).length });
    await user.click(await screen.findByRole("button", { name: /sin leer|no tienes avisos/ }));
    await screen.findByText("Mariana Ruiz");
    return user;
  };
  const link = () => screen.queryByRole("link", { name: "Enviar acceso por WhatsApp" });

  it.each([
    ["escritorio", true],
    ["celular", false],
  ])("muestra el enlace wa.me con Magic Link, anticipo y CLABE (%s)", async (_n, isDesktop) => {
    await openBell([notification({ booking: booking() })], isDesktop);
    const a = await screen.findByRole("link", { name: "Enviar acceso por WhatsApp" });
    expect(a).toHaveAttribute("target", "_blank");
    expect(a).toHaveAttribute("rel", "noopener noreferrer");
    const href = a.getAttribute("href")!;
    expect(href.startsWith("https://wa.me/522281234567?text=")).toBe(true);
    const text = decodeURIComponent(href.split("text=")[1]!);
    expect(text).toContain(`${window.location.origin}/register?token=tok123`);
    expect(text).toContain("$1,500.00 MXN");
    expect(text).toContain("Mariana Ruiz");
    expect(text).toContain("Zacatlán de las manzanas");
    await waitFor(() => expect(link()?.getAttribute("href")).toContain("CLABE"));
  });

  it("PENDING usa el mensaje de recordatorio de pago", async () => {
    await openBell([notification({ booking: booking({ status: "PENDING" }) })]);
    const a = await screen.findByRole("link", { name: "Enviar acceso por WhatsApp" });
    expect(decodeURIComponent(a.getAttribute("href")!)).toContain("completar tu registro");
  });

  it("el clic marca leída, no navega ni dispara onSelect", async () => {
    const user = await openBell([notification({ booking: booking() })]);
    const a = await screen.findByRole("link", { name: "Enviar acceso por WhatsApp" });
    a.addEventListener("click", (e) => e.preventDefault());
    await user.click(a);
    expect(patch).toHaveBeenCalledWith("/notifications/33333333-3333-4333-8333-333333333333/read");
    expect(push).not.toHaveBeenCalled();
  });

  it("si ya estaba leída no hace PATCH", async () => {
    const user = await openBell([notification({ isRead: true, booking: booking() })]);
    const a = await screen.findByRole("link", { name: "Enviar acceso por WhatsApp" });
    a.addEventListener("click", (e) => e.preventDefault());
    await user.click(a);
    expect(patch).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it.each([
    ["BOOKING_COMPLETED", { type: "BOOKING_COMPLETED" as const, booking: booking() }],
    ["booking null", { booking: null }],
    ["back-end viejo sin booking", {}],
    ["CONFIRMED", { booking: booking({ status: "CONFIRMED" }) }],
    ["CANCELLED", { booking: booking({ status: "CANCELLED" }) }],
    ["sin magicToken", { booking: booking({ magicToken: null }) }],
    ["sin WhatsApp válido", { booking: booking({ whatsappPhone: null }) }],
  ])("sin botón: %s (y el ítem sigue navegando)", async (_n, overrides) => {
    const user = await openBell([notification(overrides)]);
    expect(link()).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Mariana Ruiz/ }));
    expect(push).toHaveBeenCalled();
  });

  it("sin botón en Modo Solo Lectura", async () => {
    subscriptionReadOnly = true;
    await openBell([notification({ booking: booking() })]);
    await new Promise((r) => setTimeout(r, 50));
    expect(link()).not.toBeInTheDocument();
  });
});
