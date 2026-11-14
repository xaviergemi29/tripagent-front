import { afterEach, describe, expect, it, vi } from "vitest";
import { copyToClipboard } from "../clipboard";

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("copyToClipboard (respaldo sin HTTPS)", () => {
  it("dentro de un diálogo inserta el textarea en el diálogo y devuelve el foco", async () => {
    // jsdom no es un contexto seguro (como HTTP por IP local): se usa execCommand.
    document.body.innerHTML = `<div role="alertdialog"><button id="copy">Copiar</button></div>`;
    const dialog = document.querySelector<HTMLElement>('[role="alertdialog"]')!;
    const button = document.getElementById("copy")!;
    button.focus();

    let copied: { text: string; insideDialog: boolean } | null = null;
    document.execCommand = vi.fn(() => {
      const area = document.activeElement as HTMLTextAreaElement;
      copied = { text: area.value, insideDialog: dialog.contains(area) };
      return true;
    });

    await expect(copyToClipboard("http://localhost:3000/register?token=abc")).resolves.toBe(true);
    expect(copied).toEqual({
      text: "http://localhost:3000/register?token=abc",
      insideDialog: true,
    });
    expect(dialog.querySelector("textarea")).toBeNull();
    expect(document.activeElement).toBe(button);
  });
});
