import { describe, expect, it } from "vitest";
import { editTravelerSchema, travelerHistoryItemSchema, travelerSchema } from "../traveler.schema";

// Regla 3 de ../CLAUDE.md: WhatsApp y correo solo son obligatorios para adultos. Teléfonos
// internacionales: número nacional + país (válido para ese país).

const pathsOf = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  result.success ? [] : result.error!.issues.map((i) => i.path.join("."));

describe("editTravelerSchema (drawer de edición del viajero)", () => {
  const adult = {
    passengerType: "ADULT" as const,
    fullName: "Ana Torres",
    birthDate: "1990-05-29",
    whatsappPhone: "2281234567",
    whatsappCountry: "MX" as const,
    email: "ana@correo.mx",
    emergencyContactName: "Luis Torres",
    emergencyContactPhone: "2281112222",
    emergencyContactCountry: "MX" as const,
  };

  it("acepta un adulto completo", () => {
    expect(editTravelerSchema.safeParse(adult).success).toBe(true);
  });

  it("un adulto exige un WhatsApp válido para su país y correo válido", () => {
    expect(pathsOf(editTravelerSchema.safeParse({ ...adult, whatsappPhone: "" }))).toContain(
      "whatsappPhone",
    );
    expect(
      pathsOf(editTravelerSchema.safeParse({ ...adult, whatsappPhone: "22812345" })),
    ).toContain("whatsappPhone");
    expect(pathsOf(editTravelerSchema.safeParse({ ...adult, email: "ana@correo" }))).toContain(
      "email",
    );
    expect(
      editTravelerSchema.safeParse({ ...adult, whatsappPhone: "612345678", whatsappCountry: "ES" })
        .success,
    ).toBe(true);
  });

  it("un menor puede no tener WhatsApp ni correo, pero si captura teléfono debe ser válido", () => {
    const child = { ...adult, passengerType: "CHILD" as const, whatsappPhone: "", email: "" };
    expect(editTravelerSchema.safeParse(child).success).toBe(true);
    expect(pathsOf(editTravelerSchema.safeParse({ ...child, whatsappPhone: "123" }))).toContain(
      "whatsappPhone",
    );
  });

  it("la fecha de nacimiento y el contacto de emergencia son obligatorios", () => {
    expect(pathsOf(editTravelerSchema.safeParse({ ...adult, birthDate: "" }))).toContain(
      "birthDate",
    );
    expect(
      pathsOf(editTravelerSchema.safeParse({ ...adult, emergencyContactPhone: "" })),
    ).toContain("emergencyContactPhone");
    expect(
      pathsOf(editTravelerSchema.safeParse({ ...adult, emergencyContactPhone: "228-111" })),
    ).toContain("emergencyContactPhone");
  });
});

describe("travelerSchema", () => {
  const base = {
    fullName: "  Ana Torres  ",
    whatsappPhone: "2281234567",
    email: "ana@correo.mx",
    emergencyContactName: "Luis Torres",
    emergencyContactPhone: "2281112222",
    birthDate: "",
  };

  it("recorta textos y pone customFields por defecto", () => {
    expect(travelerSchema.parse(base)).toMatchObject({ fullName: "Ana Torres", customFields: {} });
  });

  it("acepta teléfonos en E.164 o los 10 dígitos anteriores y valida la fecha", () => {
    expect(travelerSchema.safeParse({ ...base, whatsappPhone: "+522281234567" }).success).toBe(
      true,
    );
    expect(pathsOf(travelerSchema.safeParse({ ...base, whatsappPhone: "228-123" }))).toContain(
      "whatsappPhone",
    );
    expect(pathsOf(travelerSchema.safeParse({ ...base, birthDate: "29/05/1990" }))).toContain(
      "birthDate",
    );
  });
});

describe("travelerHistoryItemSchema (historial y LTV)", () => {
  it("acepta el LTV por divisa sin mezclar monedas", () => {
    const item = {
      metrics: {
        totalTrips: 2,
        lifetimeValue: 7500,
        lifetimeValueByCurrency: { MXN: 6000, USD: 1500 },
        isHabitualCompanion: false,
      },
      isCancelled: false,
      id: "92779764-2131-4c4b-8153-398fbd74bfad",
      isTitular: true,
      passengerStatus: "ACTIVE",
      bookingStatus: "CONFIRMED",
      amountPaid: 1500,
      currency: "USD",
      tourTitle: "Disney Orlando",
      departureDateTime: "2026-12-20",
      temporalStatus: "PRÓXIMO",
    };
    expect(travelerHistoryItemSchema.safeParse(item).success).toBe(true);
    expect(
      pathsOf(
        travelerHistoryItemSchema.safeParse({
          ...item,
          metrics: { ...item.metrics, lifetimeValueByCurrency: { EUR: 10 } },
        }),
      ),
    ).toContain("metrics.lifetimeValueByCurrency");
  });
});
