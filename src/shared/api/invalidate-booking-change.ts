import type { QueryClient } from "@tanstack/react-query";
import { TOUR_DASHBOARD_KEYS, TOUR_KEYS, TRAVELER_KEYS } from "./query-keys";

/**
 * Caché que cambia cuando cambia una reserva (apartado, alta o baja de lugar o pasajero,
 * cancelación, transferencia, abono, anulación o cancelación del tour). Única lista para todas las
 * mutaciones del Centro de Control (2026-11-16; antes cada hook refrescaba solo el dashboard):
 *
 * - Centro de Control: el tour indicado o, si la mutación no lo conoce, todos.
 * - `TOUR_KEYS.all`: listado de `/tours` (ocupación), detalle del tour (`hasPayments` del
 *   formulario) y croquis (`TOUR_SEAT_KEYS` cuelga de ["tours"]: una baja libera el asiento).
 * - `TRAVELER_KEYS.all`: lista de Viajeros (viajeros nuevos, viajes) e historial (LTV).
 *
 * `invalidateQueries` solo vuelve a pedir lo que está en pantalla; lo demás queda marcado como
 * obsoleto y se pide al volver a mostrarse.
 */
export function invalidateBookingChange(queryClient: QueryClient, tourId?: string) {
  queryClient.invalidateQueries({
    queryKey: tourId ? TOUR_DASHBOARD_KEYS.detail(tourId) : TOUR_DASHBOARD_KEYS.all,
  });
  queryClient.invalidateQueries({ queryKey: TOUR_KEYS.all });
  queryClient.invalidateQueries({ queryKey: TRAVELER_KEYS.all });
}
