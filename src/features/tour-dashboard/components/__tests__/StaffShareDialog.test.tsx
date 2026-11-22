import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StaffShareDialog } from "../header/StaffShareDialog";
import { buildStaffShareUrl } from "@/shared/utils/share-links.util";

const generate = vi.fn();
const revoke = vi.fn();
const copy = vi.fn<(text: string) => Promise<boolean>>(async () => true);
vi.mock("../../hooks/useStaffShare", () => ({
  useGenerateStaffShare: () => ({ mutate: generate, isPending: false }),
  useRevokeStaffShare: () => ({ mutate: revoke, isPending: false }),
}));
vi.mock("@/shared/utils/clipboard", () => ({ copyToClipboard: (text: string) => copy(text) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const link = { token: "tok-123", expiresAt: "2026-12-16T05:59:00.000Z", isExpired: false };

const renderDialog = (props: Partial<Parameters<typeof StaffShareDialog>[0]> = {}) =>
  render(
    <StaffShareDialog
      tourId="t1"
      tourTitle="Huasteca"
      staffShare={null}
      canManage
      open
      onOpenChange={() => {}}
      {...props}
    />,
  );

beforeEach(() => vi.clearAllMocks());

describe("buildStaffShareUrl", () => {
  it("arma /s/<token> con el origen actual", () => {
    expect(buildStaffShareUrl("abc")).toBe(`${window.location.origin}/s/abc`);
  });
});

describe("StaffShareDialog", () => {
  it("sin enlace explica qué ve el staff y genera", async () => {
    const user = userEvent.setup();
    renderDialog();
    expect(screen.getByText(/Sin montos ni teléfonos/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Generar enlace/ }));
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("con enlace muestra URL y vigencia, copia y arma WhatsApp sin teléfono", async () => {
    const user = userEvent.setup();
    renderDialog({ staffShare: link });
    const url = buildStaffShareUrl("tok-123");

    expect(screen.getByLabelText("Enlace para staff")).toHaveValue(url);
    expect(screen.getByText(/Vigente hasta 15 de diciembre de 2026/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Copiar/ }));
    expect(copy).toHaveBeenCalledWith(url);

    const wa = screen.getByRole("link", { name: /Enviar por WhatsApp/ });
    expect(wa.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/\?text=/);
    expect(decodeURIComponent(wa.getAttribute("href") ?? "")).toContain(url);
    expect(screen.getByRole("link", { name: /Abrir/ })).toHaveAttribute("href", url);
  });

  it("regenerar y desactivar piden confirmación", async () => {
    const user = userEvent.setup();
    renderDialog({ staffShare: link });

    await user.click(screen.getByRole("button", { name: /Regenerar enlace/ }));
    expect(screen.getByText(/El enlace anterior dejará de funcionar/)).toBeInTheDocument();
    expect(generate).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Regenerar" }));
    expect(generate).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: /Desactivar enlace/ }));
    expect(revoke).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Desactivar" }));
    expect(revoke).toHaveBeenCalledTimes(1);
  });

  it("vencido se indica; en Solo Lectura solo se copia (sin regenerar ni desactivar)", () => {
    renderDialog({ staffShare: { ...link, isExpired: true }, canManage: false });
    expect(screen.getByText(/Vencido/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Copiar/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Regenerar enlace/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Desactivar enlace/ })).not.toBeInTheDocument();
  });
});
