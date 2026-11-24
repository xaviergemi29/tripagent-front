import type { FieldErrors } from "react-hook-form";
import type { buildTourFormSchema, TourInput } from "../schemas/tour.schema";

/**
 * Wizard del formulario de tour (4 pasos sobre un solo formulario). Cada paso valida solo sus
 * campos al pulsar "Siguiente"; al guardar, un error lleva al primer paso que lo contiene.
 */
export const TOUR_FORM_STEP_TITLES = [
  "Excursión y Cupo",
  "Transporte y Abordaje",
  "Finanzas y Medios de Pago",
  "Instrucciones y Folleto",
] as const;

export const TOUR_FORM_LAST_STEP = TOUR_FORM_STEP_TITLES.length - 1;

export const TOUR_FORM_STEP_FIELDS = [
  [
    "title",
    "description",
    "destinationType",
    "departureDateTime",
    "returnDate",
    "maxCapacity",
    "staffCapacity",
  ],
  ["transportModality", "boardingPoints"],
  [
    "currency",
    "price",
    "depositPerPerson",
    "acceptsBankTransfer",
    "acceptsCreditCard",
    "acceptsCash",
    "cashInstructions",
  ],
  ["postPaymentInstructions"],
] as const satisfies readonly (readonly (keyof TourInput)[])[];

/** Paso de finanzas: dueño del error de raíz "métodos de cobro" del schema. */
const PAYMENT_STEP = 2;

/** Primer paso con algún error (los de raíz, de métodos de cobro, son del paso de finanzas). */
export const findFirstStepWithError = (errors: FieldErrors<TourInput>): number | null => {
  const errorKeys = Object.keys(errors);
  for (const [index, fields] of TOUR_FORM_STEP_FIELDS.entries()) {
    if (fields.some((field) => errorKeys.includes(field))) return index;
    if (index === PAYMENT_STEP && errorKeys.includes("root")) return index;
  }
  return null;
};

/**
 * Mensaje de la regla de métodos de cobro (al menos uno; transferencia sin CLABE) evaluada con el
 * mismo schema del formulario, o `null` si se cumple. `trigger(campos)` no publica los errores de
 * raíz, así que el paso de finanzas la revisa aparte para mostrarla en ese paso.
 */
export const hasPaymentMethodsIssue = (
  schema: ReturnType<typeof buildTourFormSchema>,
  values: TourInput,
): string | null => {
  const result = schema.safeParse(values);
  if (result.success) return null;
  const issue = result.error.issues.find((candidate) =>
    String(candidate.path[0] ?? "").startsWith("root"),
  );
  return issue?.message ?? null;
};
