import { z } from "zod";

// ============================================================================
// 1. CONTRATO DE DATOS (Schema)
// ============================================================================
export const userProfileSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  fullName: z.string(),
  role: z.string(),
  agencyId: z.uuid(),
  agencyName: z.string(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
