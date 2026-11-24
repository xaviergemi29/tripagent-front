import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SubscriptionOutput } from "../../../schemas/subscription.schema";
import { buildStripeCheckoutUrl, getTrialConsumedPercent } from "../../../utils/subscription.util";
import { SubscriptionTab } from "../SubscriptionTab";
import { SubscriptionTabBadge } from "../SubscriptionTabBadge";

const AGENCY_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa7492";

const baseSubscription = (): SubscriptionOutput => ({
  status: "trialing",
  trialDaysTotal: 30,
  trialDaysConsumed: 24,
  trialDaysRemaining: 6,
  trialExpired: false,
  isReadOnly: false,
  // 28 de noviembre, 17:59 en CDMX.
  trialEndsAt: "2026-11-28T23:59:59.000Z",
  currentPeriodEndsAt: null,
  cancellation: null,
  priceMxn: 999,
  metrics: { activeToursCount: 12, registeredTravelersCount: 184 },
  speiDetails: {
    bank: "BBVA Bancomer",
    beneficiary: "TripAgent",
    clabe: "012180015549201823",
    reference: "BRUJI-7492",
  },
  stripePaymentLink: "https://buy.stripe.com/test_123",
  whatsappSupportNumber: "522281234567",
});

let subscription: SubscriptionOutput | undefined;
let loadError: Error | null = null;
const refetchSubscription = vi.fn();
const cancelSubscription = vi.fn();
const reactivateSubscription = vi.fn();
let sessionRole = "ADMIN";
vi.mock("../../../hooks/useAgencySubscription", () => ({
  useCancelSubscription: () => ({ mutate: cancelSubscription, isPending: false }),
  useReactivateSubscription: () => ({ mutate: reactivateSubscription, isPending: false }),
  useAgencySubscription: () => ({
    data: subscription,
    isLoading: false,
    isError: Boolean(loadError),
    error: loadError,
    refetch: refetchSubscription,
    isFetching: false,
  }),
}));
vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({
    data: { agencyId: AGENCY_ID, agencyName: "Bruji Tours", role: sessionRole },
  }),
}));
const copy = vi.fn<(text: string) => Promise<boolean>>(async () => true);
vi.mock("@/shared/utils/clipboard", () => ({ copyToClipboard: (text: string) => copy(text) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const assign = vi.fn();
beforeEach(() => {
  subscription = baseSubscription();
  sessionRole = "ADMIN";
  cancelSubscription.mockClear();
  reactivateSubscription.mockClear();
  copy.mockClear();
  assign.mockClear();
  vi.stubGlobal("location", { ...window.location, assign });
  // `unstubAllGlobals` (afterEach) también quita el ResizeObserver de vitest.setup.ts, que usa el
  // RadioGroup de Radix del modal de baja.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("Configuración → Suscripción", () => {
  it("en prueba muestra el vencimiento, el consumo y las métricas que envía la API", () => {
    render(<SubscriptionTab />);

    expect(screen.getByText("Periodo de Prueba")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Vence: .*28 de noviembre/i })).toBeInTheDocument();
    expect(screen.getByText("Quedan 6 días de prueba gratuita")).toBeInTheDocument();
    expect(screen.getByText("Día 24 de 30 (80%)")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "80");
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("184")).toBeInTheDocument();
    // Precio: cifra grande y "MXN/mes" chico, con el formato de `formatCurrency`.
    expect(screen.getByText("$999.00")).toBeInTheDocument();
    expect(screen.getByText(/MXN\/mes/)).toBeInTheDocument();
    expect(screen.getByText("¿Qué pasa si vence mi periodo de prueba?")).toBeInTheDocument();
  });

  it("'Activar Plan con Tarjeta' redirige a Stripe con client_reference_id = agencia", async () => {
    const user = userEvent.setup();
    render(<SubscriptionTab />);

    await user.click(screen.getByRole("button", { name: /Activar Plan con Tarjeta/ }));
    expect(assign).toHaveBeenCalledWith(
      `https://buy.stripe.com/test_123?client_reference_id=${AGENCY_ID}`,
    );
  });

  it("el modal SPEI copia CLABE y referencia y prellena el WhatsApp", async () => {
    const user = userEvent.setup();
    render(<SubscriptionTab />);

    await user.click(screen.getByRole("button", { name: /Pagar por Transferencia SPEI/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Pago por Transferencia SPEI")).toBeInTheDocument();
    expect(within(dialog).getByText("$999.00 MXN")).toBeInTheDocument();
    expect(
      within(dialog).getByText("IVA incluido · Suscripción mensual Plan PRO"),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("012 180 01554920182 3")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Copiar CLABE" }));
    expect(copy).toHaveBeenCalledWith("012180015549201823");
    expect(within(dialog).getByText("¡Copiado!")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Copiar Referencia" }));
    expect(copy).toHaveBeenCalledWith("BRUJI-7492");

    const whatsapp = within(dialog).getByRole("link", { name: /Enviar comprobante/ });
    const href = new URL(whatsapp.getAttribute("href")!);
    expect(href.origin + href.pathname).toBe("https://wa.me/522281234567");
    expect(href.searchParams.get("text")).toBe(
      "¡Hola TripAgent! Adjunto mi comprobante de pago SPEI para activar el Plan PRO de mi agencia: Bruji Tours (Referencia: BRUJI-7492).",
    );
  });

  it("el modal SPEI se cierra con ✕ y con 'Volver a Suscripción'", async () => {
    const user = userEvent.setup();
    render(<SubscriptionTab />);
    const open = () =>
      user.click(screen.getByRole("button", { name: /Pagar por Transferencia SPEI/ }));

    await open();
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", { name: "Cerrar" }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    await open();
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "Volver a Suscripción",
      }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    await open();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("sin WhatsApp de soporte, el modal no muestra el botón de comprobante", async () => {
    subscription = { ...baseSubscription(), whatsappSupportNumber: null };
    const user = userEvent.setup();
    render(<SubscriptionTab />);

    await user.click(screen.getByRole("button", { name: /Pagar por Transferencia SPEI/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByRole("link", { name: /Enviar comprobante/ })).toBeNull();
    expect(within(dialog).getByText("BRUJI-7492")).toBeInTheDocument();
  });

  it("sin canales de pago configurados, los botones se ven deshabilitados con un aviso", () => {
    subscription = { ...baseSubscription(), speiDetails: null, stripePaymentLink: null };
    render(<SubscriptionTab />);

    expect(screen.getByRole("button", { name: /Activar Plan con Tarjeta/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Transferencia SPEI/ })).toBeDisabled();
    expect(screen.getByText(/Contacta a TripAgent para activar tu plan/)).toBeInTheDocument();
  });

  it("con un solo canal configurado, el otro queda deshabilitado", () => {
    subscription = { ...baseSubscription(), stripePaymentLink: null };
    render(<SubscriptionTab />);

    expect(screen.getByRole("button", { name: /Activar Plan con Tarjeta/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Transferencia SPEI/ })).toBeEnabled();
    expect(
      screen.getByText("Uno de los medios de pago aún no está disponible."),
    ).toBeInTheDocument();
  });

  it("con el plan activo: insignia verde, sin barra de prueba ni botones de pago", () => {
    subscription = { ...baseSubscription(), status: "active" };
    render(<SubscriptionTab />);

    expect(screen.getByText("Plan PRO activo")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByRole("button", { name: /Activar Plan/ })).toBeNull();
    expect(screen.getByText("Tu Plan Agencia PRO está activo.")).toBeInTheDocument();
  });

  it("prueba vencida: lo indica en rojo", () => {
    subscription = {
      ...baseSubscription(),
      trialExpired: true,
      trialDaysRemaining: 0,
      trialDaysConsumed: 30,
    };
    render(<SubscriptionTab />);

    expect(screen.getByText("Prueba vencida")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Venció:/ })).toBeInTheDocument();
  });
});

describe("Suscripción: consulta fallida", () => {
  it("muestra el aviso tranquilizador con Volver a intentar, sin tecnicismos", async () => {
    subscription = undefined;
    loadError = new Error("Error interno del servidor");
    render(<SubscriptionTab />);
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar tu suscripción");
    expect(screen.queryByText(/Error interno del servidor/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Volver a intentar/ }));
    expect(refetchSubscription).toHaveBeenCalledOnce();
    loadError = null;
  });
});

describe("Insignia de la pestaña Suscripción", () => {
  it("en prueba: 'Prueba Nd'; activo: 'Plan PRO'; cancelado: nada", () => {
    const { rerender, container } = render(<SubscriptionTabBadge />);
    expect(screen.getByText("Prueba 6d")).toBeInTheDocument();

    subscription = { ...baseSubscription(), status: "active" };
    rerender(<SubscriptionTabBadge />);
    expect(screen.getByText("Plan PRO")).toBeInTheDocument();

    subscription = { ...baseSubscription(), status: "canceled" };
    rerender(<SubscriptionTabBadge />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("subscription.util", () => {
  it("conserva los parámetros del Payment Link y acota el porcentaje", () => {
    expect(
      buildStripeCheckoutUrl("https://buy.stripe.com/x?prefilled_email=a%40b.mx", "ag-1"),
    ).toBe("https://buy.stripe.com/x?prefilled_email=a%40b.mx&client_reference_id=ag-1");
    expect(getTrialConsumedPercent(24, 30)).toBe(80);
    expect(getTrialConsumedPercent(40, 30)).toBe(100);
    expect(getTrialConsumedPercent(0, 0)).toBe(100);
  });
});

describe("Cancelar suscripción (cobro por transferencia)", () => {
  // Plan activo con corte el 30 de noviembre, 23:59:59 CDMX.
  const activeSubscription = (): SubscriptionOutput => ({
    ...baseSubscription(),
    status: "active",
    currentPeriodEndsAt: "2026-12-01T05:59:59.999Z",
  });

  it("plan activo: vencimiento, método de pago y el enlace discreto para cancelar", () => {
    subscription = activeSubscription();
    render(<SubscriptionTab />);
    expect(
      screen.getByText(/Próximo vencimiento: .*30 de noviembre.*Transferencia bancaria/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar suscripción" })).toBeInTheDocument();
  });

  it("el enlace no aparece para un rol distinto de ADMIN ni en prueba", () => {
    subscription = activeSubscription();
    sessionRole = "SALES";
    const { unmount } = render(<SubscriptionTab />);
    expect(screen.queryByRole("button", { name: "Cancelar suscripción" })).not.toBeInTheDocument();
    unmount();

    sessionRole = "ADMIN";
    subscription = baseSubscription(); // trialing
    render(<SubscriptionTab />);
    expect(screen.queryByRole("button", { name: "Cancelar suscripción" })).not.toBeInTheDocument();
  });

  it("el modal pide un motivo, avisa la fecha de corte y envía la baja", async () => {
    const user = userEvent.setup();
    subscription = activeSubscription();
    render(<SubscriptionTab />);
    await user.click(screen.getByRole("button", { name: "Cancelar suscripción" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/Tu suscripción seguirá activa hasta el/)).toHaveTextContent(
      /30 de noviembre de 2026.*Modo Solo Lectura/,
    );

    // Sin motivo no se envía.
    await user.click(within(dialog).getByRole("button", { name: "Confirmar cancelación" }));
    expect(await within(dialog).findByText("Selecciona un motivo")).toBeInTheDocument();
    expect(cancelSubscription).not.toHaveBeenCalled();

    // "Otro" muestra el comentario opcional.
    await user.click(within(dialog).getByLabelText("Otro"));
    await user.type(within(dialog).getByLabelText(/Cuéntanos más/), "Cerramos la agencia");
    await user.click(within(dialog).getByRole("button", { name: "Confirmar cancelación" }));
    expect(cancelSubscription.mock.calls[0]![0]).toEqual({
      reason: "OTHER",
      comments: "Cerramos la agencia",
    });
  });

  it("un motivo distinto de 'Otro' se envía sin comentario", async () => {
    const user = userEvent.setup();
    subscription = activeSubscription();
    render(<SubscriptionTab />);
    await user.click(screen.getByRole("button", { name: "Cancelar suscripción" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByLabelText("Temporada baja / No tengo tours ahorita"));
    expect(within(dialog).queryByLabelText(/Cuéntanos más/)).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Confirmar cancelación" }));
    expect(cancelSubscription.mock.calls[0]![0]).toEqual({ reason: "LOW_SEASON" });
  });

  it("cancelación programada: banner con la fecha de corte, reactivar y sin enlace de cancelar", async () => {
    const user = userEvent.setup();
    subscription = {
      ...activeSubscription(),
      status: "cancel_scheduled",
      cancellation: { canceledAt: "2026-11-23T18:00:00.000Z", reason: "PRICE", comment: null },
    };
    render(<SubscriptionTab />);
    expect(
      screen.getByText(/Tendrás acceso completo hasta el .*30 de noviembre/),
    ).toBeInTheDocument();
    expect(screen.getByText("Cancelación programada", { selector: "span" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar suscripción" })).not.toBeInTheDocument();
    // El plan sigue activo: no se ofrece volver a pagar.
    expect(
      screen.getByText("Tu Plan Agencia PRO sigue activo hasta tu fecha de corte."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Reactivar suscripción/ }));
    expect(reactivateSubscription).toHaveBeenCalledTimes(1);
  });

  it("pasada la fecha de corte la tarjeta dice cancelada y no hay banner de baja programada", () => {
    subscription = {
      ...activeSubscription(),
      status: "cancel_scheduled",
      isReadOnly: true,
      cancellation: { canceledAt: "2026-11-23T18:00:00.000Z", reason: "PRICE", comment: null },
    };
    render(<SubscriptionTab />);
    expect(screen.getByText("Suscripción cancelada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Reactivar suscripción/ })).not.toBeInTheDocument();
  });
});
