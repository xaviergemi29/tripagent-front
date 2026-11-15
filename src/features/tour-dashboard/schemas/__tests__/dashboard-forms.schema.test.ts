import { describe, expect, it } from "vitest";
import { PASSENGER_ROLE } from "@/shared/constants/domain.constants";
import { paymentFormSchema, voidPaymentInputSchema } from "../payment.schema";
import { quickBookingSchema } from "../quick-booking.schema";
import {
  transferPassengerSchema,
  type TransferPassengerFormInput,
} from "../transfer-passenger.schema";

// Formularios del Centro de Control. Replican las reglas de la API (transferencia: regla 14).

const pathsOf = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  result.success ? [] : result.error!.issues.map((i) => i.path.join("."));

describe("transferPassengerSchema", () => {
  const adult: TransferPassengerFormInput = {
    role: PASSENGER_ROLE.COMPANION,
    isMinor: false,
    fullName: "Carlos Pérez",
    whatsapp: "2281234567",
    email: "carlos@correo.mx",
    inheritTitularBoardingPoint: true,
    medicalNotes: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  };

  it("acepta un adulto con WhatsApp y correo", () => {
    expect(transferPassengerSchema.safeParse(adult).success).toBe(true);
  });

  it("un adulto exige WhatsApp y correo", () => {
    expect(pathsOf(transferPassengerSchema.safeParse({ ...adult, whatsapp: "", email: "" }))).toEqual(
      expect.arrayContaining(["whatsapp", "email"]),
    );
  });

  it("un menor (acompañante) no necesita WhatsApp ni correo", () => {
    expect(
      transferPassengerSchema.safeParse({ ...adult, isMinor: true, whatsapp: "", email: "" }).success,
    ).toBe(true);
  });

  it("el titular nunca puede ser menor (es el responsable financiero)", () => {
    const result = transferPassengerSchema.safeParse({
      ...adult,
      role: PASSENGER_ROLE.TITULAR,
      isMinor: true,
    });
    expect(pathsOf(result)).toContain("isMinor");
  });

  it("los teléfonos capturados deben tener 10 dígitos", () => {
    expect(pathsOf(transferPassengerSchema.safeParse({ ...adult, whatsapp: "228123" }))).toContain(
      "whatsapp",
    );
    expect(
      pathsOf(transferPassengerSchema.safeParse({ ...adult, emergencyContactPhone: "12345" })),
    ).toContain("emergencyContactPhone");
  });

  it("recorta espacios antes de validar", () => {
    expect(transferPassengerSchema.parse({ ...adult, fullName: "  Carlos Pérez  " }).fullName).toBe(
      "Carlos Pérez",
    );
    expect(pathsOf(transferPassengerSchema.safeParse({ ...adult, fullName: "  Al " }))).toContain(
      "fullName",
    );
  });
});

describe("paymentFormSchema", () => {
  it("el monto debe ser mayor a $0 y el método válido", () => {
    expect(
      paymentFormSchema.safeParse({ amount: 500, method: "TRANSFER", type: "PAYMENT" }).success,
    ).toBe(true);
    expect(pathsOf(paymentFormSchema.safeParse({ amount: 0, method: "TRANSFER", type: "PAYMENT" }))).toContain(
      "amount",
    );
    expect(pathsOf(paymentFormSchema.safeParse({ amount: 100, method: "CRYPTO", type: "PAYMENT" }))).toContain(
      "method",
    );
  });

  it("un reembolso también se captura en positivo (la API lo guarda negativo)", () => {
    expect(paymentFormSchema.safeParse({ amount: 300, method: "TRANSFER", type: "REFUND" }).success).toBe(
      true,
    );
    expect(pathsOf(paymentFormSchema.safeParse({ amount: -300, method: "TRANSFER", type: "REFUND" }))).toContain(
      "amount",
    );
  });
});

describe("voidPaymentInputSchema", () => {
  it("la anulación exige una razón detallada (5+ caracteres)", () => {
    const base = {
      bookingId: "92779764-2131-4c4b-8153-398fbd74bfad",
      paymentId: "a1a1a1a1-0000-4000-8000-000000000001",
    };
    expect(voidPaymentInputSchema.safeParse({ ...base, data: { reason: "Error" } }).success).toBe(
      true,
    );
    expect(pathsOf(voidPaymentInputSchema.safeParse({ ...base, data: { reason: "x" } }))).toContain(
      "data.reason",
    );
  });
});

describe("quickBookingSchema (apartado rápido)", () => {
  const valid = {
    fullName: "Ana Torres",
    whatsapp: "2281234567",
    email: "ana@correo.mx",
    numberPassengers: 2,
  };

  it("acepta un apartado válido", () => {
    expect(quickBookingSchema.safeParse(valid).success).toBe(true);
  });

  it("exige al menos 1 lugar, WhatsApp de 10 dígitos y correo válido", () => {
    expect(pathsOf(quickBookingSchema.safeParse({ ...valid, numberPassengers: 0 }))).toContain(
      "numberPassengers",
    );
    expect(pathsOf(quickBookingSchema.safeParse({ ...valid, whatsapp: "22812" }))).toContain(
      "whatsapp",
    );
    expect(pathsOf(quickBookingSchema.safeParse({ ...valid, email: "ana" }))).toContain("email");
  });
});
