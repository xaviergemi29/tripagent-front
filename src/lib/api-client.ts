import axios, { AxiosError } from 'axios';

// Definimos la interfaz del error estandarizado que enviará Fastify/Zod
export interface ApiError {
    status: number;
    message: string;
    issues?: any[];
}

export const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    timeout: 10000,
    // CRÍTICO para SaaS con httpOnly cookies: permite el envío y recepción de cookies cross-origin
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.response.use(
    (response) =>
        // Retornamos directamente el payload útil para no anidar .data.data en los componentes
        response.data?.data || response.data
    ,
    (error: AxiosError) => {
        if (error.response?.status === 401) {

            // 🎯 LA CLAVE: Obtenemos la URL de la petición que originó el error
            const requestUrl = error.config?.url || "";

            // Si el 401 viene del intento de login, NO hacemos la redirección dura.
            // Dejamos que el error pase hacia el hook para que TanStack Query y Sonner hagan su trabajo.
            if (!requestUrl.includes("/auth/login")) {
                if (typeof window !== "undefined") {
                    window.location.href = "/login";
                }
            }
        }


        // Estandarizamos el error para que TanStack Query lo consuma de forma predecible
        const customError: ApiError = {
            status: error.response?.status || 500,
            message: (error.response?.data as any)?.error || 'Error de conexión con el servidor',
            issues: (error.response?.data as any)?.issues || [],
        }

        return Promise.reject(customError);
    }
)