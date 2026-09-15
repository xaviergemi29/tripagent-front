import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Ingresa un correo válido").trim(),
  password: z.string().min(6, "La contraseña es muy corta"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
