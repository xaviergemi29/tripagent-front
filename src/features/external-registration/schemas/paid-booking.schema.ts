import { z } from "zod";
import { CURRENCIES, PASSENGER_STATUSES } from "@/shared/constants/domain.constants";

/**
 * Respuesta de `GET /magic-tokens/:token/validate` cuando `flowState = "PAID"`
 * (payload compartido con PARTIAL_PAYMENT en la API). Solo describe lo que usa el pase de abordaje.
 */
export const paidPassengerOutputSchema = z.object({
  name: z.string(),
  isTitular: z.boolean(),
  status: z.enum(PASSENGER_STATUSES),
  seatLabel: z.string().nullable(),
  /** Valor guardado tal cual (id, ubicación o "ubicación (hora)"). */
  boardingPoint: z.string().nullable(),
  /** Punto configurado en el tour, resuelto por la API con la regla del manifiesto. */
  boardingPointDetails: z.object({ location: z.string(), time: z.string() }).nullable(),
});

export const paidBookingOutputSchema = z.object({
  tourInfo: z.object({
    title: z.string(),
    departureDateTime: z.string(),
    currency: z.enum(CURRENCIES).optional(),
  }),
  financials: z.object({
    totalAmount: z.number(),
    amountPaid: z.number(),
    remainingBalance: z.number(),
    status: z.string(),
  }),
  passengers: z.array(paidPassengerOutputSchema),
  agency: z.object({
    name: z.string(),
    phone: z.string().nullable(),
    address: z.string().nullable().optional(),
  }),
});

export type PaidPassengerOutput = z.output<typeof paidPassengerOutputSchema>;
export type PaidBookingOutput = z.output<typeof paidBookingOutputSchema>;
