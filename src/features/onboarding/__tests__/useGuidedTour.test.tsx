import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GuidedTourDefinition } from "../constants/guided-tours";
import { useGuidedTour } from "../hooks/useGuidedTour";
import {
  buildGuidedTourStorageKey,
  hasSeenGuidedTour,
  resolveAvailableSteps,
} from "../utils/guided-tour.util";

// driver.js simulado: se guardan la configuración y los callbacks para dispararlos en la prueba.
const driverMock = vi.hoisted(() => {
  const state = { config: null as null | Record<string, unknown>, active: false };
  const instance = {
    drive: vi.fn(() => {
      state.active = true;
    }),
    isActive: () => state.active,
    // Como driver.js: `destroy()` por código llega con `reason: "api"`; la ✕, Esc, etc. con otro.
    destroy: vi.fn((reason: string = "api") => {
      state.active = false;
      const onDestroyed = state.config?.onDestroyed as
        ((el: unknown, step: unknown, opts: { reason: string }) => void) | undefined;
      onDestroyed?.(undefined, undefined, { reason });
    }),
  };
  const driver = vi.fn((config: Record<string, unknown>) => {
    state.config = config;
    return instance;
  });
  return { state, instance, driver };
});
vi.mock("driver.js", () => ({ driver: driverMock.driver }));

const TEST_TOUR: GuidedTourDefinition = {
  id: "test",
  version: 1,
  steps: [
    { title: "Bienvenida", description: "Paso general" },
    { target: "visible", title: "Visible", description: "Con elemento" },
    { target: "missing", title: "Faltante", description: "Sin elemento" },
  ],
};

// jsdom no calcula cajas: un elemento es "visible" si se le simula una caja.
function markVisible(element: HTMLElement) {
  element.getClientRects = () => [{}] as unknown as DOMRectList;
}

function Harness({ autoStart = false }: { autoStart?: boolean }) {
  const { start } = useGuidedTour(TEST_TOUR, { autoStart });
  return (
    <>
      <div
        data-tour="visible"
        ref={(el) => {
          if (el) markVisible(el);
        }}
      />
      <div data-tour="hidden-only" />
      <button type="button" onClick={() => void start()}>
        Ver guía
      </button>
    </>
  );
}

const storageKey = buildGuidedTourStorageKey(TEST_TOUR);
const lastSteps = () => (driverMock.state.config?.steps as { popover: { title: string } }[]) ?? [];

beforeEach(() => {
  window.localStorage.clear();
  driverMock.state.config = null;
  driverMock.state.active = false;
  vi.clearAllMocks();
});

afterEach(() => vi.useRealTimers());

describe("resolveAvailableSteps", () => {
  it("conserva los pasos generales y omite los que no tienen elemento visible", () => {
    const root = document.createElement("div");
    root.innerHTML = '<div data-tour="hidden"></div><div data-tour="shown"></div>';
    markVisible(root.querySelector('[data-tour="shown"]') as HTMLElement);

    const result = resolveAvailableSteps(
      [
        { title: "General", description: "" },
        { target: "hidden", title: "Oculto", description: "" },
        { target: "shown", title: "Visible", description: "" },
      ],
      root,
    );

    expect(result.map(({ step }) => step.title)).toEqual(["General", "Visible"]);
  });

  it("elige la variante visible cuando escritorio y celular comparten la marca", () => {
    const root = document.createElement("div");
    root.innerHTML = '<div data-tour="x" id="desktop"></div><div data-tour="x" id="mobile"></div>';
    markVisible(root.querySelector("#mobile") as HTMLElement);

    const [resolved] = resolveAvailableSteps([{ target: "x", title: "X", description: "" }], root);
    expect(resolved.element?.id).toBe("mobile");
  });
});

describe("useGuidedTour", () => {
  it("el botón abre la guía en español solo con los pasos disponibles", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Ver guía" }));

    expect(driverMock.instance.drive).toHaveBeenCalledTimes(1);
    expect(lastSteps().map((s) => s.popover.title)).toEqual(["Bienvenida", "Visible"]);
    expect(driverMock.state.config).toMatchObject({
      nextBtnText: "Siguiente",
      prevBtnText: "Anterior",
      doneBtnText: "Entendido",
      progressText: "{{current}} de {{total}}",
    });
  });

  it("se abre sola la primera vez y queda vista cuando la persona la cierra", async () => {
    vi.useFakeTimers();
    render(<Harness autoStart />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(driverMock.instance.drive).toHaveBeenCalledTimes(1);
    expect(hasSeenGuidedTour(storageKey)).toBe(false);

    act(() => driverMock.instance.destroy("close"));
    expect(hasSeenGuidedTour(storageKey)).toBe(true);
  });

  it("no se abre sola si ya se vio o si aún no está habilitada", async () => {
    vi.useFakeTimers();
    const { unmount } = render(<Harness />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    unmount();

    window.localStorage.setItem(storageKey, "seen");
    render(<Harness autoStart />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(driverMock.instance.drive).not.toHaveBeenCalled();
  });

  it("salir de la pantalla cierra la guía sin marcarla como vista", async () => {
    const { unmount } = render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Ver guía" }));
    unmount();

    // El recargado en caliente de desarrollo también desmonta: antes eso la marcaba como vista
    // sin que nadie la leyera y ya no se volvía a abrir sola.
    expect(driverMock.instance.destroy).toHaveBeenCalled();
    expect(hasSeenGuidedTour(storageKey)).toBe(false);
  });
});
