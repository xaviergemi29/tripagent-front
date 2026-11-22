import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, type ApiError } from "@/lib/api-client";
import { TOUR_DASHBOARD_KEYS } from "@/shared/api/query-keys";
import type { StaffShareGenerateOutput } from "@/features/staff-share/schemas/staff-share.schema";
import type { TourDashboardOutput } from "../schemas/tour-dashboard.schema";

/**
 * Enlace de solo lectura del croquis y la lista para el coordinador (staff). Generar y regenerar son
 * la misma llamada: la API crea el enlace o reemplaza el anterior, que deja de servir. Ambas
 * mutaciones actualizan el Centro de Control (`staffShare` viaja en `GET /dashboards/:tourId`).
 */
export function useGenerateStaffShare(tourId: string) {
  const queryClient = useQueryClient();

  return useMutation<StaffShareGenerateOutput, ApiError, void>({
    mutationFn: () =>
      apiClient.post<never, StaffShareGenerateOutput>(`/tours/${tourId}/staff-share`),
    onSuccess: ({ token, expiresAt }) => {
      // Se refleja de inmediato en el diálogo; la invalidación confirma con la API.
      queryClient.setQueryData<TourDashboardOutput>(TOUR_DASHBOARD_KEYS.detail(tourId), (old) =>
        old ? { ...old, staffShare: { token, expiresAt, isExpired: false } } : old,
      );
      void queryClient.invalidateQueries({ queryKey: TOUR_DASHBOARD_KEYS.detail(tourId) });
      toast.success("Enlace para staff listo");
    },
    onError: (error) => {
      toast.error("No se pudo generar el enlace", { description: error.message });
    },
  });
}

export function useRevokeStaffShare(tourId: string) {
  const queryClient = useQueryClient();

  return useMutation<{ token: null }, ApiError, void>({
    mutationFn: () => apiClient.delete<never, { token: null }>(`/tours/${tourId}/staff-share`),
    onSuccess: () => {
      queryClient.setQueryData<TourDashboardOutput>(TOUR_DASHBOARD_KEYS.detail(tourId), (old) =>
        old ? { ...old, staffShare: null } : old,
      );
      void queryClient.invalidateQueries({ queryKey: TOUR_DASHBOARD_KEYS.detail(tourId) });
      toast.success("Enlace desactivado", {
        description: "El enlace anterior ya no muestra el croquis.",
      });
    },
    onError: (error) => {
      toast.error("No se pudo desactivar el enlace", { description: error.message });
    },
  });
}
