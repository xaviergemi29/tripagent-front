import { z } from "zod";
import {
  layoutMapSchema,
  vehicleCapacityOutputSchema,
} from "@/features/vehicles/schemas/vehicle.schema";
import type { PassengerRole } from "@/shared/constants/domain.constants";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  PASSENGER_ROLE,
  PASSENGER_ROLES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  FORM_STATUSES,
  REFUND_STATUSES,
  TOUR_CANCELLATION_REASONS,
  TOUR_TEMPORAL_STATUS,
  TOUR_TEMPORAL_STATUSES,
} from "@/shared/constants/domain.constants";

export const currencySchema = z.enum(CURRENCIES);
export const formStatusSchema = z.enum(FORM_STATUSES);
// Estado de pago de la reserva: los mismos cuatro valores del enum `payment_status` de la API
// (OBS-017, 2026-11-17; antes declaraba `ADVANCE` y `PENDING_VALIDATION`, que la API nunca envía).
export const paymentStatusSchema = z.enum(PAYMENT_STATUSES);
export const passengerRoleSchema = z.enum(PASSENGER_ROLES);
// Los mismos cuatro estados que el catálogo (regla 9; decisión del PM, 2026-11-14). Antes este
// schema esperaba "ACTIVO", que la API nunca envía.
export const temporalStatusSchema = z.enum(TOUR_TEMPORAL_STATUSES);
export const paymentMethodSchema = z.enum(PAYMENT_METHODS);
export const paymentTypeSchema = z.enum(["PAYMENT", "REFUND"]);

/** Punto de abordaje configurado en el tour, resuelto por la API (regla del manifiesto). */
export const boardingPointDetailsSchema = z
  .object({ location: z.string(), time: z.string() })
  .nullable()
  .optional();

export const paymentRecordSchema = z.object({
  id: z.uuid(),
  amount: z.number(),
  method: paymentMethodSchema,
  type: paymentTypeSchema,
  createdAt: z.iso.datetime(),
  referenceInfo: z.string().nullable().optional(),
  registeredBy: z.string().nullable().optional(),
  amountUSD: z.number().nullable(),
  amountMXN: z.number().nullable(),
  exchangeRate: z.number().nullable().optional(),
});

export const companionSchema = z.object({
  id: z.uuid(),
  bookingId: z.uuid(),
  role: z.literal(PASSENGER_ROLE.COMPANION),
  fullName: z.string(),
  whatsapp: z.string(),

  formStatus: formStatusSchema,
  seatLabel: z.string().nullable(),
  boardingPoint: z.string().nullable(),
  boardingPointDetails: boardingPointDetailsSchema,
});

export const titularSchema = z.object({
  id: z.uuid(),
  bookingId: z.uuid(),
  role: z.literal(PASSENGER_ROLE.TITULAR),
  fullName: z.string(),
  whatsapp: z.string(),
  groupSize: z.number().min(1),
  unitPrice: z.number(),
  bookingStatus: z.enum(["AWAITING_REGISTRATION", "PENDING", "CONFIRMED", "CANCELLED", "NO_SHOW"]),
  requiredDeposit: z.number(),
  hasSeatRight: z.boolean(),
  /** Fecha del apartado (ISO): antigüedad "Apartado hace N h sin pago" (regla 13). */
  bookedAt: z.string(),

  formStatus: formStatusSchema,
  seatLabel: z.string().nullable(),
  boardingPoint: z.string().nullable(),
  boardingPointDetails: boardingPointDetailsSchema,
  magicToken: z.string().nullable(),

  paymentStatus: paymentStatusSchema,
  paidAmount: z.number(),
  balance: z.number(),
  /**
   * Bajas de acompañantes (FLUJO-RES-004, 2026-11-17): retenciones acumuladas en el total y saldo a
   * devolver al titular (abonado − total). Los calcula la API; opcionales por compatibilidad.
   */
  retainedPenaltyTotal: z.number().optional(),
  refundableSurplus: z.number().optional(),
  equivalentMXN: z.number().nullable().optional(),

  payments: z.array(paymentRecordSchema).default([]),
  companions: z.array(companionSchema).default([]),
});

export const tourMetricsSchema = z.object({
  occupancy: z.object({
    max: z.number(),
    current: z.number(),
  }),
  revenue: z.object({
    projected: z.number(),
    collected: z.number(),
  }),
  pendingValidations: z.number(),
  logistics: z.object({
    total: z.number(),
    assigned: z.number(),
    unassigned: z.number(),
  }),
});

// Unidad de la agencia (`GET /vehicles` y `vehicle` del dashboard). `templateId` = plantilla del
// catálogo de la que se creó (null: vehículo anterior al catálogo o creado por API).
export const vehicleOutputSchema = z.object({
  id: z.uuid(),
  templateId: z.uuid().nullable().optional(),
  name: z.string(),
  layoutMap: layoutMapSchema,
  capacity: vehicleCapacityOutputSchema,
});

/**
 * Cancelación del tour por la agencia (decisión del PM, 2026-11-14). `note` es interna: solo la ve
 * el operador. Null = el tour no está cancelado.
 */
export const tourCancellationSchema = z.object({
  cancelledAt: z.string(),
  reason: z.enum(TOUR_CANCELLATION_REASONS),
  note: z.string().nullable(),
});

/**
 * Reserva cancelada con dinero abonado (sección "Reembolsos" del Centro de Control). Los montos los
 * calcula la API (`summarizeRefunds`): el front no recalcula el saldo a reembolsar.
 */
export const refundRowSchema = z.object({
  bookingId: z.uuid(),
  travelerId: z.uuid(),
  fullName: z.string(),
  whatsapp: z.string(),
  groupSize: z.number(),
  /** Lo que el cliente abonó (sin abonos anulados). */
  paidAmount: z.number(),
  /** Penalización retenida ($0 cuando cancela la agencia). */
  retainedAmount: z.number(),
  refundedAmount: z.number(),
  refundableAmount: z.number(),
  refundStatus: z.enum(REFUND_STATUSES),
  payments: z.array(paymentRecordSchema).default([]),
});

/** Enlace de solo lectura para el coordinador (staff) del tour; `null` si no hay uno activo. */
export const staffShareLinkSchema = z.object({
  token: z.string(),
  expiresAt: z.string(),
  isExpired: z.boolean().default(false),
});

export const tourDashboardOutputSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  currency: currencySchema.default(DEFAULT_CURRENCY),
  departureDateTime: z.iso.datetime(),
  /** Fecha de regreso (`YYYY-MM-DD`), nula si el tour no la tiene. */
  returnDate: z.string().nullable().optional(),
  /** Instrucciones Post-Pago (logística) del tour, para el estado de cuenta PDF. */
  postPaymentInstructions: z.string().nullable().optional(),
  temporalStatus: temporalStatusSchema.default(TOUR_TEMPORAL_STATUS.UPCOMING),
  requiresSeats: z.boolean().default(true),
  metrics: tourMetricsSchema,
  vehicle: vehicleOutputSchema.nullable().optional(),
  // Lugares de staff del tour: tope de asientos que se pueden bloquear en el croquis.
  staffCapacity: z.number().default(0),
  travelers: z.array(titularSchema),
  /**
   * Reservas canceladas por el cliente (mismo formato, `bookingStatus: CANCELLED`): filtro
   * "Canceladas" del Centro de Control, solo para consultar y anular abonos mal capturados
   * (2026-11-17). Vacío si la agencia canceló el tour: esas van en `refunds`.
   */
  cancelledTravelers: z.array(titularSchema).default([]),
  cancellation: tourCancellationSchema.nullable().default(null),
  refunds: z.array(refundRowSchema).default([]),
  /** Enlace para staff (`POST /tours/:id/staff-share`); ausente en respuestas anteriores. */
  staffShare: staffShareLinkSchema.nullable().optional(),
});

export type { FormStatus } from "@/shared/constants/domain.constants";
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type PaymentRecordOutput = z.infer<typeof paymentRecordSchema>;
export type CompanionOutput = z.infer<typeof companionSchema>;
export type TitularRowOutput = z.infer<typeof titularSchema>;
export type TourMetrics = z.infer<typeof tourMetricsSchema>;
export type VehicleOutput = z.infer<typeof vehicleOutputSchema>;
export type TourDashboardOutput = z.infer<typeof tourDashboardOutputSchema>;
export type TourCancellationOutput = z.infer<typeof tourCancellationSchema>;
export type StaffShareLinkOutput = z.infer<typeof staffShareLinkSchema>;
export type RefundRowOutput = z.infer<typeof refundRowSchema>;

/**
 * Vista aplanada (titulares + acompañantes) de los pasajeros con derecho a asiento.
 * La arma `TourDashboardView` a partir de `travelers`; no es un contrato de la API.
 */
export interface FlattenedPassenger {
  id: string;
  fullName: string;
  bookingId: string;
  seatNumber: string | null;
  role: PassengerRole;
  paxCount: number;
}
