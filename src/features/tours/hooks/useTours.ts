import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TourOutput, TourInput } from "../schemas/tour.schema";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

// ============================================================================
// 1. QUERY KEY FACTORY (Patrón de Arquitectura Limpia)
// ============================================================================
export const TOUR_KEYS = {
  all: ["tours"] as const,
  lists: (search?: string) => [...TOUR_KEYS.all, { search }] as const,
  detail: (id: string) => [...TOUR_KEYS.all, "detail", id] as const,
};

// ============================================================================
// 2. CAPA DE RED (Axios API Client)
// ============================================================================
const fetchTours = async (search?: string): Promise<TourOutput[]> => {
  return apiClient.get<never, TourOutput[]>("/tours", {
    params: search ? { search } : undefined,
  });
};

const fetchTourById = async (id: string): Promise<TourOutput> => {
  return apiClient.get<never, TourOutput>(`/tours/${id}`);
};

const createTourApi = async (tourData: TourInput): Promise<TourOutput> => {
  return apiClient.post<never, TourOutput>(`/tours`, tourData);
};

const toggleTourStatus = async (payload: {
  id: string;
  isActive: boolean;
}): Promise<TourOutput> => {
  return apiClient.patch<never, TourOutput>(`/tours/${payload.id}`, {
    isActive: payload.isActive,
  });
};

const deleteTourApi = async (travelerId: string): Promise<void> => {
  return apiClient.delete(`/tours/${travelerId}`);
};

const updateTourApi = async ({
  tourId,
  tourData,
}: {
  tourId: string;
  tourData: TourInput;
}): Promise<TourOutput> => {
  return apiClient.patch<never, TourOutput>(`/tours/${tourId}`, tourData);
};

// ============================================================================
// 3. HOOKS DE QUERIES (Lectura)
// ============================================================================
export function useTours(search?: string) {
  return useQuery({
    queryKey: TOUR_KEYS.lists(search),
    queryFn: () => fetchTours(search),
    retry: 1,
  });
}

export function useTourById(id: string | undefined) {
  return useQuery({
    queryKey: TOUR_KEYS.detail(id as string),
    queryFn: () => fetchTourById(id as string),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos de frescura
    retry: 1,
  });
}

// ============================================================================
// 4. HOOKS DE MUTACIONES (Escritura y Optimistic UI)
// ============================================================================
export const useCreateTour = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTourApi,
    onSuccess: (_, __, context: any) => {
      queryClient.invalidateQueries({ queryKey: TOUR_KEYS.all });
      toast.success("Tour creado exitosamente");
      // Si el componente pasó un callback, lo ejecutamos
      if (context?.onSuccess) context.onSuccess();
    },
    onError: (error: Error) => {
      toast.error("Error al crear el tour", {
        description: error?.message || "No se pudo crear el tour",
      });
    },
  });
};

export function useUpdateTour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTourApi,
    onSuccess: (data, _, context: any) => {
      queryClient.setQueryData(TOUR_KEYS.detail(data.id!), data);
      queryClient.invalidateQueries({ queryKey: TOUR_KEYS.lists() });
      toast.success("Tour actualizado exitosamente");
      if (context?.onSuccess) context.onSuccess();
    },
    onError: (error: Error) => {
      toast.error("Error al actualizar", {
        description: error?.message || "Revisa al actualizar el tour.",
      });
    },
  });
}

export function useToggleTourStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleTourStatus,
    onMutate: async (newStatus) => {
      await queryClient.cancelQueries({ queryKey: TOUR_KEYS.all });
      const previousTours = queryClient.getQueryData<TourOutput[]>(TOUR_KEYS.all);

      if (previousTours) {
        queryClient.setQueryData<TourOutput[]>(
          TOUR_KEYS.all,
          previousTours.map((tour) =>
            tour.id === newStatus.id ? { ...tour, isActive: newStatus.isActive } : tour,
          ),
        );
      }

      return { previousTours };
    },
    onError: (err, newStatus, context) => {
      if (context?.previousTours) {
        queryClient.setQueryData(TOUR_KEYS.all, context.previousTours);
      }
      toast.error("Error al actualizar estado", {
        description: "No se pudo sincronizar el cambio con el servidor.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TOUR_KEYS.all });
    },
  });
}

export function useDeleteTour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTourApi,
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: TOUR_KEYS.all });
      const previousTours = queryClient.getQueryData<TourOutput[]>(TOUR_KEYS.all);

      if (previousTours) {
        queryClient.setQueryData<TourOutput[]>(
          TOUR_KEYS.all,
          previousTours.filter((tour) => tour.id !== deletedId),
        );
      }

      return { previousTours };
    },
    onSuccess: () => {
      toast.success("Tour eliminado", {
        description: "El registro fue borrado permanentemente de la base de datos.",
      });
    },
    onError: (err, _, context) => {
      if (context?.previousTours) {
        queryClient.setQueryData(TOUR_KEYS.all, context.previousTours);
      }
      toast.error("Error al eliminar el tour", {
        description: err.message || "La operación no pudo completarse.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TOUR_KEYS.all });
    },
  });
}
