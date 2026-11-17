import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  TravelerHistoryOutput,
  TravelerInput,
  TravelerOutput,
} from "../schemas/traveler.schema";
import { apiClient, ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { TOUR_DASHBOARD_KEYS, TRAVELER_KEYS } from "@/shared/api/query-keys";
import { fetchAllPages } from "@/shared/api/fetch-all-pages";

// ============================================================================
// 2. CAPA DE RED (Axios API Client)
// ============================================================================
// Todas las páginas (la API entrega máximo 100 por página); el directorio filtra en el cliente.
const fetchTravelersApi = async (search?: string): Promise<TravelerOutput[]> => {
  return fetchAllPages<TravelerOutput>("/travelers", { search: search || undefined });
};

const updateTravelerApi = async ({
  travelerId,
  travelerData,
}: {
  travelerId: string;
  travelerData: TravelerInput;
}): Promise<TravelerOutput> => {
  return apiClient.patch<never, TravelerOutput>(`/travelers/${travelerId}`, travelerData);
};

const deleteTravelerApi = async (travelerId: string): Promise<TravelerOutput> => {
  return apiClient.delete<never, TravelerOutput>(`/travelers/${travelerId}`);
};

const fetchHistoryTravelerApi = async (travelerId: string): Promise<TravelerHistoryOutput> => {
  return apiClient.get<never, TravelerHistoryOutput>(`/travelers/${travelerId}/history`);
};

// =====================================================================z=======
// 3. HOOKS DE QUERIES (Lectura)
// ============================================================================
export function useTravelers(search?: string) {
  return useQuery({
    queryKey: TRAVELER_KEYS.lists(search),
    queryFn: () => fetchTravelersApi(search),
    staleTime: 1000 * 60,
    retry: 1,
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
          return await apiClient.get<never, TravelerOutput[]>("/travelers", {
            params: { search: cleanTerm },
          });
        },
        staleTime: 1000 * 60 * 5,
      });

      // La búsqueda de /travelers es parcial (nombre, correo y teléfono): solo cuenta el viajero cuyo
      // WhatsApp es exactamente el escrito (antes se tomaba el primer resultado, que podía ser otro
      // viajero con esos dígitos en el correo).
      const digits = cleanTerm.replace(/\D/g, "");
      return (
        results.find((traveler) => traveler.whatsappPhone?.replace(/\D/g, "") === digits) ?? null
      );
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
    enabled: !!travelerId,
    staleTime: 1000 * 60 * 5,
  });
}

// ============================================================================
// 4. HOOKS DE MUTACIONES (Escritura y Optimistic UI)
// ============================================================================
export function useUpdateTraveler() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTravelerApi,
    onSuccess: (data) => {
      queryClient.setQueryData(TRAVELER_KEYS.detail(data.id!), data);
      queryClient.invalidateQueries({ queryKey: TRAVELER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: TOUR_DASHBOARD_KEYS.all });
      toast.success("Viajero actualizado exitosamente");
    },
    onError: (error: ApiError) => {
      toast.error("Error al actualizar viajero", {
        description: error.message || "Revisa tu conexión e intenta de nuevo.",
      });
    },
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
      // Bajo ["travelers"] también viven el detalle y el historial (objetos, no listas): solo se
      // filtran las listas. Hasta el 2026-11-16 se llamaba `.filter` sobre todo, y con un historial
      // en caché la mutación fallaba antes de llamar a la API ("oldData.filter is not a function").
      queryClient.setQueriesData({ queryKey: TRAVELER_KEYS.all }, (oldData: unknown) =>
        Array.isArray(oldData)
          ? (oldData as TravelerOutput[]).filter((traveler) => traveler.id !== deletedId)
          : oldData,
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
      // Texto genérico: la API hace un borrado lógico (`deletedAt`), no uno permanente.
      toast.success("Se ha eliminado el viajero");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TRAVELER_KEYS.all });
    },
  });
}
