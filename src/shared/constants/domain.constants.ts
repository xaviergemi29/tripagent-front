/**
 * Enums de dominio compartidos por todo el frontend.
 *
 * Fuente de verdad: `tripagent-api/src/db/schema.ts`. Si el backend agrega o renombra
 * un valor, actualízalo aquí y todos los schemas Zod y tipos que dependen de estas
 * tuplas quedarán alineados.
 */

// Monedas soportadas (enum `currency` de la API)
export const CURRENCIES = ["MXN", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

/** Moneda que se asume cuando un tour o pago no especifica una. */
export const DEFAULT_CURRENCY: Currency = "MXN";

// Métodos de pago (enum `payment_method` de la API)
export const PAYMENT_METHODS = ["CASH", "TRANSFER", "CARD", "OTHER"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// Estado de un pasajero dentro de la reserva (enum `passenger_status` de la API)
export const PASSENGER_STATUSES = ["ACTIVE", "CANCELLED"] as const;
export type PassengerStatus = (typeof PASSENGER_STATUSES)[number];

// Rol de un pasajero dentro de su reserva. No es un enum de BD (allí es el booleano
// `booking_passengers.isTitular`): es parte del contrato de la API (Centro de Control y
// transferencia). Espejo de `tripagent-api/src/shared/constants/domain.constants.ts`.
export const PASSENGER_ROLES = ["TITULAR", "COMPANION"] as const;
export type PassengerRole = (typeof PASSENGER_ROLES)[number];

/** Acceso por nombre para comparar sin escribir el texto: `role === PASSENGER_ROLE.TITULAR`. */
export const PASSENGER_ROLE = {
  TITULAR: "TITULAR",
  COMPANION: "COMPANION",
} as const satisfies Record<PassengerRole, PassengerRole>;
