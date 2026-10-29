import axios, { AxiosError } from "axios";

// Estructura de payload de error devuelta por Fastify / Zod / Custom Handlers
export interface FastifyErrorPayload {
  statusCode?: number;
  code?: string;
  error?: string;
  message?: string;
  issues?: unknown[];
}

// Interfaz pública normalizada para captura de errores en React Query / Handlers
export interface ApiError {
  status: number;
  message: string;
  code?: string;
  issues?: unknown[];
}

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response.data?.data || response.data,
  (error: AxiosError<FastifyErrorPayload>) => {
    // 1. Manejo global de sesión expirada (401)
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || "";

      if (!requestUrl.includes("/auth/login")) {
        if (typeof window !== "undefined") {
          window.location.href = "/login?expired=true";
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
    };

    return Promise.reject(customError);
  },
);
