import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, type ApiError } from "@/lib/api-client";
import type { AgencyInput, AgencyOutput, AgencyPoliciesInput } from "../schemas/agency.schema";

// ============================================================================
// 1. QUERY KEY FACTORY (Patrón de Arquitectura Limpia)
// ============================================================================
export const AGENCY_KEYS = {
  all: ["agencies"] as const,
};

// ============================================================================
// 2. CAPA DE RED (Axios API Client)
// ============================================================================
const getAgencyApi = async (): Promise<AgencyOutput> => {
  return apiClient.get<never, AgencyOutput>(`/agencies`);
};

const updateAgencyApi = async (agencyData: AgencyInput): Promise<AgencyOutput> => {
  return apiClient.patch<never, AgencyOutput>(`/agencies/`, agencyData);
};

const updateAgencyPoliciesApi = async (
  body: AgencyPoliciesInput,
): Promise<{ policies: string | null }> => {
  return apiClient.patch<never, { policies: string | null }>(`/agencies/policies`, body);
};

// ============================================================================
// 3. HOOKS DE QUERIES (Lectura)
// ============================================================================
export function useAgency() {
  return useQuery({
    queryKey: AGENCY_KEYS.all,
    queryFn: getAgencyApi,
  });
}

// ============================================================================
// 4. HOOKS DE MUTACIONES (Escritura y Optimistic UI)
// ============================================================================
export function useUpdateAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAgencyApi,
    onSuccess: () => {
      toast.success("Configuración actualizada correctamente");
      queryClient.invalidateQueries({ queryKey: AGENCY_KEYS.all });
    },
    onError: (error: ApiError) => {
      toast.error("Ocurrió un error al guardar los datos.", {
        description: error.message || "No se pudo actualizar la información de la agencia.",
      });
    },
  });
}

/** Guarda las políticas generales de la agencia (se imprimen en el estado de cuenta PDF). */
export function useUpdateAgencyPolicies() {
  const queryClient = useQueryClient();

  return useMutation<{ policies: string | null }, ApiError, AgencyPoliciesInput>({
    mutationFn: updateAgencyPoliciesApi,
    onSuccess: ({ policies }) => {
      queryClient.setQueryData<AgencyOutput>(AGENCY_KEYS.all, (agency) =>
        agency ? { ...agency, policies } : agency,
      );
      toast.success(policies ? "Políticas guardadas" : "Políticas eliminadas", {
        description: "Se imprimirán en los próximos estados de cuenta PDF.",
      });
    },
    onError: (error) => {
      toast.error("No se pudieron guardar las políticas", { description: error.message });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: AGENCY_KEYS.all }),
  });
}
