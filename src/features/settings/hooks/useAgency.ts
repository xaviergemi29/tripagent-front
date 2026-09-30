import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { UpdateAgencyBody } from "../schemas/agency.schema";

const getAgencyApi = async (): Promise<UpdateAgencyBody> => {
  return apiClient.get<never, UpdateAgencyBody>(`/agencies`);
};

export function useAgency() {
  return useQuery({
    queryKey: ["agency"],
    queryFn: () => getAgencyApi(),
  });
}

const updateAgencyApi = async ({ tourData }: { tourData: UpdateAgencyBody }): Promise<any> => {
  return apiClient.patch<never, any>(`/agencies/`, tourData);
};

export function useUpdateAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAgencyApi,
    onSuccess: () => {
      toast.success("Configuración actualizada correctamente");
      queryClient.invalidateQueries({ queryKey: ["agency"] });
    },
    onError: (error) => {
      toast.error("Ocurrió un error al guardar los datos.");
      console.error(error);
    },
  });
}
