import type { ApiError } from "./api-client";

/**
 * ¿Es el `ApiError` que rechaza el interceptor de `apiClient`? Es un objeto `{ status, message }`,
 * **no** una instancia de `Error`: `instanceof Error` no lo reconoce. Módulo aparte (sin axios) para
 * que los componentes puedan usarlo sin cargar el cliente HTTP.
 */
export const isApiError = (error: unknown): error is ApiError =>
  typeof error === "object" &&
  error !== null &&
  typeof (error as ApiError).status === "number" &&
  typeof (error as ApiError).message === "string";

/** La consulta falló porque el recurso no existe o no es de la agencia (404). */
export const isNotFoundError = (error: unknown): boolean =>
  isApiError(error) && error.status === 404;
