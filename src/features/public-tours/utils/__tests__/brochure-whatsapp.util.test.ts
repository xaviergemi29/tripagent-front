import { describe, expect, it } from "vitest";
import {
  buildBrochureWhatsAppMessage,
  buildBrochureWhatsAppUrl,
  getBrochureBookingState,
} from "../brochure-whatsapp.util";

const tour = { tourTitle: "Zacatlán de las manzanas", departureDate: "2026-12-12" };
const availability = { isBookable: true, hasDeparted: false, acceptsOnlineBookings: true };

describe("getBrochureBookingState (misma prioridad que el botón del folleto)", () => {
  it("disponible, agotado, finalizado y en pausa", () => {
    expect(getBrochureBookingState(availability)).toBe("AVAILABLE");
    expect(getBrochureBookingState({ ...availability, isBookable: false })).toBe("SOLD_OUT");
    expect(
      getBrochureBookingState({ ...availability, isBookable: false, acceptsOnlineBookings: false }),
    ).toBe("PAUSED");
    // Un tour que ya salió es "Finalizado" aunque la agencia también esté en pausa.
    expect(
      getBrochureBookingState({
        isBookable: false,
        hasDeparted: true,
        acceptsOnlineBookings: false,
      }),
    ).toBe("FINISHED");
  });

  it("sin `acceptsOnlineBookings` (API anterior) no se considera en pausa", () => {
    expect(getBrochureBookingState({ isBookable: false, hasDeparted: false })).toBe("SOLD_OUT");
  });
});

describe("buildBrochureWhatsAppMessage", () => {
  it.each([
    [
      "AVAILABLE",
      "¡Hola! Vi el folleto del tour *Zacatlán de las manzanas* (sábado, 12 de diciembre) y me interesa reservar. ¿Me pueden ayudar?",
    ],
    [
      "SOLD_OUT",
      "¡Hola! Me interesa el tour *Zacatlán de las manzanas* (sábado, 12 de diciembre), pero vi que ya no hay lugares. ¿Podrían avisarme si se libera algún lugar?",
    ],
    [
      "FINISHED",
      "¡Hola! Vi el folleto del tour *Zacatlán de las manzanas* (sábado, 12 de diciembre), pero esa salida ya pasó. ¿Tienen próximas salidas de este tour?",
    ],
    [
      "PAUSED",
      "¡Hola! Me interesa el tour *Zacatlán de las manzanas* (sábado, 12 de diciembre). ¿Me pueden dar información para reservar?",
    ],
  ] as const)("%s", (state, expected) => {
    expect(buildBrochureWhatsAppMessage({ ...tour, state })).toBe(expected);
  });

  it("sin fecha válida omite el paréntesis", () => {
    expect(
      buildBrochureWhatsAppMessage({
        tourTitle: " Cuetzalan ",
        departureDate: "",
        state: "SOLD_OUT",
      }),
    ).toBe(
      "¡Hola! Me interesa el tour *Cuetzalan*, pero vi que ya no hay lugares. ¿Podrían avisarme si se libera algún lugar?",
    );
  });
});

describe("buildBrochureWhatsAppUrl", () => {
  it("usa la lada del número guardado y codifica el mensaje", () => {
    const url = buildBrochureWhatsAppUrl({
      ...tour,
      state: "SOLD_OUT",
      agencyPhone: "+12125551234",
    });
    expect(url?.startsWith("https://wa.me/12125551234?text=")).toBe(true);
    expect(decodeURIComponent(url!.split("?text=")[1]!)).toContain("se libera algún lugar");
  });

  it("sin teléfono de la agencia → null (no se dibuja el botón)", () => {
    for (const agencyPhone of [null, undefined, ""]) {
      expect(buildBrochureWhatsAppUrl({ ...tour, state: "AVAILABLE", agencyPhone })).toBeNull();
    }
  });
});
