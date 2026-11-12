import { z } from "zod";
import { CURRENCIES, DEFAULT_CURRENCY, PAYMENT_METHODS } from "@/shared/constants/domain.constants";

export const currencySchema = z.enum(CURRENCIES);
export const formStatusSchema = z.enum(["COMPLETED", "PENDING"]);
export const paymentStatusSchema = z.enum(["PAID", "ADVANCE", "PENDING_VALIDATION", "PENDING"]);
export const travelerRoleSchema = z.enum(["TITULAR", "COMPANION"]);
export const temporalStatusSchema = z.enum(["ACTIVO", "FINALIZADO", "CANCELADO"]);
export const paymentMethodSchema = z.enum(PAYMENT_METHODS);
export const paymentTypeSchema = z.enum(["PAYMENT", "REFUND"]);

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
  role: z.literal("COMPANION"),
  fullName: z.string(),
  whatsapp: z.string(),

  formStatus: formStatusSchema,
  seatLabel: z.string().nullable(),
  boardingPoint: z.string().nullable(),
});

export const titularSchema = z.object({
  id: z.uuid(),
  bookingId: z.uuid(),
  role: z.literal("TITULAR"),
  fullName: z.string(),
  whatsapp: z.string(),
  groupSize: z.number().min(1),
  unitPrice: z.number(),
  bookingStatus: z.enum(["AWAITING_REGISTRATION", "PENDING", "CONFIRMED", "CANCELLED", "NO_SHOW"]),
  requiredDeposit: z.number(),
  hasSeatRight: z.boolean(),

  formStatus: formStatusSchema,
  seatLabel: z.string().nullable(),
  boardingPoint: z.string().nullable(),
  magicToken: z.string().nullable(),

  paymentStatus: paymentStatusSchema,
  paidAmount: z.number(),
  balance: z.number(),
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

export const vehicleOutputSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  layoutMap: z.array(z.array(z.string().nullable())),
});

export const tourDashboardOutputSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  currency: currencySchema.default(DEFAULT_CURRENCY),
  departureDateTime: z.iso.datetime(),
  temporalStatus: temporalStatusSchema.default("ACTIVO"),
  requiresSeats: z.boolean().default(true),
  metrics: tourMetricsSchema,
  vehicle: vehicleOutputSchema.nullable().optional(),
  travelers: z.array(titularSchema),
});

export type FormStatus = z.infer<typeof formStatusSchema>;
export type TravelerRole = z.infer<typeof travelerRoleSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type PaymentRecordOutput = z.infer<typeof paymentRecordSchema>;
export type CompanionOutput = z.infer<typeof companionSchema>;
export type TitularRowOutput = z.infer<typeof titularSchema>;
export type TourMetrics = z.infer<typeof tourMetricsSchema>;
export type VehicleOutput = z.infer<typeof vehicleOutputSchema>;
export type TourDashboardOutput = z.infer<typeof tourDashboardOutputSchema>;

/**
 * Vista aplanada (titulares + acompañantes) de los pasajeros con derecho a asiento.
 * La arma `TourDashboardView` a partir de `travelers`; no es un contrato de la API.
 */
export interface FlattenedPassenger {
  id: string;
  fullName: string;
  bookingId: string;
  seatNumber: string | null;
  role: TravelerRole;
  paxCount: number;
}
