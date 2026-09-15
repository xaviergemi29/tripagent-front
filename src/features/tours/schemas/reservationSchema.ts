import { z } from "zod";
import { travelerSchema } from "@/features/travelers/schemas/travelerSchema";

export const PAYMENT_STATUS = ["PAID", "PENDING", "CASH_ON_ARRIVAL"] as const;

export const reservationSchema = z.object({
  id: z.uuid().optional(), 
  tourId: z.uuid({ message: "El ID del tour debe ser un UUID válido" }), 
  
  // Datos del Pagador / Cliente Principal
  fullName: z.string().min(3, "El nombre completo es obligatorio").trim(),
  whatsappPhone: z.string().regex(/^\+[1-9]\d{1,14}$/, "Debe ser un teléfono de WhatsApp válido"),
  email: z.string().email("Correo electrónico inválido").trim(),

  // Emergencia general del organizador
  emergencyContactName: z.string().min(3, "Nombre de emergencia requerido").trim(),
  emergencyContactPhone: z.string().regex(/^\+[1-9]\d{1,14}$/, "Teléfono de emergencia inválido"),

  // Estado del negocio
  paymentStatus: z.enum(PAYMENT_STATUS, { message: "Estado de pago no reconocido" }),
  seatsReserved: z.number().int().positive("Debe reservar al menos 1 asiento"),
  
  // Colección de acompañantes utilizando el esquema independiente omitiendo la FK requerida temporalmente en el form
  companions: z.array(travelerSchema.omit({ reservationId: id => id })).default([]),
    
  createdAt: z.iso.datetime().optional(),
});

export type ReservationInput = z.infer<typeof reservationSchema>;
export type ReservationOutput = z.output<typeof reservationSchema>;