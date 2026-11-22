import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiClient, type ApiError } from "@/lib/api-client";
import type { RegisterAgencyInput } from "../schemas/register-agency.schema";

const registerAgencyApi = (body: RegisterAgencyInput): Promise<unknown> =>
  apiClient.post("/auth/register-agency", body);

/**
 * Alta de agencia (`POST /auth/register-agency`). La API crea la agencia en prueba de 30 días, su
 * usuario administrador y deja la cookie de sesión: al terminar se entra directo a /tours. Los
 * errores (409 correo ya registrado, 429, red) los muestra el formulario.
 */
export function useRegisterAgency() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<unknown, ApiError, RegisterAgencyInput>({
    mutationFn: registerAgencyApi,
    onSuccess: () => {
      // Sin datos de otra sesión en caché (p. ej. si alguien ya había entrado en este navegador).
      queryClient.clear();
      toast.success("¡Tu agencia está lista!", {
        description: "Empieza creando tu primera salida grupal.",
      });
      router.replace("/tours");
    },
  });
}
