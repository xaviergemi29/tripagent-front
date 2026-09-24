import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TourDashboardOutput } from "../schemas/tour-dashboard.schema";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

// ============================================================================
// 2. CAPA DE RED (Axios API Client)
// ============================================================================
const fetchDashboardByTourId = async (tourId: string): Promise<TourDashboardOutput> => {
  return apiClient.get<never, TourDashboardOutput>(`/dashboards/${tourId}`);
};

const fetchVehicles = async (): Promise<TourDashboardOutput> => {
  return apiClient.get(`/vehicles`);
};

// ============================================================================
// 3. HOOKS DE QUERIES (Lectura)
// ============================================================================
export function useTourDashboardByTourId(tourId: string) {
  return useQuery({
    queryKey: ["tour-dashboard", tourId],
    queryFn: () => fetchDashboardByTourId(tourId),
    enabled: !!tourId,
    staleTime: 1000 * 60 * 5, // 5 minutos de frescura
    retry: 1,
  });
}
export function useVehicles() {
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: fetchVehicles,
  });
}

export function useAssignVehicleToTour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tourId, vehicleId }: { tourId: string; vehicleId: string }) =>
      apiClient.patch(`/tours/${tourId}/vehicle`, { vehicleId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tour-dashboard", variables.tourId] });
      toast.success("Vehículo asignado correctamente");
    },
    onError: () => toast.error("Error al asignar el vehículo"),
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
    onError: () => toast.error("Error al crear la plantilla"),
  });
}
