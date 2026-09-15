import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LoginFormValues } from "../schemas/loginSchema";

// 1. Capa de Red
const loginApi = async (credentials: LoginFormValues) => {
  // Tu BE deberá devolver un token (JWT) o setear una cookie httpOnly
  return apiClient.post<{ token: string }>("/auth/login", credentials);
};

const logoutApi = async () => {
  return apiClient.post("/auth/logout");
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
      queryClient.clear(); // Limpiamos toda la caché de React Query
      toast.success("Sesión cerrada correctamente");
      router.replace("/login");
    },
    onError: () => {
      // Incluso si el BE falla, forzamos la salida del cliente
      router.replace("/login");
    },
  });
};
