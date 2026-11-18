import axios, { AxiosError } from "axios";
import { API_BASE_URL, API_TIMEOUT_MS } from "./api-config";

// Estructura de payload de error devuelta por Fastify / Zod / Custom Handlers
export interface FastifyErrorPayload {
  statusCode?: number;
  code?: string;
  error?: string;
  message?: string;
  issues?: unknown[];
  /** 409 `CAPACITY_EXCEEDED`: lugares que sí quedan en el tour. */
  availableSeats?: number;
}

// Interfaz pública normalizada para captura de errores en React Query / Handlers
export interface ApiError {
  status: number;
  message: string;
  code?: string;
  issues?: unknown[];
  /** 409 `CAPACITY_EXCEEDED`: lugares que sí quedan en el tour. */
  availableSeats?: number;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response.data?.data ?? response.data,
  (error: AxiosError<FastifyErrorPayload>) => {
    // 1. Manejo global de sesión expirada (401)
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || "";

      if (!requestUrl.includes("/auth/login")) {
        if (typeof window !== "undefined") {
          window.location.replace("/login?expired=true");
        }
      }
    }

    // 2. Extraer el payload del servidor si está disponible
    const responseData = error.response?.data;

    // Priorizamos .message sobre .error para evitar el texto genérico "Bad Request"
    let rawMessage =
      responseData?.message ||
      responseData?.error ||
      error.message ||
      "Error de conexión con el servidor";

    // 3. Limpieza de prefijos de validación de Fastify (Ej: "params/id El ID..." -> "El ID...")
    if (typeof rawMessage === "string" && rawMessage.includes(" ")) {
      const parts = rawMessage.split(" ");
      if (parts[0].includes("/")) {
        rawMessage = parts.slice(1).join(" ");
      }
    }

    // 4. Mapeo del objeto estandarizado ApiError
    const customError: ApiError = {
      status: error.response?.status || 500,
      message: rawMessage,
      code: responseData?.code,
      issues: responseData?.issues || [],
      availableSeats: responseData?.availableSeats,
    };

    return Promise.reject(customError);
  },
);
