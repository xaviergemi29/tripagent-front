import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { tourManifestOutputSchema, type TourManifestOutput } from "../schemas/tour-manifest.schema";

const fetchTourManifestApi = async (tourId: string): Promise<TourManifestOutput> => {
  const response = await apiClient.get<{ data: TourManifestOutput }>(`/manifest/${tourId}/`);

  // Normalización defensiva según el interceptor de apiClient (res.data o res.data.data)
  const rawData = response?.data ?? response;

  // Validación en runtime con Zod para garantizar type-safety absoluto en la vista de impresión
  return tourManifestOutputSchema.parse(rawData);
};

export function useTourManifest(tourId: string) {
  return useQuery({
    queryKey: ["tour-manifest", tourId],
    queryFn: () => fetchTourManifestApi(tourId),
    enabled: Boolean(tourId),
    staleTime: 1000 * 60 * 5, // 5 minutos de frescura
    gcTime: 1000 * 60 * 10, // Mantiene en caché 10 minutos
    retry: 1,
  });
}
