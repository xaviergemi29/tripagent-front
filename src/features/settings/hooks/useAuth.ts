import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LoginFormValues } from "../../../app/(auth)/schemas/login.schema";
import { ChangePasswordInput } from "../schemas/security.schema";

// 1. Capa de Red
const loginApi = async (credentials: LoginFormValues) => {
  // Tu BE deberá devolver un token (JWT) o setear una cookie httpOnly
  return apiClient.post<{ token: string }>("/auth/login", credentials);
};

const logoutApi = async (): Promise<void> => {
  return apiClient.post("/auth/logout");
};

const changePasswordApi = async (newCredentials: ChangePasswordInput): Promise<void> => {
  return apiClient.post("auth/change-password", newCredentials);
};

// 2. Hook de UI
export const useLogin = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      // Nota de Arquitectura: Si el BE devuelve el JWT en el JSON, lo guardas aquí en memoria o localStorage.
      // Si el BE usa Cookies httpOnly (mejor práctica), no necesitas hacer nada con 'data'.
      console.log("data login", data);
      toast.success("Bienvenido al sistema");
      router.replace("/tours");
    },
    onError: (error: Error) => {
      console.log("error", error);
      toast.error("Credenciales incorrectas", {
        description: "Verifica tu correo y contraseña e intenta de nuevo.",
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
    onError: (error: any) => {
      const errorMsg = error?.response?.data?.error || "Error al actualizar la contraseña";
      toast.error("No se pudo cambiar la contraseña", {
        description: errorMsg,
      });
    },
  });
};
