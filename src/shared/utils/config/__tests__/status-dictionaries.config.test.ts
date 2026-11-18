import { describe, expect, it } from "vitest";
import {
  PAYMENT_STATUSES,
  PASSENGER_ROLES,
  PAYMENT_METHODS,
  TOUR_CANCELLATION_REASONS,
} from "@/shared/constants/domain.constants";
import {
  getPaymentMethodText,
  PASSENGER_ROLE_DICT,
  PAYMENT_METHOD_DICT,
  PAYMENT_METHOD_LABEL_DICT,
  PAYMENT_STATUS_DICT,
  TOUR_CANCELLATION_REASON_DICT,
} from "../status-dictionaries.config";

// Si se agrega un valor a un enum de dominio, estas pruebas obligan a darle su etiqueta.
describe("Diccionarios de etiquetas", () => {
  it("todo método de pago tiene etiqueta corta (operador) y texto para el cliente", () => {
    for (const method of PAYMENT_METHODS) {
      expect(PAYMENT_METHOD_DICT[method]).toBeTruthy();
      expect(PAYMENT_METHOD_LABEL_DICT[method]).toBeTruthy();
    }
  });

  it("todo rol y motivo de cancelación tiene etiqueta", () => {
    for (const role of PASSENGER_ROLES) expect(PASSENGER_ROLE_DICT[role]).toBeTruthy();
    for (const reason of TOUR_CANCELLATION_REASONS) {
      expect(TOUR_CANCELLATION_REASON_DICT[reason]).toBeTruthy();
    }
  });

  it("los estados de pago reales de la API tienen etiqueta y estilo", () => {
    for (const status of PAYMENT_STATUSES) {
      expect(PAYMENT_STATUS_DICT[status]).toEqual({
        label: expect.any(String),
        style: expect.stringMatching(/bg-/),
      });
    }
  });

  it("getPaymentMethodText tolera minúsculas, valores desconocidos y vacíos", () => {
    expect(getPaymentMethodText("transfer")).toBe("Transferencia");
    expect(getPaymentMethodText("CASH")).toBe("Efectivo");
    expect(getPaymentMethodText("CRYPTO")).toBe("CRYPTO");
    expect(getPaymentMethodText(null)).toBe("Pago");
  });
});
