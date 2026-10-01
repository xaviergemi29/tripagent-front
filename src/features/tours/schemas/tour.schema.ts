import { z } from "zod";

export const TOUR_MODALITIES = ["TRANSPORT_INCLUDED", "INDEPENDENT_ACCESS"] as const;

const baseTourSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().min(5, "El título debe tener al menos 5 caracteres").max(100),
  description: z.string().default(""),
  transportModality: z
    .enum(TOUR_MODALITIES, {
      message: "Debes seleccionar una modalidad operativa válida",
    })
    .default("TRANSPORT_INCLUDED"),
  price: z
    .union([z.string(), z.number()], { message: "El precio debe ser un número válido" })
    .transform((val) => (val === "" ? 0 : Number(val)))
    .pipe(z.number().positive({ message: "El precio debe ser mayor a 0" })),
  depositPerPerson: z
    .union([z.number(), z.literal("")])
    .transform((val) => (val === "" ? 0 : val))
    .pipe(z.number().min(0, "El anticipo no puede ser negativo")),
  departureDateTime: z
    .string()
    .min(1, { message: "La fecha y hora de salida son obligatorias" })
    .transform((val) => {
      const date = new Date(val);
      if (isNaN(date.getTime())) return val;
      return date.toISOString().slice(0, 10);
    }),

  returnDate: z
    .string()
    .nullish()
    .transform((val) => {
      if (!val) return null;
      const date = new Date(val);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().slice(0, 10);
    }),
  currency: z.enum(["MXN", "USD"]).default("MXN"),

  maxCapacity: z
    .union([z.string(), z.number()], { message: "La capacidad debe ser un número válido" })
    .transform((val) => (val === "" ? 0 : Number(val)))
    .pipe(z.number().int().positive({ message: "La capacidad debe ser de al menos 1 asiento" })),
  isActive: z.boolean(),

  acceptsBankTransfer: z.boolean(),
  acceptsCreditCard: z.boolean(),
  paymentLink: z
    .union([
      z.literal(""),
      z.url({ message: "Debe ser una URL válida (ej. https://mercadopago.com/...)" }),
    ])
    .nullish(),
  postPaymentInstructions: z.string().nullish(),
  acceptsCash: z.boolean(),
  cashInstructions: z.string().nullish(),
  boardingPoints: z
    .array(
      z.object({
        id: z.uuid().optional(),
        location: z.string().min(3, "La ubicación es requerida"),
        time: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Formato HH:MM"),
      }),
    )
    .min(1, "Debes agregar al menos un punto de abordaje"),
  brochureUrl: z.string().nullable().optional(),
});

export const tourSchema = baseTourSchema.superRefine((data, ctx) => {
  if (data.depositPerPerson > data.price) {
    ctx.addIssue({
      code: "custom",
      message: "El anticipo no puede ser mayor al precio total del tour",
      path: ["depositPerPerson"],
    });
  }

  if (data.returnDate && data.departureDateTime) {
    const departure = new Date(data.departureDateTime);
    const returnD = new Date(data.returnDate);
    if (returnD < departure) {
      ctx.addIssue({
        code: "custom",
        message: "La fecha de regreso no puede ser anterior a la salida",
        path: ["returnDate"],
      });
    }
  }

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
