// src/features/auth/hooks/useSession.ts
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { UserProfile } from "../schemas/session.schema";

// ============================================================================
// 1. QUERY KEY FACTORY
// ============================================================================
export const AUTH_KEYS = {
  all: ["auth"] as const,
  session: () => [...AUTH_KEYS.all, "session"] as const,
};

// ============================================================================
// 2. CAPA DE RED
// ============================================================================
const fetchSession = async (): Promise<UserProfile> => {
  // Al usar HttpOnly, Axios enviará la cookie automáticamente.
  // Asegúrate de que tu BE devuelva la data directamente, o ajusta la desestructuración.
  return apiClient.get<never, UserProfile>("/auth/me");
};

// ============================================================================
// 3. HOOK DE LECTURA
// ============================================================================
export const useSession = () => {
  return useQuery({
    queryKey: AUTH_KEYS.session(),
    queryFn: fetchSession,
    staleTime: 1000 * 60 * 15, // 15 minutos: evitamos spamear al BE en cada render
    gcTime: 1000 * 60 * 60, // Mantenemos la caché 1 hora
    retry: false, // Si falla un 401, no queremos reintentos, queremos redirigir
  });
};
