import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { TravelerOutput } from "@/features/travelers/schemas/traveler.schema";

export function usePublicTravelerLookup(magicToken: string) {
  const queryClient = useQueryClient();

  const lookupTraveler = async (phone: string): Promise<TravelerOutput | null> => {
    if (!phone || phone.length !== 10) return null;

    try {
      const result = await queryClient.fetchQuery({
        queryKey: ["public-traveler-lookup", magicToken, phone],
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
    } catch (error) {
      // 🛡️ Silenciamos el error para que NUNCA afecte la experiencia del usuario ni redirija
      console.warn("Viajero no encontrado en catálogo previo");
      return null;
    }
  };

  return { lookupTraveler };
}
