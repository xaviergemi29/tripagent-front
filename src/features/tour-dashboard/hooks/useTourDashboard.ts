import { useQuery } from "@tanstack/react-query";
import { TourDashboardOutput } from "../schemas/tourDashboardSchema";
import { apiClient } from "@/lib/api-client";


// ============================================================================
// 2. CAPA DE RED (Axios API Client)
// ============================================================================
const fetchDashboardByTourId = async (tourId: string): Promise<TourDashboardOutput> => {
  return apiClient.get<never, TourDashboardOutput>(`/dashboards/${tourId}`);
}

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