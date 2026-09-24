import axios, { AxiosError } from "axios";

// Definimos la interfaz del error estandarizado que enviará Fastify/Zod
export interface ApiError {
  status: number;
  message: string;
  issues?: any[];
}

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  timeout: 10000,
  // CRÍTICO para SaaS con httpOnly cookies: permite el envío y recepción de cookies cross-origin
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response.data?.data || response.data,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || "";

      if (!requestUrl.includes("/auth/login")) {
        if (typeof window !== "undefined") {
          // Avisamos al middleware que la sesión expiró
          window.location.href = "/login?expired=true";
        }
      }
    }

    const customError: ApiError = {
      status: error.response?.status || 500,
      message: (error.response?.data as any)?.error || "Error de conexión con el servidor",
      issues: (error.response?.data as any)?.issues || [],
    };

    return Promise.reject(customError);
  },
);
