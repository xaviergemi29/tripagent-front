import { z } from "zod";

// ============================================================================
// 1. ENUMS (Dominios Estrictos)
// ============================================================================
export const currencySchema = z.enum(["MXN", "USD"]);
export const formStatusSchema = z.enum(["COMPLETED", "PENDING"]);
export const paymentStatusSchema = z.enum(["PAID", "ADVANCE", "PENDING_VALIDATION", "PENDING"]);
export const travelerRoleSchema = z.enum(["TITULAR", "COMPANION"]);
export const temporalStatusSchema = z.enum(["ACTIVO", "FINALIZADO", "CANCELADO"]);
export const paymentMethodSchema = z.enum(["CASH", "TRANSFER", "CARD", "OTHER"]);
export const paymentTypeSchema = z.enum(["PAYMENT", "REFUND"]);

// ============================================================================
// 2. MODELOS BASE (Reutilizables)
// ============================================================================

// Historial de transacciones de un titular
export const paymentRecordSchema = z.object({
  id: z.uuid(),
  amount: z.number(),
  method: paymentMethodSchema,
  type: paymentTypeSchema,
  createdAt: z.string().datetime(),
  referenceInfo: z.string().nullable().optional(),
  registeredBy: z.string().nullable().optional(),
  amountUSD: z.number().nullable().optional(),
  amountMXN: z.number().nullable().optional(),
  exchangeRate: z.number().nullable().optional(),
});

// Acompañantes (Estructura plana, dependen financieramente del titular)
export const companionSchema = z.object({
  id: z.uuid(),
  bookingId: z.string().uuid(),
  role: z.literal("COMPANION"),
  fullName: z.string(),
  whatsapp: z.string(),

  // Logística
  formStatus: formStatusSchema,
  seatLabel: z.string().nullable(),
  boardingPoint: z.string().nullable(),
});

// Titular (Dueño de la reserva y finanzas)
export const titularSchema = z.object({
  id: z.uuid(),
  bookingId: z.uuid(),
  role: z.literal("TITULAR"),
  fullName: z.string(),
  whatsapp: z.string(),
  groupSize: z.number().min(1),
  unitPrice: z.number(),

  // Logística y Registro
  formStatus: formStatusSchema,
  seatLabel: z.string().nullable(),
  boardingPoint: z.string().nullable(),
  magicToken: z.string().nullable(),

  // Finanzas consolidadas de la reserva
  paymentStatus: paymentStatusSchema,
  paidAmount: z.number(),
  balance: z.number(),
  equivalentMXN: z.number().nullable().optional(),

  // Relaciones
  payments: z.array(paymentRecordSchema).default([]),
  companions: z.array(companionSchema).default([]),
});

// ============================================================================
// 3. MÉTRICAS Y AGREGACIONES (Calculadas 100% en el Back-End)
// ============================================================================
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

// ============================================================================
// 4. PAYLOAD PRINCIPAL (Respuesta del Endpoint)
// ============================================================================
export const vehicleDTOSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  layoutMap: z.array(z.array(z.string().nullable())),
});

export const tourDashboardDataSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  currency: currencySchema.default("MXN"),
  departureDateTime: z.string().datetime(),
  temporalStatus: temporalStatusSchema.default("ACTIVO"),

  // Agregaciones de negocio
  metrics: tourMetricsSchema,

  // Recursos anidados
  vehicle: vehicleDTOSchema.nullable().optional(),
  travelers: z.array(titularSchema),
});

// ============================================================================
// 5. INFERENCIA DE TIPOS (Para consumir en Props de React)
// ============================================================================
export type Currency = z.infer<typeof currencySchema>;
export type FormStatus = z.infer<typeof formStatusSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type PaymentRecordDTO = z.infer<typeof paymentRecordSchema>;
export type CompanionDTO = z.infer<typeof companionSchema>;
export type TitularRowDTO = z.infer<typeof titularSchema>;
export type TourMetrics = z.infer<typeof tourMetricsSchema>;
export type VehicleDTO = z.infer<typeof vehicleDTOSchema>;
export type TourDashboardOutput = z.infer<typeof tourDashboardDataSchema>;
