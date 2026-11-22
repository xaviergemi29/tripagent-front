export interface MagicLinkValidation {
  isValid?: boolean;
  flowState?: string;
  meta?: {
    agency?: {
      name: string;
      logoPath: string | null;
      phone?: string | null;
      /** Domicilio (aviso de privacidad simplificado del registro). */
      address?: string | null;
    } | null;
  };
  data?: Record<string, unknown> | null;
  error?: { code?: string; message?: string } | string;
}

export type MagicLinkErrorKind = "NOT_FOUND" | "SERVER_ERROR" | "OTHER";

export const MAGIC_LINK_SERVER_ERROR_MESSAGE =
  "No pudimos cargar tu reserva en este momento. Inténtalo de nuevo en unos minutos.";

const DEFAULT_INVALID_MESSAGE = "El enlace ingresado no es válido o ha sido dado de baja.";

export function describeValidationError(validation: MagicLinkValidation): {
  kind: MagicLinkErrorKind;
  message: string;
} {
  const { error } = validation;
  if (typeof error === "string") return { kind: "OTHER", message: error };

  const code = error?.code?.toUpperCase() ?? "";
  if (code.includes("NOT_FOUND")) return { kind: "NOT_FOUND", message: DEFAULT_INVALID_MESSAGE };
  if (code === "SERVER_ERROR") {
    return { kind: "SERVER_ERROR", message: MAGIC_LINK_SERVER_ERROR_MESSAGE };
  }
  return { kind: "OTHER", message: error?.message || DEFAULT_INVALID_MESSAGE };
}
