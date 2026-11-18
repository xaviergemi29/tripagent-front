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

/** Acceso por nombre: `currency === CURRENCY.USD`. */
export const CURRENCY = {
  MXN: "MXN",
  USD: "USD",
} as const satisfies Record<string, Currency>;

/** Moneda que se asume cuando un tour o pago no especifica una. */
export const DEFAULT_CURRENCY: Currency = CURRENCY.MXN;

// Métodos de pago (enum `payment_method` de la API)
export const PAYMENT_METHODS = ["CASH", "TRANSFER", "CARD", "OTHER"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Acceso por nombre: `method === PAYMENT_METHOD.CASH`. */
export const PAYMENT_METHOD = {
  CASH: "CASH",
  TRANSFER: "TRANSFER",
  CARD: "CARD",
  OTHER: "OTHER",
} as const satisfies Record<string, PaymentMethod>;

/** Estado del formulario de registro de un pasajero en el Centro de Control (lo calcula la API). */
export const FORM_STATUSES = ["COMPLETED", "PENDING"] as const;
export type FormStatus = (typeof FORM_STATUSES)[number];

/** Acceso por nombre: `formStatus === FORM_STATUS.COMPLETED`. */
export const FORM_STATUS = {
  COMPLETED: "COMPLETED",
  PENDING: "PENDING",
} as const satisfies Record<string, FormStatus>;

/** Tipo de movimiento del libro de pagos (enum `payment_type` de la API). */
export const PAYMENT_TYPES = ["PAYMENT", "REFUND"] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

/** Acceso por nombre: `payment.type === PAYMENT_TYPE.REFUND`. */
export const PAYMENT_TYPE = {
  PAYMENT: "PAYMENT",
  REFUND: "REFUND",
} as const satisfies Record<string, PaymentType>;

/**
 * Estado de pago de una reserva (enum `payment_status` de la API). `paymentStatusSchema` del
 * dashboard usa estos mismos valores (OBS-017, alineado el 2026-11-17).
 */
export const PAYMENT_STATUSES = ["PENDING", "PARTIAL", "PAID", "REFUNDED"] as const;
export type BookingPaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Acceso por nombre: `paymentStatus === PAYMENT_STATUS.PAID`. */
export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  PARTIAL: "PARTIAL",
  PAID: "PAID",
  REFUNDED: "REFUNDED",
} as const satisfies Record<string, BookingPaymentStatus>;

// Tipo de pasajero (enum `passenger_type` de la API).
export const PASSENGER_TYPES = ["ADULT", "CHILD"] as const;
export type PassengerType = (typeof PASSENGER_TYPES)[number];

/** Acceso por nombre: `passengerType === PASSENGER_TYPE.CHILD`. */
export const PASSENGER_TYPE = {
  ADULT: "ADULT",
  CHILD: "CHILD",
} as const satisfies Record<string, PassengerType>;

// Estado de un pasajero dentro de la reserva (enum `passenger_status` de la API)
export const PASSENGER_STATUSES = ["ACTIVE", "CANCELLED"] as const;
export type PassengerStatus = (typeof PASSENGER_STATUSES)[number];

/** Acceso por nombre: `status === PASSENGER_STATUS.CANCELLED`. */
export const PASSENGER_STATUS = {
  ACTIVE: "ACTIVE",
  CANCELLED: "CANCELLED",
} as const satisfies Record<string, PassengerStatus>;

// Estado de una reserva (enum `booking_status` de la API, `tripagent-api/src/db/schema.ts`).
export const BOOKING_STATUSES = [
  "AWAITING_REGISTRATION",
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "NO_SHOW",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Acceso por nombre: `status === BOOKING_STATUS.CANCELLED`. */
export const BOOKING_STATUS = {
  AWAITING_REGISTRATION: "AWAITING_REGISTRATION",
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
} as const satisfies Record<string, BookingStatus>;

// Tipo de destino del tour (`tours.destinationType`). Lo usan tours (formulario, filtros) y
// viajeros (historial); antes vivía en `features/tours/schemas/tour.schema.ts`.
export const DESTINATION_TYPES = ["NATIONAL", "INTERNATIONAL"] as const;
export type DestinationType = (typeof DESTINATION_TYPES)[number];

/** Acceso por nombre: `type === DESTINATION_TYPE.INTERNATIONAL`. */
export const DESTINATION_TYPE = {
  NATIONAL: "NATIONAL",
  INTERNATIONAL: "INTERNATIONAL",
} as const satisfies Record<string, DestinationType>;

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

// Estado de la suscripción de la agencia (enum `subscription_status` de la API).
export const SUBSCRIPTION_STATUSES = ["trialing", "active", "past_due", "canceled"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/** Acceso por nombre: `status === SUBSCRIPTION_STATUS.TRIALING`. */
export const SUBSCRIPTION_STATUS = {
  TRIALING: "trialing",
  ACTIVE: "active",
  PAST_DUE: "past_due",
  CANCELED: "canceled",
} as const satisfies Record<string, SubscriptionStatus>;

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

/** Acceso por nombre: `refundStatus === REFUND_STATUS.PENDING`. */
export const REFUND_STATUS = {
  NONE: "NONE",
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
} as const satisfies Record<string, RefundStatus>;

// Código de un 409 de la API (espejo de `CONFLICT_CODES` en `tripagent-api`): la pantalla decide qué
// mostrar con el código, nunca con el texto del mensaje (folleto "Iniciar Reserva", 2026-11-18).
export const CONFLICT_CODES = ["CAPACITY_EXCEEDED", "BOOKINGS_CLOSED", "ALREADY_BOOKED"] as const;
export type ConflictCode = (typeof CONFLICT_CODES)[number];

/** Acceso por nombre: `error.code === CONFLICT_CODE.CAPACITY_EXCEEDED`. */
export const CONFLICT_CODE = {
  /** No alcanzan los lugares; el error trae `availableSeats`. */
  CAPACITY_EXCEEDED: "CAPACITY_EXCEEDED",
  /** El tour ya no recibe reservas en línea (ya salió o la agencia las pausó). */
  BOOKINGS_CLOSED: "BOOKINGS_CLOSED",
  /** El WhatsApp ya tiene una reserva activa en el tour. */
  ALREADY_BOOKED: "ALREADY_BOOKED",
} as const satisfies Record<string, ConflictCode>;
