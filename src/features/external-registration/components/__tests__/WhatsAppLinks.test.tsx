import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SendReceiptCard } from "../booking-success/SendReceiptCard";
import { ReportPaymentCta } from "../partial-payment/ReportPaymentCta";

// Los enlaces wa.me del Magic Link llevan la lada 52: con el teléfono de 10 dígitos solo,
// WhatsApp lo leía como +228 (Togo) y el comprobante no llegaba a la agencia (2026-11-16).

describe("WhatsApp del Magic Link hacia la agencia", () => {
  it("Enviar comprobante (instrucciones de pago)", () => {
    render(<SendReceiptCard agencyPhone="2281234567" whatsappText="Comprobante" />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("https://wa.me/522281234567?text=Comprobante");
  });

  it("Enviar comprobante por WhatsApp (estado de cuenta)", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    render(
      <ReportPaymentCta
        agencyName="Viajes Xalapa"
        agencyPhone="228 123 4567"
        tourTitle="Zacatlán"
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Enviar comprobante/ }));
    expect(open.mock.calls[0][0]).toMatch(/^https:\/\/wa\.me\/522281234567\?text=/);
    open.mockRestore();
  });
});
