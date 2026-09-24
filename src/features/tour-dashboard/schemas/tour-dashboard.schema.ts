import { z } from "zod";

// 1. Enums para Estados (Protege la UI de strings inválidos)
export const formStatusSchema = z.enum(["COMPLETED", "PENDING"]);
export const paymentStatusSchema = z.enum(["PAID", "ADVANCE", "PENDING_VALIDATION", "PENDING"]);
export const titularRoleSchema = z.enum(["TITULAR"]);
export const companionRoleSchema = z.enum(["COMPANION"]);
export const travelerRoleSchema = z.enum(["TITULAR", "COMPANION"]);

export const baseTravelerRowSchema = z.object({
  id: z.uuid(),
  bookingId: z.uuid(),
  fullName: z.string(),
  role: travelerRoleSchema,
  whatsapp: z.string(),
  formStatus: formStatusSchema,
  paymentStatus: paymentStatusSchema,
  paidAmount: z.number(),
  balance: z.number(),
  unitPrice: z.number(),
  magicToken: z.string().optional(),
});

// 2. Esquema de la Fila del Viajero
export const travelerRowSchema = baseTravelerRowSchema.extend({
  role: titularRoleSchema,
  groupSize: z.number().optional(),
  totalCost: z.number().optional(),
  companions: z
    .array(
      baseTravelerRowSchema.extend({
        role: companionRoleSchema,
      }),
    )
    .default([]),
});

// 3. Esquema de Métricas
export const tourMetricsSchema = z.object({
  occupancy: z.object({
    current: z.number(),
    max: z.number(),
  }),
  revenue: z.object({
    projected: z.number(),
    collected: z.number(),
  }),
  pendingValidations: z.number(),
  pendingForms: z.number(),
});

// 4. Esquema del Payload Completo
export const tourDashboardDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  departureDateTime: z.iso.datetime(), // Valida que sea un ISO String válido
  temporalStatus: z.string().optional(),
  metrics: tourMetricsSchema,
  travelers: z.array(travelerRowSchema),
  vehicle: z
    .object({
      id: z.string(),
      name: z.string(),
      layoutMap: z.array(z.array(z.string().nullable())),
    })
    .optional(),
});

// 5. Exportamos las interfaces inferidas para usarlas en los Props de React
export type FormStatus = z.infer<typeof formStatusSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type TravelerRole = z.infer<typeof travelerRoleSchema>;
export type TravelerRow = z.infer<typeof travelerRowSchema>;
export type TourMetrics = z.infer<typeof tourMetricsSchema>;
export type TourDashboardOutput = z.infer<typeof tourDashboardDataSchema>;
