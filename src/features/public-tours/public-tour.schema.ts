import { z } from "zod";
import { CURRENCIES, DEFAULT_CURRENCY } from "@/shared/constants/domain.constants";

export const publicTourSchema = z.object({
  id: z.string(),
  title: z.string(),
  currency: z.enum(CURRENCIES).default(DEFAULT_CURRENCY),
  transportModality: z.string(),
  durationHours: z.number(),
  depositPerPerson: z.number(),
  price: z.string().or(z.number()),
  departureDateTime: z.string(),
  returnDate: z.string(),
  brochureUrl: z.string().nullable(),
  boardingPoints: z.array(
    z.object({
      id: z.string(),
      location: z.string(),
      time: z.string(),
    }),
  ),
  agency: z.object({
    name: z.string(),
    phone: z.string().nullable(),
  }),
  // Ocupación en vivo calculada por la API (misma regla que el Centro de Control).
  availability: z.object({
    sellableCapacity: z.number(),
    occupiedSeats: z.number(),
    availableSeats: z.number(),
    isBookable: z.boolean(),
  }),
});

export type PublicTourOutput = z.infer<typeof publicTourSchema>;
