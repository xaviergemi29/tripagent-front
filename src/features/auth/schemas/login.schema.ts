import { z } from "zod";

export const loginSchema = z.object({
  // trim/minúsculas ANTES de validar (z.email().trim() valida primero y rechaza " a@b.mx").
  email: z.string().trim().toLowerCase().pipe(z.email("Ingresa un correo válido")),
  password: z.string().min(6, "La contraseña es muy corta"),
});

export type LoginInput = z.infer<typeof loginSchema>;
