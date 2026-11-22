import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, type ApiError } from "@/lib/api-client";
import { NOTIFICATION_KEYS } from "@/shared/api/query-keys";
import type { NotificationsOutput } from "../schemas/notification.schema";

/** Polling de la campana: el contador se actualiza sin recargar la página. */
export const NOTIFICATIONS_REFETCH_MS = 45_000;

// ============================================================================
// 1. CAPA DE RED
// ============================================================================
const getNotificationsApi = (): Promise<NotificationsOutput> =>
  apiClient.get<never, NotificationsOutput>("/notifications");

const markNotificationReadApi = (id: string): Promise<unknown> =>
  apiClient.patch(`/notifications/${id}/read`);

const markAllNotificationsReadApi = (): Promise<unknown> =>
  apiClient.patch("/notifications/read-all");

// ============================================================================
// 2. HOOKS
// ============================================================================
/**
 * Últimas 20 notificaciones de la agencia + no leídas. Se vuelve a pedir cada 45 s solo con la
 * pestaña visible (`refetchIntervalInBackground: false`: TanStack omite los ticks sin foco, y el
 * navegador además estrangula los temporizadores de pestañas ocultas).
 *
 * Por eso, al volver a la pestaña o recuperar la conexión se pide de inmediato si los datos ya
 * pasaron `staleTime` (45 s). El `QueryClient` global apaga `refetchOnWindowFocus`; aquí se
 * reactiva solo para esta query.
 */
export function useNotifications() {
  return useQuery<NotificationsOutput, ApiError>({
    queryKey: NOTIFICATION_KEYS.all,
    queryFn: getNotificationsApi,
    refetchInterval: NOTIFICATIONS_REFETCH_MS,
    refetchIntervalInBackground: false,
    // Con el polling, la caché de 5 min por defecto haría que al volver a la pestaña se viera viejo.
    staleTime: NOTIFICATIONS_REFETCH_MS,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

/** Contexto de la actualización optimista: datos previos para revertir. */
interface OptimisticContext {
  previous?: NotificationsOutput;
}

/** Marca una notificación como leída (para toda la agencia), con actualización optimista. */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation<unknown, ApiError, string, OptimisticContext>({
    mutationFn: markNotificationReadApi,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_KEYS.all });
      const previous = queryClient.getQueryData<NotificationsOutput>(NOTIFICATION_KEYS.all);
      if (previous) {
        const wasUnread = previous.items.some((item) => item.id === id && !item.isRead);
        queryClient.setQueryData<NotificationsOutput>(NOTIFICATION_KEYS.all, {
          items: previous.items.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
          unreadCount: Math.max(0, previous.unreadCount - (wasUnread ? 1 : 0)),
        });
      }
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(NOTIFICATION_KEYS.all, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all }),
  });
}

/** Marca como leídas todas las pendientes de la agencia, con actualización optimista. */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation<unknown, ApiError, void, OptimisticContext>({
    mutationFn: markAllNotificationsReadApi,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_KEYS.all });
      const previous = queryClient.getQueryData<NotificationsOutput>(NOTIFICATION_KEYS.all);
      if (previous) {
        queryClient.setQueryData<NotificationsOutput>(NOTIFICATION_KEYS.all, {
          items: previous.items.map((item) => ({ ...item, isRead: true })),
          unreadCount: 0,
        });
      }
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(NOTIFICATION_KEYS.all, context.previous);
      toast.error("No se pudieron marcar como leídas", { description: error.message });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all }),
  });
}
