import { z } from "zod";
import { getTodayInMexico, PAST_DEPARTURE_ERROR } from "@/shared/utils/tour-date.util";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  DESTINATION_TYPE,
  DESTINATION_TYPES,
  TOUR_TEMPORAL_STATUSES,
} from "@/shared/constants/domain.constants";

export const TOUR_MODALITIES = ["TRANSPORT_INCLUDED", "INDEPENDENT_ACCESS"] as const;

const baseTourSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().min(5, "El título debe tener al menos 5 caracteres").max(100),
  description: z.string().max(5000, "La descripción no puede superar 5000 caracteres").default(""),
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
  currency: z.enum(CURRENCIES).default(DEFAULT_CURRENCY),

  maxCapacity: z
    .union([z.string(), z.number()], { message: "La capacidad debe ser un número válido" })
    .transform((val) => (val === "" ? 0 : Number(val)))
    .pipe(z.number().int().positive({ message: "La capacidad debe ser de al menos 1 asiento" })),
  // Lugares operativos (chofer, guía) que no se venden. Capacidad vendible = total − staff.
  staffCapacity: z
    .union([z.string(), z.number()], { message: "Los lugares de staff deben ser un número" })
    .transform((val) => (val === "" ? 0 : Number(val)))
    .pipe(
      z
        .number()
        .int("Los lugares de staff deben ser un número entero")
        .min(0, "Los lugares de staff no pueden ser negativos"),
    )
    .default(0),
  // Sin `isActive`: "Pausado" no existe en el MVP (decisión del PM, 2026-11-14). Un tour se cancela
  // desde el Centro de Control (`POST /tours/:id/cancel`).

  acceptsBankTransfer: z.boolean(),
  // Tarjeta sin enlace de pago (2026-11-22): el viajero lo pide a la agencia por WhatsApp.
  acceptsCreditCard: z.boolean(),
  // Indicaciones de logística del tour (ej. "Llevar botas de montaña"). Se muestran en el Magic
  // Link y en el estado de cuenta PDF, separadas de las políticas generales de la agencia.
  postPaymentInstructions: z
    .string()
    .max(2000, "Las instrucciones no pueden superar 2000 caracteres")
    .nullish(),
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
  destinationType: z.enum(DESTINATION_TYPES).default(DESTINATION_TYPE.NATIONAL),
});

export const tourSchema = baseTourSchema.superRefine((data, ctx) => {
  if (data.depositPerPerson > data.price) {
    ctx.addIssue({
      code: "custom",
      message: "El anticipo no puede ser mayor al precio total",
      path: ["depositPerPerson"],
    });
    ctx.addIssue({
      code: "custom",
      message: "El precio total no puede ser menor al anticipo",
      path: ["price"],
    });
  }

  if (data.staffCapacity >= data.maxCapacity && data.maxCapacity > 0) {
    ctx.addIssue({
      code: "custom",
      message: "Los lugares de staff deben ser menores a la capacidad total",
      path: ["staffCapacity"],
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
      ctx.addIssue({
        code: "custom",
        message: "La salida no puede ser posterior al regreso",
        path: ["departureDateTime"],
      });
    }
  }

  if (data.acceptsCash && (!data.cashInstructions || data.cashInstructions.trim().length < 10)) {
    ctx.addIssue({
      code: "custom",
      message: "Instrucciones claras son vitales para evitar fraude o confusión",
      path: ["cashInstructions"],
    });
  }

  if (data.boardingPoints && data.boardingPoints.length > 1) {
    for (let i = 1; i < data.boardingPoints.length; i++) {
      const prevTime = data.boardingPoints[i - 1].time;
      const currTime = data.boardingPoints[i].time;

      if (prevTime && currTime && currTime <= prevTime) {
        ctx.addIssue({
          code: "custom",
          message: "La hora debe ser posterior a la parada anterior",
          path: ["boardingPoints", i, "time"],
        });
      }
    }
  }

  if (!data.acceptsBankTransfer && !data.acceptsCreditCard && !data.acceptsCash) {
    ctx.addIssue({
      code: "custom",
      message: "Debes habilitar al menos un método de cobro para tus viajeros",
      path: ["root.paymentMethods"],
    });
  }
});

export const tourOutputSchema = baseTourSchema.extend({
  // Estado temporal calculado por la API (regla 9): "PRÓXIMO" | "EN CURSO" | "FINALIZADO" | "CANCELADO".
  temporalStatus: z.enum(TOUR_TEMPORAL_STATUSES).optional(),
  currentOccupancy: z.number().optional(),
  sellableCapacity: z.number().optional(),
  // Solo en GET /tours/:id: con pagos registrados, la moneda y el precio quedan congelados.
  hasPayments: z.boolean().optional(),
});

/**
 * Schema del formulario de tour con la regla de la salida (2026-11-17): no puede ser anterior a hoy
 * (hora de CDMX). Al editar se permite conservar la fecha guardada aunque ya haya pasado
 * (`originalDepartureDate`), pero no moverla al pasado. La API aplica la misma regla.
 */
export const buildTourFormSchema = (
  originalDepartureDate?: string | null,
  options: {
    /**
     * ¿La agencia tiene CLABE? (OBS-038, decisión del PM, 2026-11-17). `undefined` mientras carga o si
     * falló la consulta: no se aplica la regla para no bloquear por falta de datos.
     */
    agencyHasClabe?: boolean;
  } = {},
) =>
  tourSchema.superRefine((data, ctx) => {
    // Solo transferencia y la agencia sin CLABE: los viajeros no tendrían cómo apartar. Con efectivo
    // o tarjeta activos sí se guarda (la API solo exige un método; el Magic Link pide los datos de
    // transferencia por WhatsApp).
    if (
      options.agencyHasClabe === false &&
      data.acceptsBankTransfer &&
      !data.acceptsCreditCard &&
      !data.acceptsCash
    ) {
      ctx.addIssue({
        code: "custom",
        message: TRANSFER_WITHOUT_CLABE_ERROR,
        path: ["root.paymentMethods"],
      });
    }

    const departure = data.departureDateTime;
    if (!departure || departure === originalDepartureDate) return;
    if (departure < getTodayInMexico()) {
      ctx.addIssue({ code: "custom", message: PAST_DEPARTURE_ERROR, path: ["departureDateTime"] });
    }
  });

/** Solo transferencia sin CLABE en la agencia (OBS-038): texto acordado con el PM. */
export const TRANSFER_WITHOUT_CLABE_ERROR =
  "Activa pago en efectivo o agrega tu CLABE para que tus clientes sepan cómo apartar";

export type TourInput = z.input<typeof tourSchema>;
export type TourOutput = z.infer<typeof tourOutputSchema>;
