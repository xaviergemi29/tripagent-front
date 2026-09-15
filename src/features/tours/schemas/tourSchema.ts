import { z } from "zod";

export const TOUR_MODALITIES = ["TRANSPORT_INCLUDED", "INDEPENDENT_ACCESS"] as const;

const baseTourSchema = z.object({
    id: z.uuid().optional(),
    title: z.string().min(5, "El título debe tener al menos 5 caracteres").max(100),
    // description: z.string().min(20, "Añade una descripción operativa"),
    description: z.string().default(""),
    tourRecommendations: z.string().default(""),    
    // tourRecommendations: z
    //     .string()
    //     .min(10, { message: "Menciona qué llevar (ropa, calzado, etc.) para el System Prompt" }),

    transportModality: z.enum(TOUR_MODALITIES, {
        message: "Debes seleccionar una modalidad operativa válida",
    }).default("TRANSPORT_INCLUDED"),

    price: z
        .union([z.string(), z.number()], { message: "El precio debe ser un número válido" })
        .transform((val) => (val === "" ? 0 : Number(val)))
        .pipe(
            z.number().positive({ message: "El precio debe ser mayor a 0" })
        ),

    durationHours: z.coerce.number().default(0),
    // durationHours: z
    //     .union([z.string(), z.number()], { message: "La duración debe ser un número válido" })
    //     .transform((val) => (val === "" ? 0 : Number(val)))
    //     .pipe(
    //         z.number().positive({ message: "La duración debe ser de al menos 1 hora" })
    //     ),

    // meetingPoint: z.string().min(5, "Punto de encuentro requerido"),
    departureDateTime: z
        .string()
        .min(1, { message: "La fecha y hora de salida son obligatorias" })
        .transform((val) => {
            const date = new Date(val);
            if (isNaN(date.getTime())) return val; // Si es inválida, se la pasamos al backend para que falle allá
            return date.toISOString().slice(0, 10);
        }),
    maxCapacity: z
        .union([z.string(), z.number()], { message: "La capacidad debe ser un número válido" })
        .transform((val) => (val === "" ? 0 : Number(val)))
        .pipe(
            z.number().int().positive({ message: "La capacidad debe ser de al menos 1 asiento" })
        ),
    isActive: z.boolean(),

    // ==========================================
    // CONFIGURACIÓN DE COBRO (BILLING CONFIG)
    // ==========================================
    acceptsBankTransfer: z.boolean(),
    bankDetails: z.string().optional(),

    acceptsCreditCard: z.boolean(),

    paymentLink: z
        .union([z.literal(""), z.string().url({ message: "Debe ser una URL válida (ej. https://mercadopago.com/...)" })])
        .optional(),


    // postPaymentInstructions: z
    //     .string()
    //     .min(10, { message: "Instrucciones claras son vitales para evitar fraude o confusión" }),
    postPaymentInstructions: z.string().default(""),

    acceptsCash: z.boolean(),
    cashInstructions: z.string().optional(),
    boardingPoints: z.array(
    z.object({
      id: z.uuid().optional(),
      location: z.string().min(3, "La ubicación es requerida"),
      time: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Formato HH:MM"),
    })
  ).min(1, "Debes agregar al menos un punto de abordaje"),
});

export const tourSchema = baseTourSchema.superRefine((data, ctx) => {
    // Validación SPEI
    if (data.acceptsBankTransfer && (!data.bankDetails || data.bankDetails.length < 15)) {
        ctx.addIssue({
            code: "custom",
            message: "Proporciona Banco, CLABE y Titular (min. 15 caracteres)",
            path: ["bankDetails"],
        });
    }

    // Validación Tarjeta (Si acepta tarjeta, el link de pago se vuelve obligatorio)
    if (data.acceptsCreditCard && (!data.paymentLink || data.paymentLink === "")) {
        ctx.addIssue({
            code: "custom",
            message: "Debes proporcionar un enlace de pago si aceptas tarjeta",
            path: ["paymentLink"],
        });
    }

    if (data.acceptsCash && (!data.cashInstructions || data.cashInstructions.trim().length < 10)) {
        ctx.addIssue({
            code: "custom",
            message: "Instrucciones claras son vitales para evitar fraude o confusión",
            path: ["cashInstructions"],
        });
    }
});

export type TourInput = z.input<typeof tourSchema>;
export type TourOutput = z.output<typeof tourSchema>;
