import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, type ApiError } from "@/lib/api-client";
import type { AgencyBrandingOutput, BrandingInput } from "../schemas/branding.schema";
import { AUTH_KEYS } from "@/app/(auth)/hooks/useSession";

// ============================================================================
// 1. QUERY KEY FACTORY
// ============================================================================
export const AGENCY_BRANDING_KEYS = {
  all: ["agency-branding"] as const,
};

// ============================================================================
// 2. CAPA DE RED
// ============================================================================
const getBrandingApi = (): Promise<AgencyBrandingOutput> =>
  apiClient.get<never, AgencyBrandingOutput>("/agencies/branding");

const updateBrandingApi = (colors: BrandingInput): Promise<AgencyBrandingOutput> =>
  apiClient.patch<never, AgencyBrandingOutput>("/agencies/branding", colors);

const uploadLogoApi = (file: File): Promise<AgencyBrandingOutput> => {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post<never, AgencyBrandingOutput>("/agencies/logo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

const removeLogoApi = (): Promise<AgencyBrandingOutput> =>
  apiClient.delete<never, AgencyBrandingOutput>("/agencies/logo");

// ============================================================================
// 3. QUERIES
// ============================================================================
/** Identidad visual de la agencia de la sesión: `{ logoPath, primaryColor, secondaryColor, accentColor }`. */
export function useAgencyBranding() {
  return useQuery({
    queryKey: AGENCY_BRANDING_KEYS.all,
    queryFn: getBrandingApi,
  });
}

// ============================================================================
// 4. MUTACIONES
// ============================================================================
/** Guarda los colores con actualización optimista (rollback si la API falla). */
export function useUpdateBranding() {
  const queryClient = useQueryClient();

  return useMutation<
    AgencyBrandingOutput,
    ApiError,
    BrandingInput,
    { previous?: AgencyBrandingOutput }
  >({
    mutationFn: updateBrandingApi,
    onMutate: async (colors) => {
      await queryClient.cancelQueries({ queryKey: AGENCY_BRANDING_KEYS.all });
      const previous = queryClient.getQueryData<AgencyBrandingOutput>(AGENCY_BRANDING_KEYS.all);
      if (previous) {
        queryClient.setQueryData<AgencyBrandingOutput>(AGENCY_BRANDING_KEYS.all, {
          ...previous,
          ...colors,
        });
      }
      return { previous };
    },
    onError: (error, _colors, context) => {
      if (context?.previous) {
        queryClient.setQueryData(AGENCY_BRANDING_KEYS.all, context.previous);
      }
      toast.error("No se pudo guardar la identidad visual", { description: error.message });
    },
    onSuccess: (branding) => {
      queryClient.setQueryData(AGENCY_BRANDING_KEYS.all, branding);
      toast.success("Configuración guardada", {
        description: "Los próximos comprobantes PDF usarán estos colores.",
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: AGENCY_BRANDING_KEYS.all }),
  });
}

export function useUploadAgencyLogo() {
  const queryClient = useQueryClient();

  return useMutation<AgencyBrandingOutput, ApiError, File>({
    mutationFn: uploadLogoApi,
    onSuccess: (branding) => {
      queryClient.setQueryData(AGENCY_BRANDING_KEYS.all, branding);
      // El Sidebar toma el logo de la sesión (/auth/me).
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.session() });
      toast.success("Logotipo actualizado");
    },
    onError: (error) => {
      toast.error("No se pudo subir el logotipo", { description: error.message });
    },
  });
}

export function useRemoveAgencyLogo() {
  const queryClient = useQueryClient();

  return useMutation<AgencyBrandingOutput, ApiError, void>({
    mutationFn: removeLogoApi,
    onSuccess: (branding) => {
      queryClient.setQueryData(AGENCY_BRANDING_KEYS.all, branding);
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.session() });
      toast.success("Logotipo eliminado");
    },
    onError: (error) => {
      toast.error("No se pudo quitar el logotipo", { description: error.message });
    },
  });
}
