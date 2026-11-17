import { describe, expect, it } from "vitest";
import { MAGIC_LINK_SERVER_ERROR_MESSAGE, describeValidationError } from "../magic-link-validation";

describe("describeValidationError (pantalla de error del Magic Link)", () => {
  it("enlace inexistente → vista de enlace no encontrado", () => {
    expect(describeValidationError({ isValid: false, error: { code: "NOT_FOUND" } }).kind).toBe(
      "NOT_FOUND",
    );
  });

  it("falla del servidor o sin conexión → pide reintentar, no dice que el enlace no existe", () => {
    expect(
      describeValidationError({
        isValid: false,
        error: { code: "SERVER_ERROR", message: "Error interno del servidor" },
      }),
    ).toEqual({ kind: "SERVER_ERROR", message: MAGIC_LINK_SERVER_ERROR_MESSAGE });
  });

  it("error como texto (límite de intentos del manejador global) → se muestra tal cual", () => {
    expect(
      describeValidationError({ error: "Demasiados intentos. Vuelve a intentarlo en 5 minutos." }),
    ).toEqual({ kind: "OTHER", message: "Demasiados intentos. Vuelve a intentarlo en 5 minutos." });
  });

  it("otro código → su mensaje, o el genérico si no trae", () => {
    expect(
      describeValidationError({ error: { code: "INVALID_STATE", message: "Estado no soportado." } })
        .message,
    ).toBe("Estado no soportado.");
    expect(describeValidationError({ isValid: false }).message).toMatch(/no es válido/);
  });
});
