import { z } from "zod";

export const travelerSchema = z.object({
  id: z.uuid().optional(),
  
  fullName: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres"),

  whatsappPhone: z.string().trim().regex(/^\+[1-9]\d{1,14}$/, "Debe ser un teléfono de WhatsApp válido (E.164)"),
  email: z.string().trim().email("Correo electrónico inválido"),
  
  emergencyContactName: z.string().trim().min(3, "Nombre de emergencia requerido"),
  emergencyContactPhone: z.string().trim().regex(/^\+[1-9]\d{1,14}$/, "Teléfono de emergencia inválido (E.164)"),
  
  medicalNotes: z.string().trim().optional(),
  
  customFields: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.iso.datetime().optional(),
});

// Inferimos los tipos. Como usamos .default(), Input y Output tienen diferencias sutiles
export type TravelerInput = z.input<typeof travelerSchema>;
export type TravelerOutput = z.output<typeof travelerSchema>;