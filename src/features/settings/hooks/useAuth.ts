import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LoginFormValues } from "../../../app/(auth)/schemas/login.schema";
import { ChangePasswordInput } from "../schemas/security.schema";

// ============================================================================
// 1. CAPA DE RED (Axios API Client)
// ============================================================================
const loginApi = async (credentials: LoginFormValues): Promise<void> => {
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
      console.log("Error", error.status);
      toast.error("Error al iniciar sesión", {
        description: error.message || "No se pudo guardar la información",
      });
    },
  });
};

export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      queryClient.clear();
      toast.success("Sesión cerrada correctamente");
      router.replace("/login");
    },
    onError: () => {
      router.replace("/login");
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
