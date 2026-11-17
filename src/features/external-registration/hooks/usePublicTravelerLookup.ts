import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { TravelerOutput } from "@/features/travelers/schemas/traveler.schema";
import { PUBLIC_TRAVELER_LOOKUP_KEYS } from "@/shared/api/query-keys";

export function usePublicTravelerLookup(magicToken: string) {
  const queryClient = useQueryClient();

  /** `phone` en E.164 (axios codifica el "+" como %2B en la query). */
  const lookupTraveler = async (phone: string): Promise<TravelerOutput | null> => {
    if (!phone) return null;

    try {
      const result = await queryClient.fetchQuery({
        queryKey: PUBLIC_TRAVELER_LOOKUP_KEYS.byPhone(magicToken, phone),
        queryFn: async () => {
          // Petición a la ruta pública enviando el token en la URL
          return await apiClient.get<never, TravelerOutput>(
            `/magic-tokens/${magicToken}/lookup-traveler`,
            {
              params: { phone },
            },
          );
        },
        staleTime: 1000 * 60 * 10, // 10 min de caché
      });

      return result || null;
    } catch {
      // 🛡️ Silenciamos el error para que NUNCA afecte la experiencia del usuario ni redirija
      console.warn("Viajero no encontrado en catálogo previo");
      return null;
    }
  };

  return { lookupTraveler };
}
