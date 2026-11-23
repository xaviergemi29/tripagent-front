/**
 * Pestañas del Centro de Control (`/tours/[id]`).
 *
 * Escritorio (`TourTabsNav`) y móvil (`MobileTabsNav`) comparten UN solo estado de pestaña en
 * `TourDashboardView`: así una acción ("Asignar asiento", asignar vehículo) lleva a la misma
 * pestaña sin importar el tamaño de pantalla, y al redimensionar no se pierde la vista activa.
 */
export const DASHBOARD_TABS = ["passengers", "seatmap", "lodging"] as const;
export type DashboardTab = (typeof DASHBOARD_TABS)[number];

/** Pestaña con la que abre el Centro de Control. */
export const DEFAULT_DASHBOARD_TAB: DashboardTab = "passengers";
