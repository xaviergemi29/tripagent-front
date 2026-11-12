import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { VehicleTemplateOutput } from "../schemas/vehicle.schema";

export const VEHICLE_TEMPLATE_KEYS = {
  all: ["vehicle-templates"] as const,
};

const fetchVehicleTemplatesApi = async (): Promise<VehicleTemplateOutput[]> =>
  apiClient.get<never, VehicleTemplateOutput[]>("/vehicle-templates");

/** Catálogo global de plantillas de TripAgent (cambia muy poco: se cachea 30 min). */
export function useVehicleTemplates() {
  return useQuery({
    queryKey: VEHICLE_TEMPLATE_KEYS.all,
    queryFn: fetchVehicleTemplatesApi,
    staleTime: 1000 * 60 * 30,
  });
}
