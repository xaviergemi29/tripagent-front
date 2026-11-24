/**
 * Claves de React Query de toda la app (una sola fuente). Viven aquí, y no en cada hook, para que
 * una feature pueda invalidar la caché de otra sin importar sus hooks: así no hay importaciones
 * circulares entre features (antes `useTours` ↔ `useTourDashboard` ↔ `useTourSeats`).
 *
 * Regla: toda mutación que cambie datos que muestra el Centro de Control invalida
 * `TOUR_DASHBOARD_KEYS.detail(tourId)` (cuelga de ["tour-dashboard"], no de ["tours"]).
 */

export const AUTH_KEYS = {
  all: ["auth"] as const,
  session: () => [...AUTH_KEYS.all, "session"] as const,
};

export const AGENCY_KEYS = {
  all: ["agencies"] as const,
};

/** `GET /agencies/subscription` (Configuración → Suscripción y su insignia en la pestaña). */
export const AGENCY_SUBSCRIPTION_KEYS = {
  all: ["agency-subscription"] as const,
};

export const AGENCY_BRANDING_KEYS = {
  all: ["agency-branding"] as const,
};

export const TOUR_KEYS = {
  all: ["tours"] as const,
  lists: (search?: string) => [...TOUR_KEYS.all, { search }] as const,
  detail: (id: string) => [...TOUR_KEYS.all, "detail", id] as const,
};

/** Asientos de un tour. Cuelga de ["tours"]: invalidar `TOUR_KEYS.all` también la refresca. */
export const TOUR_SEAT_KEYS = {
  byTour: (tourId: string) => ["tours", tourId, "seats"] as const,
};

export const TOUR_DASHBOARD_KEYS = {
  all: ["tour-dashboard"] as const,
  detail: (tourId: string) => [...TOUR_DASHBOARD_KEYS.all, tourId] as const,
};

/** Pase de lista de abordaje (RB-MAN-002): Centro de Control y enlace de staff. */
export const BOARDING_KEYS = {
  byTour: (tourId: string) => ["boarding", "tour", tourId] as const,
  byStaffToken: (token: string) => ["boarding", "staff", token] as const,
};

export const TOUR_MANIFEST_KEYS = {
  byTour: (tourId: string) => ["tour-manifest", tourId] as const,
};

export const BOOKING_KEYS = {
  all: ["bookings"] as const,
  lists: (search?: string) => [...BOOKING_KEYS.all, { search }] as const,
  detail: (id: string) => [...BOOKING_KEYS.all, "detail", id] as const,
};

export const TRAVELER_KEYS = {
  all: ["travelers"] as const,
  lists: (search?: string) => [...TRAVELER_KEYS.all, { search }] as const,
  detail: (id: string) => [...TRAVELER_KEYS.all, "detail", id] as const,
  history: (id: string) => [...TRAVELER_KEYS.all, "history", id] as const,
};

/** Búsqueda pública de un viajero por teléfono desde el Magic Link. */
export const PUBLIC_TRAVELER_LOOKUP_KEYS = {
  byPhone: (magicToken: string, phone: string) =>
    ["public-traveler-lookup", magicToken, phone] as const,
};

export const VEHICLE_KEYS = {
  all: ["vehicles"] as const,
};

export const VEHICLE_TEMPLATE_KEYS = {
  all: ["vehicle-templates"] as const,
};

/** `GET /notifications` (campana del panel; polling cada 45 s). Compartido por la agencia. */
export const NOTIFICATION_KEYS = {
  all: ["notifications"] as const,
};

/** `GET /lodging/:tourId` (hoteles y habitaciones del tour; pestaña Hospedaje). */
export const LODGING_KEYS = {
  all: ["lodging"] as const,
  detail: (tourId: string) => [...LODGING_KEYS.all, tourId] as const,
};
