import z from "zod";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "La nueva contraseña no puede ser igual a la actual",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ChangePasswordOutput = z.infer<typeof changePasswordSchema>;
