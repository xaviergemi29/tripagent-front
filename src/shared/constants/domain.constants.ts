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

/** Estado del formulario de registro de un pasajero en el Centro de Control (lo calcula la API). */
export const FORM_STATUSES = ["COMPLETED", "PENDING"] as const;
export type FormStatus = (typeof FORM_STATUSES)[number];

/** Tipo de movimiento del libro de pagos (enum `payment_type` de la API). */
export const PAYMENT_TYPES = ["PAYMENT", "REFUND"] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

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

// Rol del usuario de la agencia (enum `agency_roles` de la API; viaja en `GET /auth/me`).
export const AGENCY_ROLES = ["ADMIN", "SALES", "GUIDE"] as const;
export type AgencyRole = (typeof AGENCY_ROLES)[number];

/**
 * Estado temporal del tour (`temporalStatus` del listado de tours), calculado por la API con la hora
 * de CDMX. "EN CURSO" lleva espacio, no guion bajo. Espejo de `TOUR_TEMPORAL_STATUS` en
 * `tripagent-api/src/shared/constants/domain.constants.ts`.
 */
export const TOUR_TEMPORAL_STATUSES = ["PRÓXIMO", "EN CURSO", "FINALIZADO", "CANCELADO"] as const;
export type TourTemporalStatus = (typeof TOUR_TEMPORAL_STATUSES)[number];

/** Acceso por nombre: `status === TOUR_TEMPORAL_STATUS.IN_PROGRESS`. */
export const TOUR_TEMPORAL_STATUS = {
  UPCOMING: "PRÓXIMO",
  IN_PROGRESS: "EN CURSO",
  FINISHED: "FINALIZADO",
  CANCELLED: "CANCELADO",
} as const satisfies Record<string, TourTemporalStatus>;

/**
 * Máximo de caracteres de un bloque de políticas (agencia o tour) que se imprime en el estado de
 * cuenta PDF. Espejo de `POLICIES_MAX_LENGTH` en `tripagent-api/src/shared/schemas/policies.schema.ts`.
 */
export const POLICIES_MAX_LENGTH = 5000;

/**
 * Motivo de cancelación de un tour por la agencia (decisión del PM, 2026-11-14): lista fija. Espejo
 * de `TOUR_CANCELLATION_REASONS` en `tripagent-api/src/shared/constants/domain.constants.ts`. Las
 * etiquetas viven en `TOUR_CANCELLATION_REASON_DICT`.
 */
export const TOUR_CANCELLATION_REASONS = ["WEATHER", "SECURITY", "LOW_SALES", "OTHER"] as const;
export type TourCancellationReason = (typeof TOUR_CANCELLATION_REASONS)[number];

/** Máximo de la nota interna de cancelación (espejo de la API). */
export const TOUR_CANCELLATION_NOTE_MAX_LENGTH = 200;

/** Estado de la devolución de una reserva cancelada (`summarizeRefunds` de la API). */
export const REFUND_STATUSES = ["NONE", "PENDING", "COMPLETED"] as const;
export type RefundStatus = (typeof REFUND_STATUSES)[number];
