import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TourDashboardOutput, VehicleDTO } from "../schemas/tour-dashboard.schema";
import { apiClient, ApiError } from "@/lib/api-client";
import { toast } from "sonner";

interface AssignVehiclePayload {
  tourId: string;
  vehicleId: string;
  resetOrphans?: boolean; // 🚀 Nueva flag para el backend
}

// ============================================================================
// 1. CAPA DE RED (Axios API Client)
// ============================================================================
const fetchDashboardByTourIdApi = async (tourId: string): Promise<TourDashboardOutput> => {
  return apiClient.get<never, TourDashboardOutput>(`/dashboards/${tourId}`);
};

const fetchVehiclesApi = async (): Promise<VehicleDTO[]> => {
  return apiClient.get<never, VehicleDTO[]>(`/vehicles`);
};

// ============================================================================
// 2. HOOKS DE QUERIES (Lectura)
// ============================================================================
export function useTourDashboardByTourId(tourId: string) {
  return useQuery({
    queryKey: ["tour-dashboard", tourId],
    queryFn: () => fetchDashboardByTourIdApi(tourId),
    enabled: !!tourId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
export function useVehicles() {
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: fetchVehiclesApi,
  });
}

// ============================================================================
// 3. HOOKS DE MUTACIONES (Escritura y Optimistic UI)
// ============================================================================
export function useAssignVehicleToTour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tourId, vehicleId, resetOrphans }: AssignVehiclePayload) =>
      apiClient.patch(`/tours/${tourId}/vehicle`, { vehicleId, resetOrphans }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tour-dashboard", variables.tourId] });
      toast.success("Vehículo asignado y mapa actualizado");
    },
    onError: (error: ApiError) => {
      toast.error("Error al asignar el vehículo", {
        description: error.message || "No se pudo completar la asignación",
      });
    },
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { name: string; layoutMap: (string | null)[][] }) =>
      apiClient.post("/vehicles", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Plantilla de vehículo creada");
    },
    onError: (error: ApiError) => {
      toast.error("Error al crear la plantilla", {
        description: error.message || "No se pudo crear la plantilla",
      });
    },
  });
}
