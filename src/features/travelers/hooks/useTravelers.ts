import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TravelerInput, TravelerOutput } from "../schemas/travelerSchema";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export interface UpdateTravelerPayload {
  id: string;
  travelerData: TravelerInput;
}

// ============================================================================
// 1. QUERY KEY FACTORY (Patrón de Arquitectura Limpia)
// ============================================================================
export const TRAVELER_KEYS = {
  all: ["travelers"] as const,
  lists: (search?: string) => [...TRAVELER_KEYS.all, { search }] as const,
  detail: (id: string) => [...TRAVELER_KEYS.all, "detail", id] as const,
  history: (id: string) => [...TRAVELER_KEYS.all, "history", id] as const,
};

// ============================================================================
// 2. CAPA DE RED (Axios API Client)
// ============================================================================
const createTravalerApi = async (travelerData: TravelerInput): Promise<TravelerOutput> => {
  return apiClient.post<never, TravelerOutput>("travelers", travelerData);
}

const fetchTravelersApi = async (search?: string): Promise<TravelerOutput[]> => {
  return apiClient.get<never, TravelerOutput[]>('/travelers', {
    params: search ? { search } : undefined
  });
};

const updateTravelerApi = async ({ travelerId, travelerUpdated }: { travelerId: string, travelerUpdated: TravelerInput }): Promise<TravelerOutput> => {
  return apiClient.patch<never, TravelerOutput>(`/travelers/${travelerId}`, travelerUpdated);
};

const deleteTravelerApi = async (travelerId: string): Promise<TravelerOutput> => {
  return apiClient.delete<never, TravelerOutput>(`/travelers/${travelerId}`);
};

const fetchHistoryTravelerApi = async (travelerId: string): Promise<any> => {
  return apiClient.get<never, any>(`/travelers/${travelerId}/history`)
};

// ============================================================================
// 3. HOOKS DE QUERIES (Lectura)
// ============================================================================
export function useTravelers(search?: string) {
  return useQuery({
    queryKey: TRAVELER_KEYS.lists(search),
    queryFn: () => fetchTravelersApi(search),
    staleTime: 1000 * 60, // 1 minuto de frescura
    retry: 1
  });
}

export function useTravelerLookup() {
  const queryClient = useQueryClient();

  // Función imperativa optimizada con caché de TanStack Query
  const lookupTraveler = async (term: string): Promise<TravelerOutput | null> => {
    if (!term || term.trim().length < 3) return null;

    const cleanTerm = term.trim();

    try {
      // queryClient.fetchQuery reutiliza la caché si ya existe la búsqueda,
      // evitando llamadas innecesarias a la red si el usuario vuelve a tipear lo mismo.
      const results = await queryClient.fetchQuery({
        queryKey: [...TRAVELER_KEYS.all, "lookup", cleanTerm],
        queryFn: async () => {
          return await apiClient.get<never, TravelerOutput[]>('/travelers', {
            params: { search: cleanTerm }
          });
        },
        staleTime: 1000 * 60 * 5, // 5 minutos de caché para resultados de búsqueda
      });

      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error("Error buscando viajero existente:", error);
      return null;
    }
  };

  return { lookupTraveler };
}

export function useTravelerHistory(travelerId: string | null) {
  return useQuery({
    queryKey: TRAVELER_KEYS.history(travelerId!),
    queryFn: () => fetchHistoryTravelerApi(travelerId!),
    enabled: !!travelerId, // 👈 LA MAGIA: Solo hace la petición HTTP si el ID no es nulo
    staleTime: 1000 * 60 * 5, // Cacheamos 5 minutos para evitar peticiones si abre y cierra el Drawer
  })
}

// ============================================================================
// 4. HOOKS DE MUTACIONES (Escritura y Optimistic UI)
// ============================================================================
export function useCreateTraveler() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTravalerApi,
    onSuccess: (_, __, context: any) => {
      queryClient.invalidateQueries({ queryKey: TRAVELER_KEYS.all });
      toast.success("Viajero creado exitosamente");
      // Si el componente pasó un callback, lo ejecutamos
      if (context?.onSuccess) context.onSuccess();
    },
    onError: (error: any) => {
      toast.error("Error al crear el tour", {
        description: error.message || "No se pudo guardar la información",
      });
    },
  })
}

export function useUpdateTraveler() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTravelerApi,
    onSuccess: (data, _variables, context: any) => {
      queryClient.setQueryData(TRAVELER_KEYS.detail(data.id!), data);
      queryClient.invalidateQueries({ queryKey: TRAVELER_KEYS.all });
      toast.success("Viajero actualizado exitosamente");
      if (context?.onSuccess) context.onSuccess();
    },
    onError: (error: any) => {
      toast.error("Error al actualizar viajero", {
        description: error.message || "Revisa tu conexión e intenta de nuevo.",
      });
    }
  });
}

export function useDeleteTraveler() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTravelerApi,
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: TRAVELER_KEYS.all });

      const previousQueries = queryClient.getQueriesData<TravelerOutput[]>({
        queryKey: TRAVELER_KEYS.all,
      });
      queryClient.setQueriesData<TravelerOutput[]>(
        { queryKey: TRAVELER_KEYS.all },
        (oldData) => {
          return oldData ? oldData.filter((traveler) => traveler.id !== deletedId) : [];
        }
      );

      return { previousQueries };
    },
    onError: (err, _deletedId, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      toast.error("Error al eliminar", {
        description: err.message || "La operación no pudo completarse.",
      });
    },
    onSuccess: () => {
      toast.success("Viajero eliminado", {
        description: "El registro fue borrado permanentemente de la base de datos."
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TRAVELER_KEYS.all });
    },
  });
}

