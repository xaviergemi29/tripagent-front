import { useState } from "react";
import {
  type DashboardFilters,
  EMPTY_DASHBOARD_FILTERS,
} from "@/features/tour-dashboard/utils/dashboard-travelers.util";

/**
 * Filtros de la lista de pasajeros del Centro de Control. Un solo estado para escritorio
 * (`TravelersTableToolbar`) y celular (`MobileFilters`), como la pestaña activa.
 */
export function useDashboardFilters() {
  const [filters, setFilters] = useState<DashboardFilters>(EMPTY_DASHBOARD_FILTERS);

  const setFilter =
    <K extends keyof DashboardFilters>(key: K) =>
    (value: DashboardFilters[K]): void =>
      setFilters((current) => ({ ...current, [key]: value }));

  return {
    filters,
    setSearchQuery: setFilter("searchQuery"),
    setPaymentFilter: setFilter("paymentFilter"),
    setFormFilter: setFilter("formFilter"),
    setSeatFilter: setFilter("seatFilter"),
    clearFilters: (): void => setFilters(EMPTY_DASHBOARD_FILTERS),
  };
}
