import { z } from "zod";

export const publicTourSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.string().or(z.number()),
  departureDateTime: z.string(),
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
});

export type PublicTourOutput = z.infer<typeof publicTourSchema>;
