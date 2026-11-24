import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { AGENCY_SUBSCRIPTION_KEYS } from "@/shared/api/query-keys";
import type { ApiError } from "@/lib/api-client";
import type { CancelSubscriptionInput, SubscriptionOutput } from "../schemas/subscription.schema";

const getAgencySubscriptionApi = async (): Promise<SubscriptionOutput> =>
  apiClient.get<never, SubscriptionOutput>("/agencies/subscription");

/** Suscripción de la agencia de la sesión (estado, prueba, periodo pagado y baja programada). */
export function useAgencySubscription() {
  return useQuery({
    queryKey: AGENCY_SUBSCRIPTION_KEYS.all,
    queryFn: getAgencySubscriptionApi,
  });
}

/** Baja programada: conserva el acceso completo hasta la fecha de corte (solo ADMIN). */
export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiError, CancelSubscriptionInput>({
    mutationFn: (input) => apiClient.post("/agencies/subscription/cancel", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: AGENCY_SUBSCRIPTION_KEYS.all });
      toast.success("Cancelación programada", {
        description: "Conservas el acceso completo hasta tu fecha de corte.",
      });
    },
    onError: (error) =>
      toast.error("No se pudo cancelar la suscripción", { description: error.message }),
  });
}

/** Reactivar una baja programada antes de la fecha de corte (solo ADMIN). */
export function useReactivateSubscription() {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiError, void>({
    mutationFn: () => apiClient.post("/agencies/subscription/reactivate"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: AGENCY_SUBSCRIPTION_KEYS.all });
      toast.success("Suscripción reactivada", {
        description: "Te enviaremos el recordatorio de cobro por transferencia como siempre.",
      });
    },
    onError: (error) =>
      toast.error("No se pudo reactivar la suscripción", { description: error.message }),
  });
}
