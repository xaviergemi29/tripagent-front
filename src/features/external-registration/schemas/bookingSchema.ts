import { z } from "zod";

const basePassengerSchema = z.object({
    fullName: z.string().min(3, "El nombre completo es obligatorio").trim(),
    emergencyContactName: z.string().min(3, "Nombre de emergencia requerido").trim(),
    emergencyContactPhone: z.string().regex(/^(\+)?\d{10}$/, "Teléfono inválido"),
    medicalNotes: z.string().trim().optional(),
    boardingPoint: z.string().min(1, "Debes seleccionar en qué punto subirás al autobús")
});

export const mainClientSchema = basePassengerSchema.extend({
    whatsappPhone: z.string().regex(/^(\+)?\d{10}$/, "Debe ser un WhatsApp válido"),
    email: z.email("Correo electrónico inválido").trim(),

    birthDate: z.union([z.iso.date("Formato YYYY-MM-DD"), z.literal("")]).optional()
        .transform(e => e === "" ? undefined : e),
});

export const companionSchema = basePassengerSchema.extend({
    whatsappPhone: z.string().regex(/^(\+)?\d{10}$/, "Inválido").optional().or(z.literal("")),
    email: z.email("Formato de correo inválido").or(z.literal("")).optional(),
    passengerType: z.enum(["ADULT", "CHILD"]),
}).superRefine((data, ctx) => {
    if (data.passengerType === "ADULT") {
        if (!data.whatsappPhone || !/^(\+)?\d{10}$/.test(data.whatsappPhone)) {
            ctx.addIssue({
                code: "custom",
                path: ["whatsappPhone"],
                message: "El WhatsApp es obligatorio para adultos",
            });
        }
    }
});

export const bookingFormSchema = z.object({
    token: z.string().min(1, "Token de seguridad faltante"),
    mainClient: mainClientSchema,
    hasCompanions: z.boolean(),
    companionMethod: z.enum(["MANUAL", "SHARE_LINK"]),
    groupId: z.uuid().optional(),
    companions: z.array(companionSchema),
});


export const bookingResultSchema = z.object({
    bookingId: z.string(),
    acceptsBankTransfer: z.boolean(),
    bankDetails: z.string().nullable(),
    acceptsCreditCard: z.boolean(),
    paymentLink: z.string().nullable(),
    acceptsCash: z.boolean(),
    cashInstructions: z.string().nullable(),
    totalPassengersRegistered: z.number(),
    message: z.string(),
});


export type BookingFormValues = z.infer<typeof bookingFormSchema>;
export type BookingInput = z.input<typeof bookingFormSchema>;
export type BookingOutput = z.output<typeof bookingResultSchema>;