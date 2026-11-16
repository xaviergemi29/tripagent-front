import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TourBannerInfo } from "../TourBannerInfo";

const TITLE = "Folleto Digital Interactivo";
const KEY = "tripagent_dismiss_tour_banner";

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("TourBannerInfo", () => {
  it("se muestra la primera vez y al cerrarlo queda guardado", async () => {
    const { unmount } = render(<TourBannerInfo />);
    expect(screen.getByText(TITLE)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Cerrar aviso" }));
    expect(screen.queryByText(TITLE)).toBeNull();
    expect(window.localStorage.getItem(KEY)).toBe("true");

    unmount();
    render(<TourBannerInfo />);
    expect(screen.queryByText(TITLE)).toBeNull();
  });

  it("con el almacenamiento bloqueado no rompe la pantalla y se puede cerrar", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Acceso denegado", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Acceso denegado", "SecurityError");
    });

    render(<TourBannerInfo />);
    expect(screen.getByText(TITLE)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Cerrar aviso" }));
    expect(screen.queryByText(TITLE)).toBeNull();
  });
});
