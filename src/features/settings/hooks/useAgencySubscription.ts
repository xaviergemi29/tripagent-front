import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AGENCY_SUBSCRIPTION_KEYS } from "@/shared/api/query-keys";
import type { SubscriptionOutput } from "../schemas/subscription.schema";

const getAgencySubscriptionApi = async (): Promise<SubscriptionOutput> =>
  apiClient.get<never, SubscriptionOutput>("/agencies/subscription");

/** Suscripción de la agencia de la sesión (solo lectura; la administra TripAgent). */
export function useAgencySubscription() {
  return useQuery({
    queryKey: AGENCY_SUBSCRIPTION_KEYS.all,
    queryFn: getAgencySubscriptionApi,
  });
}
