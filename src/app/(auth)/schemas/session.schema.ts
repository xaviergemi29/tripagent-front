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
  /** Ruta del logotipo de la agencia (`/uploads/logos/…`) o null. */
  agencyLogoPath: z.string().nullable().optional(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
