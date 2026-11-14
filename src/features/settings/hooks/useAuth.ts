import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LoginInput } from "../../../app/(auth)/schemas/login.schema";
import { ChangePasswordInput } from "../schemas/security.schema";

// ============================================================================
// 1. CAPA DE RED (Axios API Client)
// ============================================================================
const loginApi = async (credentials: LoginInput): Promise<void> => {
  // Tu BE deberá devolver un token (JWT) o setear una cookie httpOnly
  return apiClient.post("/auth/login", credentials);
};

const logoutApi = async (): Promise<void> => {
  return apiClient.post("/auth/logout");
};

const changePasswordApi = async (newCredentials: ChangePasswordInput): Promise<void> => {
  return apiClient.post("auth/change-password", newCredentials);
};

// ============================================================================
// 2. HOOKS DE MUTACIONES (Escritura y Optimistic UI)
// ============================================================================
export const useLogin = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: loginApi,
    // Si el BE usa Cookies httpOnly (mejor práctica), no necesitas hacer nada con 'data'.
    onSuccess: () => {
      toast.success("Bienvenido al sistema");
      router.replace("/tours");
    },
    onError: (error: ApiError) => {
      toast.error("Error al iniciar sesión", {
        description: error.message || "No se pudo guardar la información",
      });
    },
  });
};

/**
 * Navegación DURA al login, reemplazando la entrada actual del historial.
 * `router.replace` no basta: la Client Cache de Next reutiliza las páginas en atrás/adelante sin
 * pasar por el proxy, así que la página privada se volvía a pintar antes del 401. La recarga
 * destruye esa caché (y la de React Query) y obliga a que «Atrás» pida la ruta al servidor,
 * donde el proxy redirige a /login sin renderizar nada privado.
 */
const hardRedirectToLogin = (query = ""): void => {
  window.location.replace(`/login${query}`);
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      queryClient.clear();
      hardRedirectToLogin();
    },
    onError: () => {
      queryClient.clear();
      // Si la API no pudo borrar la cookie, el proxy la elimina al recibir ?expired=true.
      hardRedirectToLogin("?expired=true");
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: changePasswordApi,
    onSuccess: () => {
      toast.success("Contraseña actualizada", {
        description: "Tu contraseña ha sido cambiada exitosamente.",
      });
    },
    onError: (error: ApiError) => {
      toast.error("Error al cambiar la contraseña", {
        description: error?.message || "Error al actualizar la contraseña",
      });
    },
  });
};
