import { describe, expect, it } from "vitest";
import {
  bookingFormSchema,
  companionSchema,
  mainClientSchema,
  toPublicRegisterInput,
} from "../booking.schema";

// Formulario del Magic Link: replica `createBookingBodySchema` de la API (regla 3: WhatsApp y
// correo obligatorios solo para adultos). Teléfonos internacionales: número nacional + país.

const titular = {
  fullName: "Ana Torres",
  whatsappPhone: "2281234567",
  whatsappCountry: "MX" as const,
  email: "ana@correo.mx",
  emergencyContactName: "Luis Torres",
  emergencyContactPhone: "2281112222",
  emergencyContactCountry: "MX" as const,
  birthDate: "1990-05-29",
  boardingPoint: "Plaza Xalapeña (06:00)",
};

const companion = {
  fullName: "Eva Torres",
  whatsappPhone: "",
  whatsappCountry: "MX" as const,
  email: "",
  emergencyContactName: "Ana Torres",
  emergencyContactPhone: "2281234567",
  emergencyContactCountry: "MX" as const,
  birthDate: "2015-03-10",
  boardingPoint: "Plaza Xalapeña (06:00)",
  passengerType: "CHILD" as const,
};

const messagesAt = (
  result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } },
  path: string,
) =>
  result.success
    ? []
    : result.error!.issues.filter((i) => i.path.join(".") === path).map((i) => i.message);

describe("mainClientSchema (titular)", () => {
  it("acepta un titular válido", () => {
    expect(mainClientSchema.safeParse(titular).success).toBe(true);
  });

  it("la fecha de nacimiento es obligatoria y no puede ser futura (2026-11-17)", () => {
    expect(
      messagesAt(mainClientSchema.safeParse({ ...titular, birthDate: "" }), "birthDate"),
    ).toContain("La fecha de nacimiento es obligatoria");
    expect(
      messagesAt(companionSchema.safeParse({ ...companion, birthDate: "" }), "birthDate"),
    ).toContain("La fecha de nacimiento es obligatoria");
    const tomorrow = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
    expect(
      messagesAt(mainClientSchema.safeParse({ ...titular, birthDate: tomorrow }), "birthDate"),
    ).toContain("La fecha de nacimiento no puede ser futura");
  });

  it("exige un WhatsApp válido para su país (acepta el número completo con +), correo y punto", () => {
    expect(mainClientSchema.safeParse({ ...titular, whatsappPhone: "+522281234567" }).success).toBe(
      true,
    );
    expect(
      mainClientSchema.safeParse({ ...titular, whatsappPhone: "6045551234", whatsappCountry: "CA" })
        .success,
    ).toBe(true);
    expect(
      messagesAt(
        mainClientSchema.safeParse({ ...titular, whatsappPhone: "228123" }),
        "whatsappPhone",
      ),
    ).toHaveLength(1);
    expect(
      messagesAt(mainClientSchema.safeParse({ ...titular, email: "ana@" }), "email"),
    ).toContain("Correo electrónico inválido");
    expect(
      messagesAt(mainClientSchema.safeParse({ ...titular, boardingPoint: "" }), "boardingPoint"),
    ).toContain("Debes seleccionar en qué punto subirás al autobús");
  });

  it("el contacto de emergencia no puede ser el mismo WhatsApp del titular", () => {
    const result = mainClientSchema.safeParse({ ...titular, emergencyContactPhone: "2281234567" });
    expect(messagesAt(result, "emergencyContactPhone")).toContain(
      "El contacto de emergencia debe ser un número distinto al tuyo",
    );
    // Mismos dígitos en otro país = otro número.
    expect(
      mainClientSchema.safeParse({
        ...titular,
        emergencyContactPhone: "2125551234",
        emergencyContactCountry: "US",
        whatsappPhone: "2125551234",
      }).success,
    ).toBe(true);
  });

  it("la fecha de nacimiento debe ser YYYY-MM-DD", () => {
    expect(mainClientSchema.safeParse({ ...titular, birthDate: "29/05/1990" }).success).toBe(false);
  });
});

describe("companionSchema (acompañante)", () => {
  it("un menor no necesita WhatsApp ni correo", () => {
    expect(companionSchema.safeParse(companion).success).toBe(true);
  });

  it("un adulto exige WhatsApp (igual que la API)", () => {
    const adult = { ...companion, passengerType: "ADULT" as const, email: "eva@correo.mx" };
    expect(messagesAt(companionSchema.safeParse(adult), "whatsappPhone")).toContain(
      "El WhatsApp es obligatorio para adultos",
    );
  });

  it("un adulto exige correo válido", () => {
    const adult = { ...companion, passengerType: "ADULT" as const, whatsappPhone: "2283334444" };
    expect(messagesAt(companionSchema.safeParse(adult), "email")).toContain(
      "Correo electrónico inválido o faltante",
    );
    expect(companionSchema.safeParse({ ...adult, email: "eva@correo.mx" }).success).toBe(true);
  });

  it("el contacto de emergencia debe ser distinto a su propio WhatsApp", () => {
    const adult = {
      ...companion,
      passengerType: "ADULT" as const,
      email: "eva@correo.mx",
      whatsappPhone: "2283334444",
      emergencyContactPhone: "2283334444",
    };
    expect(messagesAt(companionSchema.safeParse(adult), "emergencyContactPhone")).toContain(
      "El contacto de emergencia debe ser distinto al WhatsApp del acompañante",
    );

    const child = {
      ...companion,
      whatsappPhone: "2285556666",
      emergencyContactPhone: "2285556666",
    };
    expect(messagesAt(companionSchema.safeParse(child), "emergencyContactPhone")).toContain(
      "El contacto de emergencia debe ser distinto al WhatsApp del menor",
    );
  });
});

describe("bookingFormSchema (formulario completo)", () => {
  const base = {
    token: "tok",
    mainClient: titular,
    hasCompanions: true,
    companions: [companion],
    privacyNoticeAccepted: true,
  };

  it("acepta el grupo con la casilla de políticas marcada", () => {
    expect(bookingFormSchema.safeParse(base).success).toBe(true);
  });

  it("rechaza el registro sin aceptar las políticas y el aviso de privacidad", () => {
    expect(
      messagesAt(
        bookingFormSchema.safeParse({ ...base, privacyNoticeAccepted: false }),
        "privacyNoticeAccepted",
      ),
    ).toContain(
      "Para completar tu registro marca la casilla de declaración y aceptación del aviso de privacidad.",
    );
  });

  it("propaga los errores de cada acompañante con su índice", () => {
    const result = bookingFormSchema.safeParse({
      ...base,
      companions: [companion, { ...companion, fullName: "Ed" }],
    });
    expect(messagesAt(result, "companions.1.fullName")).toContain(
      "El nombre completo es obligatorio",
    );
  });
});

describe("toPublicRegisterInput (cuerpo del registro)", () => {
  it("envía cada teléfono en E.164 con su país y deja vacío el WhatsApp opcional", () => {
    const body = toPublicRegisterInput({
      token: "tok",
      mainClient: { ...titular, whatsappPhone: "228 123 4567" },
      hasCompanions: true,
      companions: [
        { ...companion, emergencyContactPhone: "612345678", emergencyContactCountry: "ES" },
      ],
      privacyNoticeAccepted: true,
    });
    expect(body.mainClient.whatsappPhone).toBe("+522281234567");
    expect(body.mainClient.whatsappCountry).toBe("MX");
    expect(body.mainClient.emergencyContactPhone).toBe("+522281112222");
    expect(body.companions[0]?.whatsappPhone).toBe("");
    expect(body.companions[0]?.emergencyContactPhone).toBe("+34612345678");
  });
});
