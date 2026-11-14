import z from "zod";

/** Colores que usa una agencia sin identidad visual guardada (mismos defaults que la API). */
export const DEFAULT_BRANDING_COLORS = {
  primaryColor: "#4f46e5",
  secondaryColor: "#4338ca",
} as const;

/** Paleta sugerida en el selector de color. */
export const SUGGESTED_BRAND_COLORS = [
  "#4f46e5",
  "#2563eb",
  "#059669",
  "#d97706",
  "#dc2626",
  "#0f172a",
] as const;

/** Logotipo: PNG o JPEG (jsPDF no puede insertar SVG en el comprobante), máximo 2 MB. */
export const LOGO_ACCEPTED_TYPES = ["image/png", "image/jpeg"] as const;
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

/** Color hex `#RGB` o `#RRGGBB`, normalizado a `#rrggbb` (misma regla que la API). */
export const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Usa un color hexadecimal, p. ej. #4f46e5")
  .transform((value) => {
    const hex = value.slice(1).toLowerCase();
    return hex.length === 3
      ? `#${hex
          .split("")
          .map((c) => c + c)
          .join("")}`
      : `#${hex}`;
  });

/** Formulario de "Identidad Visual & PDFs" (los colores; el logo se sube aparte). */
export const brandingFormSchema = z.object({
  primaryColor: hexColorSchema,
  secondaryColor: hexColorSchema,
  /** Opcional: vacío → `null` (el PDF usa el color secundario como acento). */
  accentColor: z.union([z.literal(""), hexColorSchema]).transform((value) => value || null),
});

/** Respuesta de `GET/PATCH /agencies/branding`, `POST/DELETE /agencies/logo`. */
export const agencyBrandingOutputSchema = z.object({
  logoPath: z.string().nullable(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string().nullable(),
});

export type BrandingFormInput = z.input<typeof brandingFormSchema>;
/** Cuerpo de `PATCH /agencies/branding` (colores ya normalizados). */
export type BrandingInput = z.output<typeof brandingFormSchema>;
export type AgencyBrandingOutput = z.output<typeof agencyBrandingOutputSchema>;
