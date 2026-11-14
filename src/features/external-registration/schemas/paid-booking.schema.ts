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
  /** WhatsApp del pasajero (columna del estado de cuenta PDF). */
  phone: z.string().nullable().optional(),
});

export const paidBookingOutputSchema = z.object({
  tourInfo: z.object({
    title: z.string(),
    departureDateTime: z.string(),
    returnDate: z.string().nullable().optional(),
    currency: z.enum(CURRENCIES).optional(),
    /** Instrucciones Post-Pago (logística) del tour: pantalla y estado de cuenta PDF. */
    postPaymentInstructions: z.string().nullable().optional(),
  }),
  /** Lugares apartados (tamaño esperado del grupo). */
  groupSize: z.number().optional(),
  /** Abonos válidos (la API ya excluye anulaciones); los usa el estado de cuenta PDF. */
  paymentHistory: z
    .array(
      z.object({
        id: z.string(),
        date: z.string(),
        amount: z.number(),
        method: z.string(),
        reference: z.string().nullable().optional(),
      }),
    )
    .optional(),
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
    // Datos para el estado de cuenta PDF (mismo payload que PARTIAL_PAYMENT).
    email: z.string().nullable().optional(),
    bankName: z.string().nullable().optional(),
    accountHolder: z.string().nullable().optional(),
    clabeNumber: z.string().nullable().optional(),
    cardNumber: z.string().nullable().optional(),
    logoPath: z.string().nullable().optional(),
    primaryColor: z.string().nullable().optional(),
    secondaryColor: z.string().nullable().optional(),
    accentColor: z.string().nullable().optional(),
    policies: z.string().nullable().optional(),
  }),
});

export type PaidPassengerOutput = z.output<typeof paidPassengerOutputSchema>;
export type PaidBookingOutput = z.output<typeof paidBookingOutputSchema>;
