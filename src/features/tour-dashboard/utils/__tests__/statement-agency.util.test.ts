import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AgencyOutput } from "@/features/settings/schemas/agency.schema";
import { buildOperatorStatementAgency } from "../statement-agency.util";

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3001/api"));
afterEach(() => vi.unstubAllEnvs());

const agency = {
  name: "Viajes Xalapa",
  email: "hola@viajesxalapa.mx",
  phone: "2281234567",
  bankAccounts: [
    {
      id: "b1",
      position: 1,
      bankName: "BBVA",
      accountHolder: "Viajes Xalapa SA",
      clabeNumber: "012180001234567891",
      cardNumber: "4152313412345678",
    },
    {
      id: "b2",
      position: 3,
      bankName: "",
      accountHolder: "",
      clabeNumber: "014180655012345678",
      cardNumber: null,
    },
  ],
  policies: "Anticipo no reembolsable.",
} as unknown as AgencyOutput;

describe("buildOperatorStatementAgency (PDF del Centro de Control)", () => {
  it("arma marca, contacto, todas las cuentas en orden sin tarjeta y políticas", () => {
    const result = buildOperatorStatementAgency(agency, {
      logoPath: "/uploads/logos/agency-1.png",
      primaryColor: "#059669",
      secondaryColor: "#047857",
      accentColor: null,
    });
    expect(result).toEqual({
      name: "Viajes Xalapa",
      email: "hola@viajesxalapa.mx",
      whatsapp: "2281234567",
      logoUrl: "http://localhost:3001/public/uploads/logos/agency-1.png",
      primaryColor: "#059669",
      secondaryColor: "#047857",
      accentColor: null,
      bankAccounts: [
        { bankName: "BBVA", accountHolder: "Viajes Xalapa SA", clabe: "012180001234567891" },
        { bankName: "", accountHolder: "", clabe: "014180655012345678" },
      ],
      policies: "Anticipo no reembolsable.",
    });
  });

  it("mientras cargan los datos devuelve valores vacíos seguros", () => {
    expect(buildOperatorStatementAgency(undefined, undefined)).toEqual({
      name: "",
      email: "",
      whatsapp: "",
      logoUrl: null,
      primaryColor: null,
      secondaryColor: null,
      accentColor: null,
      bankAccounts: [],
      policies: null,
    });
  });

  it("sin cuentas no hay bloque bancario", () => {
    const result = buildOperatorStatementAgency({ ...agency, bankAccounts: [] }, undefined);
    expect(result.bankAccounts).toEqual([]);
  });
});
