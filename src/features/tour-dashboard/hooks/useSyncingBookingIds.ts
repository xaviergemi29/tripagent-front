import { useMutationState } from "@tanstack/react-query";
import { MUTATION_KEYS } from "@/shared/api/query-keys";

interface BookingGroupMutation {
  bookingId: string;
  status: "idle" | "pending" | "success" | "error";
  submittedAt: number;
}

interface DashboardFetchState {
  /** `dataUpdatedAt` de la consulta del Centro de Control. */
  dataUpdatedAt: number;
  isFetching: boolean;
}

/**
 * Reservas cuyo grupo está cambiando (baja de un acompañante o cancelación total): desde que se
 * envía la mutación hasta que llega el dashboard recargado. Una mutación ya exitosa cuenta mientras
 * el dashboard se esté recargando y sus datos sean anteriores a ella (`dataUpdatedAt < submittedAt`);
 * si la recarga falla, deja de contar y se muestran los datos en caché. Se deriva en el render,
 * sin estado propio.
 */
export function useSyncingBookingIds({
  dataUpdatedAt,
  isFetching,
}: DashboardFetchState): ReadonlySet<string> {
  const mutations = useMutationState<BookingGroupMutation | null>({
    filters: { mutationKey: MUTATION_KEYS.bookingGroupChange },
    select: (mutation) => {
      const variables = mutation.state.variables as { bookingId?: string } | undefined;
      if (!variables?.bookingId) return null;
      return {
        bookingId: variables.bookingId,
        status: mutation.state.status,
        submittedAt: mutation.state.submittedAt,
      };
    },
  });

  const syncing = new Set<string>();
  for (const mutation of mutations) {
    if (!mutation) continue;
    const isPending = mutation.status === "pending";
    const isAwaitingFreshData =
      mutation.status === "success" && isFetching && dataUpdatedAt < mutation.submittedAt;
    if (isPending || isAwaitingFreshData) syncing.add(mutation.bookingId);
  }
  return syncing;
}
