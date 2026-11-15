import { describe, expect, it } from "vitest";
import { bookingFormSchema, companionSchema, mainClientSchema } from "../booking.schema";

// Formulario del Magic Link: replica `createBookingBodySchema` de la API (regla 3: WhatsApp y
// correo obligatorios solo para adultos; teléfonos de 10 dígitos).

const titular = {
  fullName: "Ana Torres",
  whatsappPhone: "2281234567",
  email: "ana@correo.mx",
  emergencyContactName: "Luis Torres",
  emergencyContactPhone: "2281112222",
  medicalNotes: "",
  birthDate: "",
  boardingPoint: "Plaza Xalapeña (06:00)",
};

const companion = {
  fullName: "Eva Torres",
  whatsappPhone: "",
  email: "",
  emergencyContactName: "Ana Torres",
  emergencyContactPhone: "2281234567",
  medicalNotes: "",
  birthDate: "",
  boardingPoint: "Plaza Xalapeña (06:00)",
  passengerType: "CHILD" as const,
};

const messagesAt = (result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }, path: string) =>
  result.success ? [] : result.error!.issues.filter((i) => i.path.join(".") === path).map((i) => i.message);

describe("mainClientSchema (titular)", () => {
  it("acepta un titular válido y la fecha vacía", () => {
    expect(mainClientSchema.safeParse(titular).success).toBe(true);
    expect(mainClientSchema.safeParse({ ...titular, birthDate: "1990-05-29" }).success).toBe(true);
  });

  it("exige WhatsApp de 10 dígitos (acepta +), correo válido y punto de abordaje", () => {
    expect(mainClientSchema.safeParse({ ...titular, whatsappPhone: "+2281234567" }).success).toBe(true);
    expect(messagesAt(mainClientSchema.safeParse({ ...titular, whatsappPhone: "228123" }), "whatsappPhone")).toHaveLength(1);
    expect(messagesAt(mainClientSchema.safeParse({ ...titular, email: "ana@" }), "email")).toContain(
      "Correo electrónico inválido",
    );
    expect(messagesAt(mainClientSchema.safeParse({ ...titular, boardingPoint: "" }), "boardingPoint")).toContain(
      "Debes seleccionar en qué punto subirás al autobús",
    );
  });

  it("el contacto de emergencia no puede ser el mismo WhatsApp del titular", () => {
    const result = mainClientSchema.safeParse({ ...titular, emergencyContactPhone: "2281234567" });
    expect(messagesAt(result, "emergencyContactPhone")).toContain(
      "El contacto de emergencia debe ser un número distinto al tuyo",
    );
  });

  it("la fecha de nacimiento debe ser YYYY-MM-DD", () => {
    expect(mainClientSchema.safeParse({ ...titular, birthDate: "29/05/1990" }).success).toBe(false);
  });
});

describe("companionSchema (acompañante)", () => {
  it("un menor no necesita WhatsApp ni correo", () => {
    expect(companionSchema.safeParse(companion).success).toBe(true);
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

    const child = { ...companion, whatsappPhone: "2285556666", emergencyContactPhone: "2285556666" };
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
    companionMethod: "MANUAL" as const,
    companions: [companion],
    privacyNoticeAccepted: true,
  };

  it("acepta el grupo con la casilla de políticas marcada", () => {
    expect(bookingFormSchema.safeParse(base).success).toBe(true);
  });

  it("rechaza el registro sin aceptar las políticas y el aviso de privacidad", () => {
    expect(messagesAt(bookingFormSchema.safeParse({ ...base, privacyNoticeAccepted: false }), "privacyNoticeAccepted")).toContain(
      "Es necesario aceptar las políticas y el aviso de privacidad para completar tu registro.",
    );
  });

  it("propaga los errores de cada acompañante con su índice", () => {
    const result = bookingFormSchema.safeParse({
      ...base,
      companions: [companion, { ...companion, fullName: "Ed" }],
    });
    expect(messagesAt(result, "companions.1.fullName")).toContain("El nombre completo es obligatorio");
  });
});
