import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  MANIFEST_FORMAT_ERROR,
  tourManifestOutputSchema,
  type TourManifestOutput,
} from "../schemas/tour-manifest.schema";
import { TOUR_MANIFEST_KEYS } from "@/shared/api/query-keys";

const fetchTourManifestApi = async (tourId: string): Promise<TourManifestOutput> => {
  const response = await apiClient.get<{ data: TourManifestOutput }>(`/manifest/${tourId}/`);

  // Normalización defensiva según el interceptor de apiClient (res.data o res.data.data)
  const rawData = response?.data ?? response;

  // Validación en runtime: el schema tolera datos de presentación raros; si falta lo indispensable,
  // el operador ve un mensaje legible (no el volcado de un ZodError) y el detalle queda en consola.
  const parsed = tourManifestOutputSchema.safeParse(rawData);
  if (!parsed.success) {
    console.error("Manifiesto con formato inesperado", parsed.error.issues);
    throw new Error(MANIFEST_FORMAT_ERROR);
  }
  return parsed.data;
};

export function useTourManifest(tourId: string) {
  return useQuery({
    queryKey: TOUR_MANIFEST_KEYS.byTour(tourId),
    queryFn: () => fetchTourManifestApi(tourId),
    enabled: Boolean(tourId),
    staleTime: 1000 * 60 * 5, // 5 minutos de frescura
    gcTime: 1000 * 60 * 10, // Mantiene en caché 10 minutos
    retry: 1,
  });
}
